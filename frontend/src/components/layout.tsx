import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { navItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils";
import {
  MenuIcon,
  MicIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
}

const SidebarItem = ({ icon, label, href, isActive }: SidebarItemProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile sidebar toggle */}
      <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Voice Agent</h1>
        </div>
        <ModeToggle />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for desktop */}
        <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <MicIcon className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Voice Agent</h1>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                isActive={location.pathname === item.href}
              />
            ))}
          </nav>
          <div className="border-t p-4">
            <ModeToggle />
          </div>
        </aside>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden">
            <div className="fixed inset-y-0 left-0 z-20 w-64 animate-in slide-in-from-left bg-sidebar">
              <div className="flex h-16 items-center justify-between border-b px-6">
                <div className="flex items-center gap-2">
                  <MicIcon className="h-6 w-6" />
                  <h1 className="text-lg font-semibold">Voice Agent</h1>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 space-y-1 p-4">
                {navItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    isActive={location.pathname === item.href}
                  />
                ))}
              </nav>
              <div className="border-t p-4">
                <ModeToggle />
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
