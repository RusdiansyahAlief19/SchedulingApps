import { SignOutButton } from "@/components/SignOutButton";
import { SyncButtons } from "@/components/SyncButtons";
import Link from "next/link";
import { requireAppUserId } from "@/lib/app-user";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseServerConfigured } from "@/lib/supabase/config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

function formatToday() {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!isSupabaseServerConfigured()) {
    return (
      <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-black">
        <header className="mx-auto w-full max-w-md px-5 pt-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                SETUP
              </p>
              <h1 className="mt-2 text-2xl font-semibold leading-tight text-black dark:text-white">
                Hubungkan Supabase dulu
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Isi env dan jalankan SQL schema supaya dashboard bisa narik data.
              </p>
            </div>
            <SignOutButton />
          </div>
        </header>
        <main className="mx-auto w-full max-w-md flex-1 px-5 pb-6 pt-6">
          <div className="rounded-3xl border border-black/10 bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
            <div className="font-semibold text-black dark:text-white">
              File yang perlu kamu cek
            </div>
            <div className="mt-2">
              - web/.env.local (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
            </div>
            <div className="mt-2">- web/supabase/schema.sql</div>
          </div>
        </main>
      </div>
    );
  }

  const userId = await requireAppUserId();
  const supabase = getSupabaseAdminClient();

  const { count: unfinishedCount, error: countError } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "SELESAI");

  if (countError) throw countError;

  const range = getTodayTomorrowRange();
  const { data: upcomingRaw, error: upcomingError } = await supabase
    .from("tasks")
    .select("id,title,deadline,status")
    .eq("user_id", userId)
    .neq("status", "SELESAI")
    .gte("deadline", range.startIso)
    .lte("deadline", range.endIso)
    .order("deadline", { ascending: true })
    .limit(5);

  if (upcomingError) throw upcomingError;
  const upcoming = (upcomingRaw ?? []) as Array<{
    id: string;
    title: string;
    deadline: string | null;
    status: string;
  }>;

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-black">
      <header className="mx-auto w-full max-w-md px-5 pt-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              HARI INI
            </p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight text-black dark:text-white">
              {formatToday()}
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {unfinishedCount ?? 0} tugas belum selesai.
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-6 pt-6">
        <section className="grid gap-3">
          <Card title="Quick Actions" subtitle="Sinkronisasi manual data akademik">
            <SyncButtons />
          </Card>

          <Card title="Deadline dekat" subtitle="Hari ini / besok">
            {upcoming.length ? (
              <div className="grid gap-2">
                {upcoming.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tasks/${t.id}`}
                    className="block rounded-2xl bg-black/[0.03] px-3 py-3 text-sm hover:bg-black/[0.05] dark:bg-white/10 dark:hover:bg-white/15"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 font-medium text-black dark:text-white">
                        <span className="block truncate">{t.title}</span>
                      </div>
                      <div className="shrink-0 text-xs text-zinc-600 dark:text-zinc-300">
                        {formatTime(t.deadline)}
                      </div>
                    </div>
                  </Link>
                ))}
                <Link
                  href="/tasks"
                  className="mt-1 text-sm font-semibold text-black hover:underline dark:text-white"
                >
                  Lihat semua tugas →
                </Link>
              </div>
            ) : (
              <div className="grid gap-2">
                <Row label="Tidak ada deadline dekat" value="Tambah di tab Tugas" />
              </div>
            )}
          </Card>

          <Card title="Weekly view" subtitle="Scroll horizontal (placeholder)">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="min-w-[84px] flex-none rounded-2xl border border-black/10 bg-white px-3 py-3 text-center text-xs text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400"
                >
                  <div className="font-semibold text-black dark:text-white">
                    {i + 1}
                  </div>
                  <div className="mt-1">Hari</div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-black dark:text-white">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/[0.03] px-3 py-3 text-sm dark:bg-white/10">
      <div className="font-medium text-black dark:text-white">{label}</div>
      <div className="text-xs text-zinc-600 dark:text-zinc-300">{value}</div>
    </div>
  );
}

function getTodayTomorrowRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setDate(end.getDate() + 1);
  end.setHours(23, 59, 59, 999);

  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function formatTime(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(d);
}
