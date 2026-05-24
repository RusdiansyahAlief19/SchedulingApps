import { google } from "googleapis";
import { getGoogleAuthClient } from "./auth";

async function run() {
  const auth = await getGoogleAuthClient("c58449ce-fa04-4dea-b28c-49f5ffb54f10"); // user id
  const classroom = google.classroom({ version: 'v1', auth });

  const response = await classroom.courses.list({
    courseStates: ['ACTIVE'],
    studentId: 'me',
  });
  
  const course = response.data.courses?.[0];
  if (!course) return console.log("No courses");
  console.log("Course:", course.name);
  
  const subResponse = await classroom.courses.courseWork.studentSubmissions.list({
    courseId: course.id,
    courseWorkId: '-',
    userId: 'me',
  });
  
  console.log("Submissions count:", subResponse.data.studentSubmissions?.length);
  if (subResponse.data.studentSubmissions?.length) {
    console.log("First sub state:", subResponse.data.studentSubmissions[0].state);
    console.log("First sub:", subResponse.data.studentSubmissions[0]);
  }
}
run();
