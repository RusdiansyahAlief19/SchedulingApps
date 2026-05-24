import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "replace-me",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "replace-me",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/calendar.events"
        }
      }
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const email = profile.email;
        if (email) {
          const supabase = getSupabaseAdminClient();
          const updateData: any = {
            email: email,
            google_id: account.providerAccountId,
          };
          if (account.refresh_token) {
            updateData.google_refresh_token = account.refresh_token;
          }
          
          const { error } = await supabase
            .from("users")
            .upsert(updateData, { onConflict: "email" });
            
          if (error) {
            console.error("Error upserting user on sign-in:", error);
          }
        }
      }
      return token;
    }
  }
};
