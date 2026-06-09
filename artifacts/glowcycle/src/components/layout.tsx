import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Droplet, Calendar as CalendarIcon, HeartPulse, ShoppingBag, User, LogOut, LayoutDashboard, Users as UsersIcon, Package, Stethoscope, ClipboardList, Bell, UserPlus, KeyRound, LifeBuoy, ChartColumnBig, UserCircle2, Mail, Phone, MapPinned, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Footer } from "@/components/footer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCartDrawer } from "@/components/cart-drawer";

function ProfileDropdown({
  open,
  onOpenChange,
  onLogout,
  onViewProfile,
  onNavigate,
  onHelpSupport,
  name,
  email,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
  onViewProfile: () => void;
  onNavigate: (href: string) => void;
  onHelpSupport: () => void;
  name: string;
  email: string;
}) {
  const menuItemClassName =
    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-[#4A2C3A] transition-all duration-200 hover:bg-[#FFF0F6] hover:text-[#FF5CA8] hover:translate-x-0.5 focus:bg-[#FFF0F6] focus:text-[#FF5CA8]";

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border bg-white text-[#4A2C3A] shadow-sm transition-all duration-200 shrink-0",
            open
              ? "border-[#F3DCE7] shadow-[0_10px_24px_rgba(255,92,168,0.10)]"
              : "border-[#F3DCE7] hover:border-[#FF5CA8]/30 hover:text-[#FF5CA8]"
          )}
          aria-label="Open profile menu"
          title="Open profile menu"
        >
          <UserCircle2 className="h-5 w-5 shrink-0 text-[#8B6F7D]" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={14}
        className="w-[320px] overflow-hidden rounded-[20px] border border-[#FFEAF3] bg-white p-0 shadow-[0_24px_60px_rgba(255,92,168,0.16)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2"
      >
        <div className="border-b border-[#FFEAF3] p-5">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 rounded-full bg-gradient-to-br from-[#FF5CA8] to-[#FFEAF3] p-[2px] shadow-[0_8px_20px_rgba(255,92,168,0.18)]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-[#FF5CA8]">
                <UserCircle2 className="h-8 w-8" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-[18px] font-semibold text-[#4A2C3A]">{name}</p>
              <p className="truncate text-sm text-[#8B6F7D]">{email}</p>
            </div>
          </div>

          <Link
            href="/profile"
            onClick={onViewProfile}
            className="mt-4 flex h-10 w-full items-center justify-center rounded-full border border-[#F3DCE7] bg-white text-sm font-medium text-[#3D2A34] shadow-sm transition-colors duration-200 hover:border-[#FF5CA8]/30 hover:text-[#FF5CA8]"
          >
            My Profile
          </Link>
        </div>

        <div className="p-2">
          <DropdownMenuItem className={menuItemClassName} onSelect={onViewProfile}>
            <ChartColumnBig className="h-4 w-4 text-[#FF5CA8]" />
            <span>Profile Overview</span>
          </DropdownMenuItem>

          <DropdownMenuItem className={menuItemClassName} onSelect={() => onViewProfile()}>
            <Bell className="h-4 w-4 text-[#FF5CA8]" />
            <span>Notifications</span>
          </DropdownMenuItem>
          <DropdownMenuItem className={menuItemClassName} onSelect={() => onNavigate("/profile#partner-information")}>
            <UserPlus className="h-4 w-4 text-[#FF5CA8]" />
            <span>Add Partner</span>
          </DropdownMenuItem>
          <DropdownMenuItem className={menuItemClassName} onSelect={() => onNavigate("/update-password")}>
            <KeyRound className="h-4 w-4 text-[#FF5CA8]" />
            <span>Update Password</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2 bg-[#FFEAF3]" />

          <DropdownMenuItem className={menuItemClassName} onSelect={onHelpSupport}>
            <LifeBuoy className="h-4 w-4 text-[#FF5CA8]" />
            <span>Help & Support</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={cn(menuItemClassName, "text-[#FF5CA8]")}
            onSelect={onLogout}
          >
            <LogOut className="h-4 w-4 text-[#FF5CA8]" />
            <span>Logout</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const { openCart, cartItemCount } = useCartDrawer();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/");
      },
    });
  };

  const handleViewProfile = () => {
    setProfileMenuOpen(false);
    setLocation("/profile");
  };

  const handleNavigate = (href: string) => {
    setProfileMenuOpen(false);
    setLocation(href);
  };

  const handleHelpSupport = () => {
    setProfileMenuOpen(false);
    setSupportOpen(true);
  };

  const userNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tracker", label: "Tracker", icon: Droplet },
    { href: "/calendar", label: "Calendar", icon: CalendarIcon },
    { href: "/wellness", label: "Wellness", icon: HeartPulse },
    { href: "/consultants", label: "Consultants", icon: Stethoscope },
    { href: "/store", label: "Store", icon: ShoppingBag },
    { href: "/store-locator", label: "Locator", icon: MapPinned },
    { href: "/orders", label: "Orders", icon: ClipboardList },
  ];

  const adminNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: UsersIcon },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/consultants", label: "Consultants", icon: Stethoscope },
    { href: "/admin/tracking", label: "Tracking", icon: Truck },
  ];

  const navItems = user?.isAdmin ? adminNavItems : userNavItems;
  const showCart = !user?.isAdmin;

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
                  <button
                    type="button"
                    onClick={openCart}
                    className="relative p-2 text-muted-foreground transition-colors hover:text-primary shrink-0"
                    aria-label="Open cart drawer"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                )}

                <ProfileDropdown
                  open={profileMenuOpen}
                  onOpenChange={setProfileMenuOpen}
                  onLogout={handleLogout}
                  onViewProfile={handleViewProfile}
                  onNavigate={handleNavigate}
                  onHelpSupport={handleHelpSupport}
                  name={user?.name ?? "Manu"}
                  email={user?.email ?? "manujotkaur5267@gmail.com"}
                />
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
                  <button
                    type="button"
                    onClick={openCart}
                    className="relative p-2 text-muted-foreground transition-colors hover:text-primary"
                    aria-label="Open cart drawer"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                )}
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

      <Footer />

      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="rounded-[24px] border-[#F3DCE7] bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#3D2A34]">Help & Support</DialogTitle>
            <DialogDescription className="text-[#8B6F7D]">
              Contact GlowCycle support using the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-2xl border border-[#F3DCE7] bg-[#FFF7FB] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8B6F7D]">Phone</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#3D2A34]">
                <Phone className="h-4 w-4 text-[#FF5CA8]" />
                <span>6239592150</span>
              </p>
            </div>
            <div className="rounded-2xl border border-[#F3DCE7] bg-[#FFF7FB] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8B6F7D]">Email</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#3D2A34]">
                <Mail className="h-4 w-4 text-[#FF5CA8]" />
                <span>m2934547@gmail.com</span>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Nav */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur pb-safe z-50">
          <div className="flex items-center justify-around px-1 py-2">
            {(user.isAdmin
              ? [
                  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
                  { href: "/admin/users", icon: UsersIcon, label: "Users" },
                  { href: "/admin/products", icon: Package, label: "Products" },
                  { href: "/admin/consultants", icon: Stethoscope, label: "Doctors" },
                  { href: "/admin/tracking", icon: Truck, label: "Tracking" },
                ]
              : [
                  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
                  { href: "/tracker", icon: Droplet, label: "Tracker" },
                  { href: "/wellness", icon: HeartPulse, label: "Wellness" },
                  { href: "/store", icon: ShoppingBag, label: "Store" },
                  { href: "/store-locator", icon: MapPinned, label: "Locator" },
                  { href: "/orders", icon: ClipboardList, label: "Orders" },
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
