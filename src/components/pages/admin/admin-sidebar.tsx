"use client";

import Link from "next/link";
import { cn } from "@/lib/client/utils";
import { LayoutDashboard, Users, Building2 } from "lucide-react";

type AdminSidebarProps = {
  currentPath: string;
  onNavigate?: () => void;
};

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Usuários",
    href: "/admin/usuarios",
    icon: Users,
  },
  {
    title: "Entidades",
    href: "/admin/entidades",
    icon: Building2,
  },
];

export function AdminSidebar({ currentPath, onNavigate }: AdminSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Administração</h2>
      </div>
      <nav className="p-4 space-y-1 flex-1">
        {adminNavItems.map(item => {
          const isActive = currentPath === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
