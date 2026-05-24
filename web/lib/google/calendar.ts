import { google } from "googleapis";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getGoogleAuthClient } from "./auth";

export async function createCalendarEvent(userId: string, taskId: string) {
  const supabase = getSupabaseAdminClient();

  // Get task details
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*, courses(name)")
    .eq("id", taskId)
    .single();

  if (taskError || !task) {
    throw new Error(`Task ${taskId} not found`);
  }

  if (!task.deadline) {
    throw new Error("Task has no deadline");
  }

  if (task.google_calendar_event_id) {
    // Event already exists, we could update it, but for simplicity let's just return
    return task.google_calendar_event_id;
  }

  const auth = await getGoogleAuthClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const deadlineDate = new Date(task.deadline);
  // Let's create an event that spans 1 hour ending at the deadline
  const startDate = new Date(deadlineDate.getTime() - 60 * 60 * 1000); 

  const courseName = task.courses?.name ? `[${task.courses.name}] ` : '';
  const title = `Deadline: ${courseName}${task.title}`;

  const event = {
    summary: title,
    description: `${task.description || ''}\n\nLink: ${task.external_url || ''}`,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: deadlineDate.toISOString(),
      timeZone: 'UTC',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 2 * 60 },  // 2 hours before
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    const eventId = response.data.id;

    if (eventId) {
      await supabase
        .from("tasks")
        .update({ google_calendar_event_id: eventId })
        .eq("id", taskId);
    }

    return eventId;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw error;
  }
}

export async function syncScheduleToCalendar(userId: string, scheduleId: string) {
  const supabase = getSupabaseAdminClient();

  const { data: schedule, error } = await supabase
    .from("schedules")
    .select("*, courses(name)")
    .eq("id", scheduleId)
    .single();

  if (error || !schedule) {
    throw new Error(`Schedule ${scheduleId} not found`);
  }

  if (schedule.google_calendar_event_id) {
    return schedule.google_calendar_event_id;
  }

  const auth = await getGoogleAuthClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  // Calculate the first occurrence date
  const now = new Date();
  let targetDate = new Date();
  // Ensure the targetDate is in the future or today
  targetDate.setDate(now.getDate() + (schedule.day_of_week + 7 - now.getDay()) % 7);
  const dateStr = targetDate.toISOString().split('T')[0];

  const [startH, startM] = schedule.start_time.split(':');
  const [endH, endM] = schedule.end_time.split(':');

  const startDateTime = `${dateStr}T${startH}:${startM}:00`;
  const endDateTime = `${dateStr}T${endH}:${endM}:00`;

  let title = schedule.title || "Jadwal Pribadi";
  if (schedule.courses?.name) {
    title = schedule.courses.name;
    if (schedule.source === 'siam' || schedule.source === 'brone') {
      title = `[Kuliah] ${title}`;
    }
  }

  const event: any = {
    summary: title,
    description: `Ruang: ${schedule.room || '-'}\nDosen: ${schedule.lecturer || '-'}`,
    start: {
      dateTime: startDateTime,
      timeZone: 'Asia/Jakarta',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Asia/Jakarta',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 }, // 1 hour before
      ],
    },
  };

  if (schedule.is_recurring) {
    event.recurrence = [schedule.recurrence_rule || 'RRULE:FREQ=WEEKLY'];
  }

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    const eventId = response.data.id;

    if (eventId) {
      await supabase
        .from("schedules")
        .update({ google_calendar_event_id: eventId })
        .eq("id", scheduleId);
    }

    return eventId;
  } catch (err) {
    console.error("Error creating schedule calendar event:", err);
    throw err;
  }
}

