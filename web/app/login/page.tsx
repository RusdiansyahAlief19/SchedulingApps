import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-100 to-white dark:from-zinc-900 dark:to-black">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-10">
        <header className="mb-10">
          <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            PENJADWALANANCA
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-black dark:text-white">
            Masuk biar semua tugas dan jadwal kebaca rapi.
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Gunakan akun Google UB untuk akses Classroom dan sinkronisasi Google
            Calendar.
          </p>
        </header>

        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <GoogleSignInButton />
          <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Kalau tombol login error, cek env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
            NEXTAUTH_SECRET, NEXTAUTH_URL.
          </div>
        </div>

        <div className="mt-auto pb-8 pt-10 text-center text-xs text-zinc-500 dark:text-zinc-500">
          Fokus hari ini. Beresin yang penting.
        </div>
      </div>
    </div>
  );
}

