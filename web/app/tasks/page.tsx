import Link from "next/link";
import { requireAppUserId } from "@/lib/app-user";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseServerConfigured } from "@/lib/supabase/config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createTask, deleteTask, setTaskStatus } from "./actions";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!isSupabaseServerConfigured()) {
    return (
      <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-black">
        <main className="mx-auto w-full max-w-md flex-1 px-5 pb-6 pt-8">
          <h1 className="text-2xl font-semibold text-black dark:text-white">Tugas</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Supabase belum dikonfigurasi. Isi env dan jalankan schema.
          </p>
          <div className="mt-4 rounded-3xl border border-black/10 bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
            <div>- web/.env.local (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)</div>
            <div className="mt-2">- web/supabase/schema.sql</div>
          </div>
        </main>
      </div>
    );
  }

  const userId = await requireAppUserId();
  const supabase = getSupabaseAdminClient();

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneMonthAgoIso = oneMonthAgo.toISOString();

  const { data: tasksRaw, error } = await supabase
    .from("tasks")
    .select("id,title,description,deadline,status,priority,created_at")
    .eq("user_id", userId)
    .order("deadline", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message || "Failed to fetch tasks");
  
  const tasks = (tasksRaw ?? []).filter((t: any) => {
    if (!t.deadline) return true;
    return new Date(t.deadline) >= oneMonthAgo;
  }) as Array<{
    id: string;
    title: string;
    description: string | null;
    deadline: string | null;
    status: string;
    priority: string;
    created_at: string;
  }>;

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-6 pt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-white">Tugas</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Tambah cepat + update status.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white"
          >
            Home
          </Link>
        </div>

        <section className="mt-6 rounded-3xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-black dark:text-white">Tambah tugas</h2>
          <form action={createTask} className="mt-3 grid gap-3">
            <input
              name="title"
              placeholder="Judul tugas"
              className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-black outline-none focus:border-black/30 dark:border-white/10 dark:bg-black dark:text-white dark:focus:border-white/30"
            />
            <input
              name="deadline"
              type="datetime-local"
              className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-black outline-none focus:border-black/30 dark:border-white/10 dark:bg-black dark:text-white dark:focus:border-white/30"
            />
            <textarea
              name="description"
              placeholder="Deskripsi (opsional)"
              rows={3}
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none focus:border-black/30 dark:border-white/10 dark:bg-black dark:text-white dark:focus:border-white/30"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                name="priority"
                defaultValue="NORMAL"
                className="h-12 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm text-black outline-none focus:border-black/30 dark:border-white/10 dark:bg-black dark:text-white dark:focus:border-white/30"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
              </select>
              <button
                type="submit"
                className="h-12 w-full rounded-2xl bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90 active:opacity-80"
              >
                Simpan
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 grid gap-3">
          {tasks.length ? (
            tasks.map((t) => (
              <div
                key={t.id}
                className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/tasks/${t.id}`}
                      className="block truncate text-base font-semibold text-black hover:underline dark:text-white"
                    >
                      {t.title}
                    </Link>
                    <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      {formatDeadline(t.deadline)}
                    </div>
                  </div>
                  <span className={badgeClass(t.status)}>{t.status}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <form action={setTaskStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={t.id} />
                    <select
                      name="status"
                      defaultValue={t.status}
                      className="h-10 w-full rounded-xl border border-black/10 bg-white px-2 text-xs font-medium text-black outline-none focus:border-black/30 dark:border-white/10 dark:bg-black dark:text-white dark:focus:border-white/30"
                    >
                      <option value="BELUM">BELUM</option>
                      <option value="SEDANG">SEDANG</option>
                      <option value="SELESAI">SELESAI</option>
                    </select>
                    <button
                      type="submit"
                      className="h-10 rounded-xl bg-foreground px-3 text-xs font-semibold text-background hover:opacity-90 active:opacity-80"
                    >
                      Update
                    </button>
                  </form>

                  <form action={deleteTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      type="submit"
                      className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-xs font-semibold text-black hover:bg-black/[0.03] active:bg-black/[0.06] dark:border-white/10 dark:bg-black dark:text-white dark:hover:bg-white/10 dark:active:bg-white/15"
                    >
                      Hapus
                    </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-black/10 bg-white p-4 text-sm text-zinc-600 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
              Belum ada tugas. Tambah dari form di atas.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function formatDeadline(value: string | null) {
  if (!value) return "Tanpa deadline";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Deadline tidak valid";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function badgeClass(status: string) {
  const base =
    "shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide";
  if (status === "SELESAI") {
    return `${base} bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300`;
  }
  if (status === "SEDANG") {
    return `${base} bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300`;
  }
  return `${base} bg-zinc-500/15 text-zinc-700 dark:bg-white/10 dark:text-zinc-200`;
}
