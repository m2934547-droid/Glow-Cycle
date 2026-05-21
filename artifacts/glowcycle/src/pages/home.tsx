import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Droplet, Heart, Activity, ShoppingBag, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BURGUNDY = "#800020";

const featureCards = [
  {
    id: "track",
    icon: Heart,
    title: "Track with Care",
    tagline: "Log your periods and symptoms in a beautiful, stress-free interface.",
    details: {
      heading: "Everything you need to track your cycle",
      bullets: [
        "Log period start & end dates in seconds",
        "Predict your next period and fertile window",
        "Visualise your cycle on an interactive calendar",
        "See ovulation day and plan accordingly",
        "Track notes and mood for each day",
      ],
      cta: { label: "Start Tracking", href: "/signup" },
    },
  },
  {
    id: "wellness",
    icon: Activity,
    title: "Daily Wellness",
    tagline: "Receive personalised self-care and diet tips tailored to your exact phase.",
    details: {
      heading: "Phase-by-phase guidance just for you",
      bullets: [
        "Diet tips optimised for each cycle phase",
        "Exercise recommendations — gentle or energising",
        "Self-care rituals for cramp relief and mood",
        "Emotional wellness support throughout your month",
        "Backed by research, written with warmth",
      ],
      cta: { label: "Explore Wellness", href: "/signup" },
    },
  },
  {
    id: "store",
    icon: ShoppingBag,
    title: "Curated Store",
    tagline: "Shop highly rated, organic period care products delivered to your door.",
    details: {
      heading: "Products chosen with your health in mind",
      bullets: [
        "Organic pads, tampons, menstrual cups & discs",
        "Heating pads, pain relief, and wellness teas",
        "12+ handpicked products across 6 categories",
        "Honest ratings and reviews from real users",
        "Simple checkout with order tracking",
      ],
      cta: { label: "Visit the Store", href: "/signup" },
    },
  },
];

export default function Home() {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const toggle = (id: string) => setActiveCard((prev) => (prev === id ? null : id));

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="max-w-3xl text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Droplet className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground leading-tight">
            Your gentle <br />
            <span className="text-primary relative whitespace-nowrap">cycle companion</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            GlowCycle helps you understand your body, track your phases, and nurture your wellness — all in one soft, empowering space.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
        >
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto text-lg px-8 rounded-full h-14 shadow-lg shadow-primary/25 hover-elevate">
              Start Your Journey
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 rounded-full h-14 bg-white/50 backdrop-blur-sm border-primary/20 text-primary hover:bg-primary/5 hover:text-primary hover-elevate">
              Welcome Back
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Feature Cards */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto w-full px-4"
      >
        {featureCards.map((card) => {
          const isActive = activeCard === card.id;
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              layout
              onClick={() => toggle(card.id)}
              animate={{
                scale: isActive ? 1.04 : 1,
                boxShadow: isActive
                  ? `0 20px 48px -8px ${BURGUNDY}55`
                  : "0 2px 12px 0 rgba(0,0,0,0.06)",
              }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="rounded-3xl cursor-pointer select-none overflow-hidden border transition-colors duration-300"
              style={{
                background: isActive ? `linear-gradient(135deg, #2d0010 0%, ${BURGUNDY} 100%)` : undefined,
                borderColor: isActive ? BURGUNDY : undefined,
              }}
            >
              <div
                className={
                  isActive
                    ? "p-8 text-white"
                    : "bg-card/50 backdrop-blur-sm border-card-border p-8 text-foreground hover-elevate transition-all duration-300 group"
                }
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col items-center gap-4 flex-1 text-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ background: isActive ? "rgba(255,255,255,0.15)" : undefined }}
                      {...(!isActive && { className: "mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" })}
                    >
                      <Icon className={`h-6 w-6 ${isActive ? "text-rose-200" : "text-primary"}`} />
                    </div>
                    <h3 className={`text-xl font-bold font-serif ${isActive ? "text-white" : ""}`}>
                      {card.title}
                    </h3>
                    <p className={`leading-relaxed text-sm ${isActive ? "text-rose-200" : "text-muted-foreground"}`}>
                      {card.tagline}
                    </p>
                  </div>
                  {isActive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveCard(null); }}
                      className="text-rose-300 hover:text-white transition-colors shrink-0 -mt-1 -mr-2 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Expanded info */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6 pt-5 border-t border-white/20 space-y-4">
                        <p className="text-sm font-semibold text-white">{card.details.heading}</p>
                        <ul className="space-y-2">
                          {card.details.bullets.map((b) => (
                            <li key={b} className="flex items-start gap-2.5 text-sm text-rose-100">
                              <CheckCircle2 className="h-4 w-4 text-rose-300 shrink-0 mt-0.5" />
                              {b}
                            </li>
                          ))}
                        </ul>
                        <Link href={card.details.cta.href} onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            className="mt-2 rounded-full w-full text-sm font-semibold"
                            style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}
                          >
                            {card.details.cta.label} →
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
