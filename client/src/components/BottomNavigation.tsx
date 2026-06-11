import { Home, PawPrint, Activity, Heart, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/pets", icon: PawPrint, label: "Pets" },
  { path: "/activities", icon: Activity, label: "Activities" },
  { path: "/health", icon: Heart, label: "Health" },
  { path: "/more", icon: MoreHorizontal, label: "More" },
];

export function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border fixed-bottom-safe"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      data-testid="bottom-navigation"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto" role="menubar">
        {navItems.map((item) => {
          const isActive = location === item.path || 
            (item.path !== "/" && location.startsWith(item.path));
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
                role="menuitem"
                aria-label={`Navigate to ${item.label}`}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} aria-hidden="true" />
                <span className={cn(
                  "text-xs font-medium",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
