import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Droplet, Heart, Activity, ShoppingBag, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BURGUNDY = "#800020";
const SOFT_PINK = "#f7c6d4";
const PASTEL_PINK = "#f2b4c8";
const ROSE_PINK = "#d9829b";

type WaveLine = {
  baseY: number;
  amplitude: number;
  frequency: number;
  phase: number;
  speed: number;
  thickness: number;
  opacity: number;
  color: string;
  driftX: number;
  driftY: number;
  detail: number;
  shadowBlur: number;
};

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

function drawWaveLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  line: WaveLine
) {
  const pointCount = Math.max(28, Math.floor(width / line.detail));
  const points: Array<{ x: number; y: number }> = [];
  const driftX = Math.sin(time * 0.18 + line.phase) * line.driftX * width;
  const driftY = Math.cos(time * 0.16 + line.phase * 1.4) * line.driftY * height;

  for (let index = 0; index <= pointCount; index += 1) {
    const progress = index / pointCount;
    const x = progress * width;
    const waveA = Math.sin(progress * Math.PI * 2 * line.frequency + time * line.speed + line.phase);
    const waveB = Math.sin(progress * Math.PI * 4 * (line.frequency * 0.58) + time * (line.speed * 0.72) + line.phase * 1.3);
    const waveC = Math.sin(progress * Math.PI * 6 * 0.35 + time * (line.speed * 0.45) + line.phase * 2.1);
    const y = line.baseY + driftY + waveA * line.amplitude + waveB * (line.amplitude * 0.33) + waveC * (line.amplitude * 0.15);
    points.push({ x, y });
  }

  ctx.save();
  ctx.translate(driftX, 0);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    const current = points[index];
    const previous = points[index - 1];
    const midX = (previous.x + current.x) / 2;
    const midY = (previous.y + current.y) / 2;
    ctx.quadraticCurveTo(previous.x, previous.y, midX, midY);
  }

  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.strokeStyle = line.color;
  ctx.globalAlpha = line.opacity;
  ctx.lineWidth = line.thickness;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = line.color;
  ctx.shadowBlur = line.shadowBlur;
  ctx.stroke();
  ctx.restore();
}

function HomeBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const nextWidth = Math.max(320, rect.width);
      const nextHeight = Math.max(720, rect.height);
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);

      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.round(nextWidth * nextDpr);
      canvas.height = Math.round(nextHeight * nextDpr);
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;
      context.setTransform(nextDpr, 0, 0, nextDpr, 0, 0);
    };

    const paintStaticFrame = () => {
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";

      const baseWash = context.createRadialGradient(width * 0.5, height * 0.43, 0, width * 0.5, height * 0.43, Math.max(width, height) * 0.62);
      baseWash.addColorStop(0, "rgba(255,255,255,0.96)");
      baseWash.addColorStop(0.55, "rgba(255,248,251,0.74)");
      baseWash.addColorStop(1, "rgba(255,248,251,0.08)");
      context.fillStyle = baseWash;
      context.fillRect(0, 0, width, height);

      const lines: WaveLine[] = [
        {
          baseY: height * 0.22,
          amplitude: Math.max(12, height * 0.018),
          frequency: 1.14,
          phase: 0.2,
          speed: 0.32,
          thickness: 2.2,
          opacity: 0.78,
          color: SOFT_PINK,
          driftX: 0.018,
          driftY: 0.009,
          detail: width / 40,
          shadowBlur: 18,
        },
        {
          baseY: height * 0.46,
          amplitude: Math.max(14, height * 0.022),
          frequency: 1.52,
          phase: 1.5,
          speed: 0.26,
          thickness: 2,
          opacity: 0.46,
          color: BURGUNDY,
          driftX: 0.014,
          driftY: 0.01,
          detail: width / 42,
          shadowBlur: 16,
        },
        {
          baseY: height * 0.66,
          amplitude: Math.max(13, height * 0.02),
          frequency: 1.25,
          phase: 2.3,
          speed: 0.22,
          thickness: 1.75,
          opacity: 0.6,
          color: PASTEL_PINK,
          driftX: 0.01,
          driftY: 0.008,
          detail: width / 44,
          shadowBlur: 14,
        },
        {
          baseY: height * 0.81,
          amplitude: Math.max(10, height * 0.015),
          frequency: 0.94,
          phase: 0.9,
          speed: 0.18,
          thickness: 1.35,
          opacity: 0.34,
          color: ROSE_PINK,
          driftX: 0.008,
          driftY: 0.006,
          detail: width / 48,
          shadowBlur: 10,
        },
      ];

      for (const line of lines) {
        drawWaveLine(context, width, height, 0, line);
      }
    };

    const render = (timestamp: number) => {
      const time = timestamp * 0.000035;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";

      const background = context.createLinearGradient(0, 0, 0, height);
      background.addColorStop(0, "#fff8fb");
      background.addColorStop(0.45, "#fff3f7");
      background.addColorStop(1, "#fff9fc");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const bloom = context.createRadialGradient(width * 0.5, height * 0.42, 0, width * 0.5, height * 0.42, Math.max(width, height) * 0.66);
      bloom.addColorStop(0, "rgba(255,255,255,0.92)");
      bloom.addColorStop(0.52, "rgba(255,247,250,0.7)");
      bloom.addColorStop(1, "rgba(255,247,250,0.04)");
      context.fillStyle = bloom;
      context.fillRect(0, 0, width, height);

      const lines: WaveLine[] = [
        {
          baseY: height * 0.2,
          amplitude: Math.max(12, height * 0.02),
          frequency: 1.08,
          phase: 0.2,
          speed: 0.72,
          thickness: 2.2,
          opacity: 0.7,
          color: SOFT_PINK,
          driftX: 0.018,
          driftY: 0.009,
          detail: width / 40,
          shadowBlur: 18,
        },
        {
          baseY: height * 0.43,
          amplitude: Math.max(14, height * 0.024),
          frequency: 1.44,
          phase: 1.65,
          speed: 0.56,
          thickness: 2,
          opacity: 0.48,
          color: BURGUNDY,
          driftX: 0.014,
          driftY: 0.01,
          detail: width / 42,
          shadowBlur: 16,
        },
        {
          baseY: height * 0.63,
          amplitude: Math.max(13, height * 0.022),
          frequency: 1.22,
          phase: 2.35,
          speed: 0.44,
          thickness: 1.75,
          opacity: 0.58,
          color: PASTEL_PINK,
          driftX: 0.01,
          driftY: 0.008,
          detail: width / 44,
          shadowBlur: 14,
        },
        {
          baseY: height * 0.8,
          amplitude: Math.max(10, height * 0.016),
          frequency: 0.92,
          phase: 0.95,
          speed: 0.36,
          thickness: 1.35,
          opacity: 0.32,
          color: ROSE_PINK,
          driftX: 0.008,
          driftY: 0.006,
          detail: width / 48,
          shadowBlur: 10,
        },
      ];

      for (const line of lines) {
        drawWaveLine(context, width, height, time, line);
      }

      if (!prefersReducedMotion) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    resize();

    if (prefersReducedMotion) {
      paintStaticFrame();
    } else {
      frameId = window.requestAnimationFrame(render);
    }

    const handleResize = () => {
      resize();
      if (prefersReducedMotion) {
        paintStaticFrame();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#fff8fb_0%,#fff3f7_42%,#fff9fc_100%)]" />
      <div className="absolute -left-32 top-[-6rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(255,186,208,0.42)_0%,rgba(255,186,208,0.16)_36%,rgba(255,186,208,0)_72%)] blur-3xl" />
      <div className="absolute -right-36 top-24 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(128,0,32,0.16)_0%,rgba(128,0,32,0.08)_34%,rgba(128,0,32,0)_72%)] blur-3xl" />
      <div className="absolute bottom-[-8rem] left-1/4 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(255,200,218,0.36)_0%,rgba(255,200,218,0.12)_40%,rgba(255,200,218,0)_75%)] blur-3xl" />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-80"
        style={{ transform: "translate3d(0,0,0)", willChange: "transform" }}
      />

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
