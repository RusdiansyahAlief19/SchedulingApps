"use server";

import { requireAppUserId } from "@/lib/app-user";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function saveBroneCredentials(formData: FormData) {
  const userId = await requireAppUserId();
  const nim = formData.get("nim") as string;
  const password = formData.get("password") as string;

  if (!nim || !password) {
    return { error: "NIM dan Password harus diisi" };
  }

  const supabase = getSupabaseAdminClient();
  const secretKey = process.env.BRONE_ENC_KEY || "default-secret-key-change-me-in-env";

  // Use the RPC to securely encrypt and save
  const { error } = await supabase.rpc("set_brone_credentials", {
    user_id_param: userId,
    nim_param: nim,
    password_param: password,
    secret_key: secretKey,
  });

  if (error) {
    console.error("Failed to save Brone credentials:", error);
    return { error: "Gagal menyimpan kredensial" };
  }

  revalidatePath("/settings");
  return { success: true };
}
