import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncClassroomCourses, syncClassroomTasks } from "@/lib/google/classroom";

export const maxDuration = 300; // 5 minutes max duration for vercel cron

export async function GET(request: Request) {
  // Simple auth for cron (optional, but good practice if not using Vercel's built-in cron header protection)
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("id")
    .not("google_refresh_token", "is", null);

  if (error || !users) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  let totalCourses = 0;
  let totalTasks = 0;

  for (const user of users) {
    try {
      const coursesSynced = await syncClassroomCourses(user.id);
      totalCourses += coursesSynced;
      
      const tasksSynced = await syncClassroomTasks(user.id);
      totalTasks += tasksSynced;

      // Success

    } catch (err: any) {
      console.error(`Classroom sync failed for user ${user.id}:`, err);
      // Failed

    }
  }

  return NextResponse.json({
    success: true,
    usersProcessed: users.length,
    totalCourses,
    totalTasks
  });
}
