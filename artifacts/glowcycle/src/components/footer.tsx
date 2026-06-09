import { Link, useLocation } from "wouter";
import { Droplet, Heart, Facebook, Instagram, Linkedin, Github, Mail, Phone } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

const socialLinks = [
  { icon: Facebook,  label: "Facebook",  href: "https://www.facebook.com/login" },
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/accounts/login/" },
  { icon: Linkedin,  label: "LinkedIn",  href: "https://www.linkedin.com/login" },
  { icon: Github,    label: "GitHub",    href: "https://github.com/login" },
];

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  return (
    <button
      type="button"
      onClick={() => {
        setLocation(href);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="text-sm text-rose-200 hover:text-white transition-colors text-left"
    >
      {children}
    </button>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const { data: user } = useGetMe();

  return (
    <footer className="border-t mt-auto" style={{ background: "linear-gradient(135deg, #2d0010 0%, #800020 60%, #a0003a 100%)" }}>
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8">

          {/* Brand + social */}
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Droplet className="h-5 w-5 text-rose-200" />
              <span className="font-serif font-bold text-lg text-white">GlowCycle</span>
            </div>
            <p className="text-sm text-rose-200/80 leading-relaxed mb-5">
              Your gentle cycle companion. Track, learn, and thrive at every phase of your journey.
            </p>
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

          {/* Dynamic nav columns */}
          {user ? (
            <>
              <div>
                <h3 className="font-semibold text-xs text-rose-300 mb-3 uppercase tracking-wider">Features</h3>
                <ul className="space-y-2">
                  {[
                    { label: "Cycle Tracker", href: "/tracker" },
                    { label: "Calendar",      href: "/calendar" },
                    { label: "Wellness Tips", href: "/wellness" },
                    { label: "Consultants",   href: "/consultants" },
                  ].map((item) => (
                    <li key={item.href}>
                      <FooterLink href={item.href}>{item.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-xs text-rose-300 mb-3 uppercase tracking-wider">Account</h3>
                <ul className="space-y-2">
                  {[
                    { label: "Store",         href: "/store" },
                    { label: "Order History", href: "/orders" },
                    { label: "Profile",       href: "/profile" },
                  ].map((item) => (
                    <li key={item.href}>
                      <FooterLink href={item.href}>{item.label}</FooterLink>
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
                    { label: "Home",    href: "/" },
                    { label: "Log In",  href: "/login" },
                    { label: "Sign Up", href: "/signup" },
                  ].map((item) => (
                    <li key={item.href}>
                      <FooterLink href={item.href}>{item.label}</FooterLink>
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

          {/* Contact Us */}
          <div>
            <h3 className="font-semibold text-xs text-rose-300 mb-3 uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:m2934547@gmail.com"
                  className="flex items-start gap-2.5 text-sm text-rose-200 hover:text-white transition-colors group"
                >
                  <span
                    className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  >
                    <Mail className="h-3.5 w-3.5 text-rose-200 group-hover:text-white" />
                  </span>
                  <span className="leading-relaxed">m2934547@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+916239592150"
                  className="flex items-start gap-2.5 text-sm text-rose-200 hover:text-white transition-colors group"
                >
                  <span
                    className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  >
                    <Phone className="h-3.5 w-3.5 text-rose-200 group-hover:text-white" />
                  </span>
                  <span className="leading-relaxed">+91 62395 92150</span>
                </a>
              </li>
            </ul>
          </div>

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
