import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function requireAppUserId() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const email = session.user?.email;
  if (!email) redirect("/login");

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .upsert({ email }, { onConflict: "email" })
    .select("id")
    .single();

  if (error) throw error;
  return (data as unknown as { id: string }).id;
}
