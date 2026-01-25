"use client";

import { useRequireAuth } from "@/lib/client/hooks/use-require-auth";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { AdminSidebar } from "@/components/pages/admin/admin-sidebar";
import { AdminPageSkeleton } from "@/components/pages/admin/admin-page-skeleton";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading } = useRequireAuth({ requireRole: "MASTER_ADMIN" });
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (authLoading || userLoading) {
    return <AdminPageSkeleton />;
  }

  if (!user || user.papelPlataforma !== "MASTER_ADMIN") {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar - Fixed at top of viewport */}
      <aside className="hidden md:block fixed left-0 top-0 w-64 border-r bg-muted/30 h-screen overflow-y-auto z-40">
        <div className="pt-8">
          <AdminSidebar currentPath={pathname} />
        </div>
      </aside>

      {/* Mobile Menu */}
      <div className="md:hidden fixed top-[50px] left-0 right-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 py-2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Menu de Administração</SheetTitle>
              <AdminSidebar currentPath={pathname} onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="mt-[76px]">
        <main className="flex-1 md:ml-64 overflow-y-auto min-h-[calc(100vh-76px)]">
          <div className="container mx-auto max-w-7xl px-6 md:px-8 lg:px-16 py-8">{children}</div>
        </main>
      </div>
    </>
  );
}
