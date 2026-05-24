function isPlaceholder(value: string | undefined) {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  if (!v) return true;
  return v === "replace-me" || v.startsWith("replace-me-");
}

export function isSupabaseServerConfigured() {
  return !isPlaceholder(process.env.SUPABASE_URL) && !isPlaceholder(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

