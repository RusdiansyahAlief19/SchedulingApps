import { google } from "googleapis";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getGoogleAuthClient(userId: string) {
  const supabase = getSupabaseAdminClient();
  
  // Fetch user's refresh token
  const { data: user, error } = await supabase
    .from("users")
    .select("google_refresh_token")
    .eq("id", userId)
    .single();

  if (error || !user?.google_refresh_token) {
    throw new Error(`User ${userId} does not have a Google refresh token`);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: user.google_refresh_token,
  });

  return oauth2Client;
}
