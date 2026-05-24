import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requireAppUserId } from "@/lib/app-user";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AbsensiPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = await requireAppUserId();
  const supabase = getSupabaseAdminClient();

  // Ambil data absensi
  const { data: attendances } = await supabase
    .from("attendances")
    .select("*, courses(name)")
    .eq("user_id", userId)
    .order("percentage", { ascending: true });

  const absensiList = attendances || [];

  return (
    <div className="flex flex-col">
      <header className="mx-auto w-full max-w-md px-5 pt-8">
        <h1 className="text-2xl font-semibold leading-tight text-black dark:text-white">Absensi (SIAM)</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Pantau kehadiran kuliah agar aman dari jatah bolos.
        </p>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-6 pt-6 grid gap-4">
        {absensiList.length === 0 ? (
          <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500 text-center">Belum ada data absensi. Gunakan Sync Manual.</p>
          </div>
        ) : (
          absensiList.map((item: any) => {
            const isDanger = item.percentage < 75;
            const isWarning = item.percentage >= 75 && item.percentage <= 80;
            const progressColor = isDanger ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-green-500";
            
            return (
              <section key={item.id} className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-base font-medium text-black dark:text-white leading-tight">
                    {item.courses?.name || "Mata Kuliah"}
                  </h2>
                  <div className={`text-sm font-bold ${isDanger ? "text-red-500" : isWarning ? "text-yellow-500" : "text-green-500"}`}>
                    {item.percentage}%
                  </div>
                </div>
                
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div className={`h-full ${progressColor}`} style={{ width: `${item.percentage}%` }}></div>
                </div>

                <div className="mt-3 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Hadir: {item.attended_meetings} / {item.total_meetings}</span>
                  <span>{isDanger ? "⚠️ Kurang dari 75%" : "✅ Aman"}</span>
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
