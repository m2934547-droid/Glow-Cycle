import { Link } from "wouter";
import { Droplet, Heart, Facebook, Instagram, Linkedin, Github } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

const socialLinks = [
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Github, label: "GitHub", href: "#" },
];

export function Footer() {
  const year = new Date().getFullYear();
  const { data: user } = useGetMe();

  return (
    <footer className="border-t mt-auto" style={{ background: "linear-gradient(135deg, #2d0010 0%, #800020 60%, #a0003a 100%)" }}>
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Droplet className="h-5 w-5 text-rose-200" />
              <span className="font-serif font-bold text-lg text-white">GlowCycle</span>
            </div>
            <p className="text-sm text-rose-200/80 leading-relaxed mb-5">
              Your gentle cycle companion. Track, learn, and thrive at every phase of your journey.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                >
                  <Icon className="h-4 w-4 text-white" />
                </a>
              ))}
            </div>
          </div>

          {user ? (
            <>
              <div>
                <h3 className="font-semibold text-xs text-rose-300 mb-3 uppercase tracking-wider">Features</h3>
                <ul className="space-y-2">
                  {[
                    { label: "Cycle Tracker", href: "/tracker" },
                    { label: "Calendar", href: "/calendar" },
                    { label: "Wellness Tips", href: "/wellness" },
                    { label: "Consultants", href: "/consultants" },
                  ].map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-sm text-rose-200 hover:text-white transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-xs text-rose-300 mb-3 uppercase tracking-wider">Account</h3>
                <ul className="space-y-2">
                  {[
                    { label: "Store", href: "/store" },
                    { label: "Order History", href: "/orders" },
                    { label: "Profile", href: "/profile" },
                  ].map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-sm text-rose-200 hover:text-white transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="font-semibold text-xs text-rose-300 mb-3 uppercase tracking-wider">Navigate</h3>
                <ul className="space-y-2">
                  {[
                    { label: "Home", href: "/" },
                    { label: "Log In", href: "/login" },
                    { label: "Sign Up", href: "/signup" },
                  ].map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-sm text-rose-200 hover:text-white transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-xs text-rose-300 mb-3 uppercase tracking-wider">What's Inside</h3>
                <ul className="space-y-2">
                  {["Cycle Tracking", "Daily Wellness Tips", "Period Care Store", "Expert Consultants"].map((label) => (
                    <li key={label}>
                      <span className="text-sm text-rose-200/70">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-rose-300/70">
            © {year} GlowCycle. All rights reserved.
          </p>
          <p className="text-xs text-rose-300/70 flex items-center gap-1.5">
            Made with <Heart className="h-3 w-3 text-rose-300 fill-rose-300" /> for every cycle
          </p>
        </div>
      </div>
    </footer>
  );
}
