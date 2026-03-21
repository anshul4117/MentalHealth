"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useAuth } from "@/lib/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, isCounsellor, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isCounsellor)) {
      router.push("/login");
    }
  }, [isLoading, isLoggedIn, isCounsellor, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mindpulse-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-mindpulse-purple/30 border-t-mindpulse-purple rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn || !isCounsellor) return null;

  return (
    <div className="min-h-screen bg-mindpulse-bg">
      <DashboardSidebar />
      <main className="ml-[260px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
