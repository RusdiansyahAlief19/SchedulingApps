import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAppUserId } from "@/lib/app-user";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseServerConfigured } from "@/lib/supabase/config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { deleteTask, setTaskStatus, updateTask } from "../actions";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!isSupabaseServerConfigured()) {
    redirect("/tasks");
  }

  const { id } = await params;
  
  // Basic UUID validation to prevent 22P02 postgres error
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  const userId = await requireAppUserId();
  const supabase = getSupabaseAdminClient();

  const { data: taskRaw, error } = await supabase
    .from("tasks")
    .select("id,title,description,deadline,status,priority")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message || "Failed to fetch task");
  if (!taskRaw) notFound();
  const data = taskRaw as unknown as {
    id: string;
    title: string;
    description: string | null;
    deadline: string | null;
    status: string;
    priority: string;
  };

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-6 pt-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              DETAIL TUGAS
            </p>
            <h1 className="mt-2 truncate text-2xl font-semibold text-black dark:text-white">
              {data.title}
            </h1>
            <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              {formatDeadline(data.deadline)}
            </div>
          </div>
          <Link
            href="/tasks"
            className="text-sm font-medium text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white"
          >
            Back
          </Link>
        </div>

        <section className="mt-6 rounded-3xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-black dark:text-white">Edit</h2>
          <form action={updateTask} className="mt-3 grid gap-3">
            <input type="hidden" name="id" value={data.id} />
            <input
              name="title"
              defaultValue={data.title}
              className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-black outline-none focus:border-black/30 dark:border-white/10 dark:bg-black dark:text-white dark:focus:border-white/30"
            />
            <input
              name="deadline"
              type="datetime-local"
              defaultValue={toLocalInputValue(data.deadline)}
              className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-black outline-none focus:border-black/30 dark:border-white/10 dark:bg-black dark:text-white dark:focus:border-white/30"
            />
            <textarea
              name="description"
              defaultValue={data.description ?? ""}
              rows={4}
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none focus:border-black/30 dark:border-white/10 dark:bg-black dark:text-white dark:focus:border-white/30"
            />
            <select
              name="priority"
              defaultValue={data.priority ?? "NORMAL"}
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
              Simpan perubahan
            </button>
          </form>
        </section>

        <section className="mt-3 rounded-3xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-black dark:text-white">Status</h2>
          <form action={setTaskStatus} className="mt-3 flex gap-2">
            <input type="hidden" name="id" value={data.id} />
            <select
              name="status"
              defaultValue={data.status}
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium text-black outline-none focus:border-black/30 dark:border-white/10 dark:bg-black dark:text-white dark:focus:border-white/30"
            >
              <option value="BELUM">BELUM</option>
              <option value="SEDANG">SEDANG</option>
              <option value="SELESAI">SELESAI</option>
            </select>
            <button
              type="submit"
              className="h-11 rounded-2xl bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90 active:opacity-80"
            >
              Update
            </button>
          </form>
        </section>

        <section className="mt-3 rounded-3xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-black dark:text-white">Aksi</h2>
          <form action={deleteTask} className="mt-3">
            <input type="hidden" name="id" value={data.id} />
            <button
              type="submit"
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-black hover:bg-black/[0.03] active:bg-black/[0.06] dark:border-white/10 dark:bg-black dark:text-white dark:hover:bg-white/10 dark:active:bg-white/15"
            >
              Hapus tugas
            </button>
          </form>
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

function toLocalInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
