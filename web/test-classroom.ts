import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: users } = await supabase.from("users").select("*").not("google_refresh_token", "is", null);
  console.log("Users with refresh token:", users?.length);

  if (!users || users.length === 0) return;

  const user = users[0];
  console.log("Testing user:", user.email);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: user.google_refresh_token });

  const classroom = google.classroom({ version: "v1", auth: oauth2Client });

  try {
    const coursesRes = await classroom.courses.list({ courseStates: ["ACTIVE"], studentId: "me" });
    const courses = coursesRes.data.courses || [];
    console.log("Found courses:", courses.length);
    
    if (courses.length > 0) {
      console.log("First course:", courses[0].name);
      const courseId = courses[0].id!;

      // Try coursework
      const cwRes = await classroom.courses.courseWork.list({ 
        courseId,
        orderBy: 'dueDate asc'
      });
      console.log(`Coursework for ${courseId}:`, cwRes.data.courseWork?.length || 0);
      if (cwRes.data.courseWork?.length) {
        console.log("First task:", cwRes.data.courseWork[0].title);
      }
    }
  } catch (err: any) {
    console.error("API Error:", err.message);
  }
}

run();
