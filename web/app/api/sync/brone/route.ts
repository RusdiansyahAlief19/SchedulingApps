import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { scrapeBroneSchedule } from "@/lib/scraper/brone";

export async function GET(request: Request) {
  // Verifikasi Cron Secret jika ini di-hit dari Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  try {
    // 1. Ambil semua user yang sudah men-setup koneksi Brone
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

    // Gunakan secret key yang sama dengan yang di app/settings/actions.ts
    const secretKey = process.env.BRONE_ENC_KEY || "default-secret-key-change-me-in-env";

    // 2. Loop setiap user
    for (const user of users) {
      try {
        // Dekripsi password Brone menggunakan RPC PostgreSQL pgcrypto
        // Karena kita tidak bisa decrypt di server-side JS dengan mudah jika dienkripsi via pgcrypto (kecuali pakai modul kripto yang sama),
        // lebih baik kita buat RPC di Supabase `get_decrypted_brone_password` ATAU ambil langsung menggunakan pgcrypto di select query.
        
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

        // 3. Jalankan scraper
        const courses = await scrapeBroneSchedule(nim, password);

        // 4. Upsert courses ke database
        for (const course of courses) {
          await supabase
            .from('courses')
            .upsert({
              user_id: user.id,
              name: course.name,
              source: 'brone'
            }, { onConflict: 'user_id, source, name' }); 
            // Catatan: Anda perlu membuat composite unique index `(user_id, source, name)` jika belum ada.
        }

        successCount++;
        
      } catch (err: any) {
        errors.push({ userId: user.id, error: err.message });
      }
    }

    // Catat log
    await supabase.from("sync_logs").insert({
      sync_type: "brone",
      status: errors.length > 0 ? "partial" : "success",
      details: { total_users: users.length, success: successCount, errors }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil sinkronisasi ${successCount}/${users.length} user.`,
      errors 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
