'use server';

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAppUserId } from "@/lib/app-user";
import { revalidatePath } from "next/cache";

export async function addManualSchedule(data: {
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}) {
  const userId = await requireAppUserId();
  const supabase = getSupabaseAdminClient();

  const { data: newSchedule, error } = await supabase.from('schedules').insert({
    user_id: userId,
    title: data.title,
    day_of_week: data.dayOfWeek,
    start_time: data.startTime + ':00',
    end_time: data.endTime + ':00',
    source: 'manual',
    is_recurring: data.isRecurring,
    recurrence_rule: data.isRecurring ? 'RRULE:FREQ=WEEKLY' : null
  }).select('id').single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/schedule');
  
  // Note: we can trigger google calendar sync here asynchronously
  // fetch(process.env.NEXT_PUBLIC_SITE_URL + '/api/sync/manual_calendar?id=' + newSchedule.id)
  
  return newSchedule;
}
