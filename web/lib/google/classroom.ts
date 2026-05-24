import { google } from "googleapis";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getGoogleAuthClient } from "./auth";

export async function syncClassroomCourses(userId: string) {
  const auth = await getGoogleAuthClient(userId);
  const classroom = google.classroom({ version: 'v1', auth });

  const response = await classroom.courses.list({
    courseStates: ['ACTIVE'],
    studentId: 'me', // Fetch courses where the user is a student
  });

  const courses = response.data.courses || [];
  const supabase = getSupabaseAdminClient();

  for (const course of courses) {
    if (!course.id || !course.name) continue;

    // Manual upsert to avoid partial index issues
    const { data: existingCourse } = await supabase
      .from("courses")
      .select("id")
      .eq("user_id", userId)
      .eq("source", "classroom")
      .eq("classroom_course_id", course.id)
      .single();

    if (existingCourse) {
      const { error } = await supabase.from("courses").update({
        name: course.name,
        code: course.section || null,
      }).eq("id", existingCourse.id);
      if (error) console.error("Error updating course:", error);
    } else {
      const { error } = await supabase.from("courses").insert({
        user_id: userId,
        name: course.name,
        code: course.section || null,
        source: "classroom",
        classroom_course_id: course.id,
      });
      if (error) console.error("Error inserting course:", error);
    }
  }

  return courses.length;
}

export async function syncClassroomTasks(userId: string) {
  const auth = await getGoogleAuthClient(userId);
  const classroom = google.classroom({ version: 'v1', auth });
  const supabase = getSupabaseAdminClient();

  // Get user's classroom courses from DB
  const { data: dbCourses, error: courseError } = await supabase
    .from("courses")
    .select("id, classroom_course_id")
    .eq("user_id", userId)
    .eq("source", "classroom")
    .not("classroom_course_id", "is", null);

  if (courseError || !dbCourses) {
    console.error("Error fetching courses for task sync:", courseError);
    return 0;
  }

  let tasksSynced = 0;

  for (const dbCourse of dbCourses) {
    const courseId = dbCourse.classroom_course_id;
    if (!courseId) continue;

    try {
      // Get course work
      const response = await classroom.courses.courseWork.list({
        courseId: courseId,
        orderBy: 'dueDate asc',
      });
      const workItems = response.data.courseWork || [];

      // Get student submissions for ALL coursework in this course
      const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
        courseId: courseId,
        courseWorkId: '-',
        userId: 'me',
      });
      const submissions = submissionsResponse.data.studentSubmissions || [];
      
      // Map coursework ID to submission state
      const submissionMap = new Map();
      for (const sub of submissions) {
        if (sub.courseWorkId && sub.state) {
          submissionMap.set(sub.courseWorkId, sub.state);
        }
      }

      for (const work of workItems) {
        if (!work.id || !work.title) continue;

        let deadline = null;
        if (work.dueDate) {
          const year = work.dueDate.year;
          const month = work.dueDate.month || 1;
          const day = work.dueDate.day || 1;
          const hours = work.dueTime?.hours || 23;
          const minutes = work.dueTime?.minutes || 59;
          const seconds = work.dueTime?.seconds || 59;
          
          deadline = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds)).toISOString();
        }

        // Determine status from submission
        const subState = submissionMap.get(work.id);
        let status = "BELUM";
        if (subState === "TURNED_IN" || subState === "RETURNED") {
          status = "SELESAI";
        }

        // Manual upsert to avoid partial index issues
        const { data: existingTask } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", userId)
          .eq("source", "classroom")
          .eq("classroom_coursework_id", work.id)
          .single();

        if (existingTask) {
          const { error } = await supabase.from("tasks").update({
            course_id: dbCourse.id,
            title: work.title,
            description: work.description || null,
            deadline: deadline,
            status: status,
            external_url: work.alternateLink,
          }).eq("id", existingTask.id);
          if (error) {
            console.error("Error updating task:", error);
          } else {
            tasksSynced++;
          }
        } else {
          const { error } = await supabase.from("tasks").insert({
            user_id: userId,
            course_id: dbCourse.id,
            title: work.title,
            description: work.description || null,
            deadline: deadline,
            status: status,
            source: "classroom",
            external_url: work.alternateLink,
            classroom_coursework_id: work.id,
          });
          if (error) {
            console.error("Error inserting task:", error);
          } else {
            tasksSynced++;
          }
        }
      }
    } catch (err) {
      console.error(`Failed to sync tasks for course ${courseId}:`, err);
    }
  }

  return tasksSynced;
}
