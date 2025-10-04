"use client";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { InstructorDashboard } from "@/features/dashboard/components/instructor-dashboard";
import { LearnerDashboard } from "@/features/dashboard/components/learner-dashboard";
import { Loader2 } from "lucide-react";

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.role === 'instructor') {
    return <InstructorDashboard />;
  }

  return <LearnerDashboard />;
}
