import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function check() {
  const { data: logs, error } = await supabase.from('sync_logs').select('*').limit(1);
  console.log("Sync Logs Error?", error?.message || "No error, exists");
  
  const { data: tasks, error: tErr } = await supabase.from('tasks').select('*');
  console.log("Tasks Error?", tErr?.message || `Found ${tasks?.length} tasks`);
  console.log("First task:", tasks?.[0]?.title);
}
check();
