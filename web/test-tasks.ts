import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const email = "rusdiasputre@gmail.com";
  
  const { data: user, error: uErr } = await supabase
    .from("users")
    .upsert({ email }, { onConflict: "email" })
    .select("id")
    .single();
    
  if (uErr) {
    console.error("User error:", uErr);
    return;
  }
  
  const userId = user.id;
  console.log("User ID:", userId);
  
  const { data: tasksRaw, error } = await supabase
    .from("tasks")
    .select("id,title,description,deadline,status,priority,created_at")
    .eq("user_id", userId)
    .order("deadline", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
    
  console.log("Tasks error:", error);
  console.log("Tasks count:", tasksRaw?.length);
}

run();
