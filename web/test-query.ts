import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function check() {
  const oneMonthAgoIso = new Date().toISOString();
  
  // Test with quotes
  const q1 = await supabase.from('tasks').select('id').or(`deadline.gte."${oneMonthAgoIso}",deadline.is.null`);
  console.log("Q1 Error:", q1.error?.message || "Success");

  // Test without quotes
  const q2 = await supabase.from('tasks').select('id').or(`deadline.gte.${oneMonthAgoIso},deadline.is.null`);
  console.log("Q2 Error:", q2.error?.message || "Success");
}
check();
