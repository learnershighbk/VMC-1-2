import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { CurrentUserSnapshot } from "../types";

export const loadCurrentUser = async (): Promise<CurrentUserSnapshot> => {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.auth.getUser();
  const user = result.data.user;

  if (!user) {
    return { status: "unauthenticated", user: null };
  }

  const { data: profile } = await (supabase
    .from("profiles") as any)
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile && profile.role ? (profile.role as "learner" | "instructor") : null;

  return {
    status: "authenticated",
    user: {
      id: user.id,
      email: user.email,
      role: userRole,
      appMetadata: user.app_metadata ?? {},
      userMetadata: user.user_metadata ?? {},
    },
  };
};
