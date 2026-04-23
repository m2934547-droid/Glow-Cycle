import { Link, useLocation } from "wouter";
import { useGetMe, useLogout, useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Droplet, Calendar as CalendarIcon, HeartPulse, ShoppingBag, User, LogOut, LayoutDashboard, Users as UsersIcon, Package } from "lucide-react";
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

  const userNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tracker", label: "Tracker", icon: Droplet },
    { href: "/calendar", label: "Calendar", icon: CalendarIcon },
    { href: "/wellness", label: "Wellness", icon: HeartPulse },
    { href: "/store", label: "Store", icon: ShoppingBag },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const adminNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: UsersIcon },
    { href: "/admin/products", label: "Products", icon: Package },
  ];

  const navItems = user?.isAdmin ? adminNavItems : userNavItems;
  const showCart = !user?.isAdmin;

  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 group min-w-0 shrink-0">
            <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
              <Droplet className="h-5 w-5 sm:h-6 sm:w-6 text-primary fill-primary/20" />
            </div>
            <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-primary truncate">GlowCycle</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 min-w-0">
            {user ? (
              <>
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={cn(
                        "flex items-center gap-2 px-2.5 lg:px-3 xl:px-4 py-2 rounded-full text-sm font-medium transition-colors shrink-0",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="hidden xl:inline">{item.label}</span>
                    </Link>
                  );
                })}

                <div className="h-6 w-px bg-border mx-1 lg:mx-2" />

                {showCart && (
                  <Link href="/cart" className="relative p-2 text-muted-foreground hover:text-primary transition-colors shrink-0">
                    <ShoppingBag className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                )}

                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0">
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Log in
                </Link>
                <Link href="/signup">
                  <Button className="rounded-full shadow-sm hover-elevate">Get Started</Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile header actions (cart + logout when logged in, login/signup when not) */}
          <div className="flex md:hidden items-center gap-1 shrink-0">
            {user ? (
              <>
                {showCart && (
                  <Link href="/cart" className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                    <ShoppingBag className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                )}
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-2">
                  Log in
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="rounded-full shadow-sm hover-elevate text-xs">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={cn("flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8", user && "pb-24 md:pb-8")}>
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur pb-safe z-50">
          <div className="flex items-center justify-around px-1 py-2">
            {(user.isAdmin
              ? [
                  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
                  { href: "/admin/users", icon: UsersIcon, label: "Users" },
                  { href: "/admin/products", icon: Package, label: "Products" },
                ]
              : [
                  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
                  { href: "/tracker", icon: Droplet, label: "Tracker" },
                  { href: "/calendar", icon: CalendarIcon, label: "Calendar" },
                  { href: "/wellness", icon: HeartPulse, label: "Wellness" },
                  { href: "/store", icon: ShoppingBag, label: "Store" },
                  { href: "/profile", icon: User, label: "Profile" },
                ]
            ).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 min-w-0 px-1 py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-colors relative",
                  location === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", location === item.href && "fill-primary/20")} />
                <span className="text-[10px] font-medium truncate max-w-full">{item.label}</span>
                {item.href === "/store" && cartItemCount > 0 && (
                  <span className="absolute top-0.5 right-1/4 bg-primary text-primary-foreground text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-background">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
