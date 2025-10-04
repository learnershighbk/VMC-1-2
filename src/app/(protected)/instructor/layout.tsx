"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { Loader2 } from "lucide-react";

type InstructorLayoutProps = {
  children: ReactNode;
};

export default function InstructorLayout({ children }: InstructorLayoutProps) {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== "instructor") {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.role !== "instructor") {
    return null;
  }

  return <>{children}</>;
}

