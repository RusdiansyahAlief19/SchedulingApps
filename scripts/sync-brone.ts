import { createSupabaseAdminClient } from "./lib/supabase";

async function main() {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("sync_logs").insert({
    user_id: null,
    source: "brone",
    status: "SUCCESS",
    message: "Cron ping (minimal pipeline)"
  });

  if (error) {
    throw error;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

