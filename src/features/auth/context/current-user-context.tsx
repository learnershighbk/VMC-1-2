"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { match, P } from "ts-pattern";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type {
  CurrentUserContextValue,
  CurrentUserSnapshot,
} from "../types";

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

type CurrentUserProviderProps = {
  children: ReactNode;
  initialState: CurrentUserSnapshot;
};

export const CurrentUserProvider = ({
  children,
  initialState,
}: CurrentUserProviderProps) => {
  const queryClient = useQueryClient();
  const [snapshot, setSnapshot] = useState<CurrentUserSnapshot>(initialState);

  const refresh = useCallback(async () => {
    setSnapshot((prev) => ({ status: "loading", user: prev.user }));
    const supabase = getSupabaseBrowserClient();

    try {
      const result = await supabase.auth.getUser();

      const authUser = result.data?.user;
      
      if (!authUser) {
        const unauthSnapshot: CurrentUserSnapshot = {
          status: "unauthenticated" as const,
          user: null,
        };
        setSnapshot(unauthSnapshot);
        queryClient.setQueryData(["currentUser"], unauthSnapshot);
        return;
      }

      const { data: profile } = await (supabase
        .from("profiles") as any)
        .select("role")
        .eq("id", authUser.id)
        .single();

      const userRole = profile && profile.role ? (profile.role as "learner" | "instructor") : null;

      const nextSnapshot: CurrentUserSnapshot = {
        status: "authenticated" as const,
        user: {
          id: authUser.id,
          email: authUser.email,
          role: userRole,
          appMetadata: authUser.app_metadata ?? {},
          userMetadata: authUser.user_metadata ?? {},
        },
      };

      setSnapshot(nextSnapshot);
      queryClient.setQueryData(["currentUser"], nextSnapshot);
    } catch (error) {
      const fallbackSnapshot: CurrentUserSnapshot = {
        status: "unauthenticated",
        user: null,
      };
      setSnapshot(fallbackSnapshot);
      queryClient.setQueryData(["currentUser"], fallbackSnapshot);
    }
  }, [queryClient]);

  const value = useMemo<CurrentUserContextValue>(() => {
    return {
      ...snapshot,
      refresh,
      isAuthenticated: snapshot.status === "authenticated",
      isLoading: snapshot.status === "loading",
    };
  }, [refresh, snapshot]);

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
};

export const useCurrentUserContext = () => {
  const value = useContext(CurrentUserContext);

  if (!value) {
    throw new Error("CurrentUserProvider가 트리 상단에 필요합니다.");
  }

  return value;
};
