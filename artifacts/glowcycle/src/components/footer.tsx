import { Link } from "wouter";
import { Droplet, Heart } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/80 mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Droplet className="h-5 w-5 text-primary" />
              <span className="font-serif font-bold text-lg text-foreground">GlowCycle</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your gentle cycle companion. Track, learn, and thrive at every phase of your journey.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-foreground mb-3 uppercase tracking-wider">Features</h3>
            <ul className="space-y-2">
              {[
                { label: "Cycle Tracker", href: "/tracker" },
                { label: "Calendar", href: "/calendar" },
                { label: "Wellness Tips", href: "/wellness" },
                { label: "Consultants", href: "/consultants" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-foreground mb-3 uppercase tracking-wider">Account</h3>
            <ul className="space-y-2">
              {[
                { label: "Store", href: "/store" },
                { label: "Order History", href: "/orders" },
                { label: "Profile", href: "/profile" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {year} GlowCycle. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            Made with <Heart className="h-3 w-3 text-primary fill-primary" /> for every cycle
          </p>
        </div>
      </div>
    </footer>
  );
}
