"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppUserId } from "@/lib/app-user";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createTask(formData: FormData) {
  const userId = await requireAppUserId();
  const supabase = getSupabaseAdminClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const deadlineRaw = String(formData.get("deadline") ?? "").trim();
  const priority = String(formData.get("priority") ?? "NORMAL").trim();

  if (!title) {
    redirect("/tasks");
  }

  const deadline = deadlineRaw ? new Date(deadlineRaw).toISOString() : null;

  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title,
    description: description || null,
    deadline,
    status: "BELUM",
    source: "manual",
    priority,
  });

  if (error) throw error;

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect("/tasks");
}

export async function updateTask(formData: FormData) {
  const userId = await requireAppUserId();
  const supabase = getSupabaseAdminClient();

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const deadlineRaw = String(formData.get("deadline") ?? "").trim();
  const priority = String(formData.get("priority") ?? "NORMAL").trim();

  if (!id || !title) redirect("/tasks");

  const deadline = deadlineRaw ? new Date(deadlineRaw).toISOString() : null;

  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      description: description || null,
      deadline,
      priority,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;

  revalidatePath(`/tasks/${id}`);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect(`/tasks/${id}`);
}

export async function deleteTask(formData: FormData) {
  const userId = await requireAppUserId();
  const supabase = getSupabaseAdminClient();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/tasks");

  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect("/tasks");
}

export async function setTaskStatus(formData: FormData) {
  const userId = await requireAppUserId();
  const supabase = getSupabaseAdminClient();

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!id || !status) redirect("/tasks");

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect("/tasks");
}

