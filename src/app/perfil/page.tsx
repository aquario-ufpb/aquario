"use client";

import { useRequireAuth } from "@/lib/client/hooks/use-require-auth";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PerfilPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !userLoading && user) {
      if (user.slug) {
        router.replace(`/usuarios/${user.slug}`);
      }
    }
  }, [authLoading, userLoading, user, router]);

  // Show loading while redirecting
  return (
    <div className="container mx-auto max-w-7xl px-6 md:px-8 lg:px-16 pt-24">
      <div className="flex flex-col items-center space-y-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>
    </div>
  );
}
