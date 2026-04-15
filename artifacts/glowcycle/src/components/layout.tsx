import { Link, useLocation } from "wouter";
import { useGetMe, useLogout, useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Droplet, Calendar as CalendarIcon, HeartPulse, ShoppingBag, User, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const { data: cart } = useGetCart({ query: { enabled: !!user } });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/");
      },
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tracker", label: "Tracker", icon: Droplet },
    { href: "/calendar", label: "Calendar", icon: CalendarIcon },
    { href: "/wellness", label: "Wellness", icon: HeartPulse },
    { href: "/store", label: "Store", icon: ShoppingBag },
    { href: "/profile", label: "Profile", icon: User },
  ];

  if (user?.isAdmin) {
    navItems.push({ href: "/admin", label: "Admin", icon: Settings });
  }

  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
              <Droplet className="h-6 w-6 text-primary fill-primary/20" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight text-primary">GlowCycle</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                      location === item.href
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
                
                <div className="h-6 w-px bg-border mx-2" />
                
                <Link href="/cart" className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                  <ShoppingBag className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Link>

                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Log in
                </Link>
                <Link href="/signup">
                  <Button className="rounded-full shadow-sm hover-elevate">Get Started</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur pb-safe z-50">
          <div className="flex items-center justify-around p-2">
            {[
              { href: "/dashboard", icon: LayoutDashboard },
              { href: "/tracker", icon: Droplet },
              { href: "/calendar", icon: CalendarIcon },
              { href: "/wellness", icon: HeartPulse },
              { href: "/store", icon: ShoppingBag },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "p-3 rounded-xl flex flex-col items-center gap-1 transition-colors relative",
                  location === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-6 w-6", location === item.href && "fill-primary/20")} />
                {item.href === "/store" && cartItemCount > 0 && (
                  <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-background">
                    {cartItemCount}
                  </span>
                )}
                {location === item.href && (
                  <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
