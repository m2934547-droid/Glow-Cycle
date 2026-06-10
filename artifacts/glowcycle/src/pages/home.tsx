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

function HomeBackground() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#fff7fa_0%,#fff3f7_42%,#fff8fb_100%)]" />
      <div className="absolute -left-32 top-[-6rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(255,186,208,0.42)_0%,rgba(255,186,208,0.16)_36%,rgba(255,186,208,0)_72%)] blur-3xl" />
      <div className="absolute -right-36 top-24 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(128,0,32,0.16)_0%,rgba(128,0,32,0.08)_34%,rgba(128,0,32,0)_72%)] blur-3xl" />
      <div className="absolute bottom-[-8rem] left-1/4 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(255,200,218,0.36)_0%,rgba(255,200,218,0.12)_40%,rgba(255,200,218,0)_75%)] blur-3xl" />

      <svg
        viewBox="0 0 1440 900"
        className="absolute inset-0 h-full w-full opacity-60"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="lineSoftPink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f7c6d4" stopOpacity="0.9" />
            <stop offset="48%" stopColor="#d9829b" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#800020" stopOpacity="0.72" />
          </linearGradient>
          <linearGradient id="lineBurgundy" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#800020" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f4aebe" stopOpacity="0.22" />
          </linearGradient>
          <radialGradient id="centerWash" cx="50%" cy="46%" r="34%">
            <stop offset="0%" stopColor="#fffdfd" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#fff8fb" stopOpacity="0.66" />
            <stop offset="100%" stopColor="#fff8fb" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1440" height="900" fill="url(#centerWash)" />

        <path
          d="M-40 220 C 140 160, 250 120, 390 150 S 650 250, 785 182 S 1090 40, 1480 190"
          fill="none"
          stroke="url(#lineSoftPink)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M-80 640 C 120 560, 240 450, 390 476 S 700 610, 850 522 S 1110 360, 1510 430"
          fill="none"
          stroke="url(#lineBurgundy)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M150 930 C 250 760, 290 650, 330 540 S 440 290, 560 210 S 780 100, 960 140 S 1180 250, 1460 70"
          fill="none"
          stroke="url(#lineSoftPink)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
        <path
          d="M40 120 C 210 160, 340 210, 470 290 S 760 500, 920 470 S 1190 280, 1450 330"
          fill="none"
          stroke="url(#lineBurgundy)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.52"
        />
        <path
          d="M-20 360 C 180 300, 300 260, 435 300 S 690 420, 810 365 S 1040 210, 1460 250"
          fill="none"
          stroke="#f2b4c8"
          strokeOpacity="0.32"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M-40 760 C 180 700, 300 640, 450 660 S 770 740, 930 690 S 1160 540, 1480 600"
          fill="none"
          stroke="#8b1034"
          strokeOpacity="0.18"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.54)_30%,rgba(255,255,255,0.1)_54%,rgba(255,255,255,0)_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0)_18%,rgba(255,255,255,0)_82%,rgba(255,255,255,0.18)_100%)]" />
    </div>
  );
}

export default function Home() {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const toggle = (id: string) => setActiveCard((prev) => (prev === id ? null : id));

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
      <HomeBackground />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center justify-center px-4 pt-10 text-center sm:pt-16">
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
