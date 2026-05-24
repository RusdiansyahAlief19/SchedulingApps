import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requireAppUserId } from "@/lib/app-user";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import ScheduleGrid from "./ScheduleGrid";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = await requireAppUserId();
  const supabase = getSupabaseAdminClient();

  const { data: schedules } = await supabase
    .from("schedules")
    .select("*, courses(name)")
    .eq("user_id", userId);

  return <ScheduleGrid initialSchedules={schedules || []} />;
}
