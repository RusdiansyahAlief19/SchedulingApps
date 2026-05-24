import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { saveBroneCredentials } from "./actions";
import { requireAppUserId } from "@/lib/app-user";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = await requireAppUserId();
  const supabase = getSupabaseAdminClient();
  
  const { data: user } = await supabase
    .from("users")
    .select("brone_nim")
    .eq("id", userId)
    .single();

  const isConnected = !!user?.brone_nim;

  return (
    <div className="flex flex-col">
      <header className="mx-auto w-full max-w-md px-5 pt-8">
        <h1 className="text-2xl font-semibold leading-tight text-black dark:text-white">
          Pengaturan
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Atur koneksi dan preferensi sinkronisasi
        </p>
      </header>
      
      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-6 pt-6">
        <section className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-black dark:text-white">Koneksi Brone UB</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Masukkan NIM dan kata sandi untuk sinkronisasi jadwal dari SIAKAD/Brone.
              Data disimpan secara aman dengan enkripsi.
            </p>
          </div>

          <form action={saveBroneCredentials} className="grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">NIM</label>
              <input 
                name="nim" 
                type="text" 
                defaultValue={user?.brone_nim || ""}
                required 
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                placeholder="2151502..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Kata Sandi SIAKAD</label>
              <input 
                name="password" 
                type="password" 
                required 
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                placeholder="********"
              />
            </div>
            
            <button 
              type="submit" 
              className="mt-2 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              {isConnected ? "Perbarui Kredensial" : "Simpan Kredensial"}
            </button>
            
            {isConnected && (
              <div className="mt-2 text-center text-xs text-green-600 dark:text-green-400">
                ✓ Brone telah terhubung (NIM: {user.brone_nim})
              </div>
            )}
          </form>
        </section>

        <section className="mt-4 rounded-3xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-black dark:text-white">Notifikasi Google Calendar</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Pengingat (1 hari dan 2 jam sebelum deadline) otomatis dikirimkan ke HP melalui Google Calendar Anda.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/[0.03] px-3 py-3 text-sm dark:bg-white/10">
             <div className="font-medium text-black dark:text-white">Status Notifikasi</div>
             <div className="text-xs text-green-600 dark:text-green-400 font-semibold">Aktif</div>
          </div>
        </section>
      </main>
    </div>
  );
}
