import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { scrapeSiamSchedule } from "@/lib/scraper/siam";
import { syncScheduleToCalendar } from "@/lib/google/calendar";

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  try {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, brone_nim, brone_password_encrypted')
      .not('brone_nim', 'is', null)
      .not('brone_password_encrypted', 'is', null);

    if (userError || !users) {
      throw new Error("Gagal mengambil data user dari database.");
    }

    let successCount = 0;
    const errors = [];
    const secretKey = process.env.BRONE_ENC_KEY || "default-secret-key-change-me-in-env";

    for (const user of users) {
      try {
        const { data: decryptedData, error: decryptError } = await supabase
          .rpc('get_decrypted_brone_password', { 
            user_id_param: user.id, 
            secret_key: secretKey 
          });

        if (decryptError || !decryptedData) {
          throw new Error("Gagal dekripsi password untuk user: " + user.id);
        }

        const password = decryptedData;
        const nim = user.brone_nim!;

        // Jalankan scraper SIAM
        const schedules = await scrapeSiamSchedule(nim, password);

        // Proses setiap jadwal
        for (const schedule of schedules) {
          // 1. Upsert course terlebih dahulu
          const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .upsert({
              user_id: user.id,
              name: schedule.course_name,
              code: schedule.course_code,
              source: 'siam'
            }, { onConflict: 'user_id, source, name' })
            .select('id')
            .single();
            
          let courseId = courseData?.id;

          // Jika conflict tidak mengembalikan ID, kita select manual
          if (!courseId) {
            const { data: existCourse } = await supabase
              .from('courses')
              .select('id')
              .eq('user_id', user.id)
              .eq('source', 'siam')
              .eq('name', schedule.course_name)
              .single();
            courseId = existCourse?.id;
          }

          if (courseId) {
            // 2. Insert jadwal jika belum ada
            const { data: existSchedule } = await supabase
              .from('schedules')
              .select('id, google_calendar_event_id')
              .eq('user_id', user.id)
              .eq('course_id', courseId)
              .eq('day_of_week', schedule.day_of_week)
              .eq('start_time', schedule.start_time)
              .single();

            let scheduleId = existSchedule?.id;

            if (!scheduleId) {
              const { data: newSchedule } = await supabase
                .from('schedules')
                .insert({
                  user_id: user.id,
                  course_id: courseId,
                  day_of_week: schedule.day_of_week,
                  start_time: schedule.start_time,
                  end_time: schedule.end_time,
                  room: schedule.room,
                  lecturer: schedule.lecturer,
                  source: 'siam',
                  is_recurring: true,
                  recurrence_rule: 'RRULE:FREQ=WEEKLY' // Default mingguan
                })
                .select('id')
                .single();
                
              scheduleId = newSchedule?.id;
            }

            // 3. Sync ke Google Calendar
            if (scheduleId && !existSchedule?.google_calendar_event_id) {
              // Jika user sudah menghubungkan Google Calendar
              try {
                await syncScheduleToCalendar(user.id, scheduleId);
              } catch (calError) {
                console.error("Gagal sync jadwal ke kalender untuk user:", user.id, calError);
                // Tidak throw agar proses scraper tetap lanjut
              }
            }
          }
        }

        successCount++;
        
      } catch (err: any) {
        errors.push({ userId: user.id, error: err.message });
      }
    }

    await supabase.from("sync_logs").insert({
      sync_type: "siam",
      status: errors.length > 0 ? "partial" : "success",
      details: { total_users: users.length, success: successCount, errors }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil sinkronisasi jadwal SIAM ${successCount}/${users.length} user.`,
      errors 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
