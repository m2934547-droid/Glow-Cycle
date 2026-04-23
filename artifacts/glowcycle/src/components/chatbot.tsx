import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGetMe } from "@workspace/api-client-react";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
}

interface QA {
  question: string;
  answer: string;
  category: string;
}

const QA_DATA: QA[] = [
  {
    category: "Cycle Basics",
    question: "How long is a normal menstrual cycle?",
    answer: "A normal menstrual cycle is typically 21 to 35 days long, with an average of 28 days. The cycle is counted from the first day of one period to the first day of the next. Every woman is different — what matters most is consistency in your own cycle.",
  },
  {
    category: "Cycle Basics",
    question: "How many days does a period typically last?",
    answer: "A period typically lasts between 3 to 7 days. Light flow days are common at the start and end, with heavier flow usually on days 2 and 3. If your period lasts longer than 7 days consistently, it's worth speaking to a healthcare provider.",
  },
  {
    category: "Cycle Basics",
    question: "What are the 4 phases of the menstrual cycle?",
    answer: "The four phases are:\n1. Menstrual Phase (Days 1–5): Shedding of the uterine lining. Rest and iron-rich foods are important.\n2. Follicular Phase (Days 6–13): Estrogen rises, energy increases, you feel more motivated.\n3. Ovulation Phase (Days 14–16): An egg is released. You may feel your most energetic and social.\n4. Luteal Phase (Days 17–28): Progesterone rises, PMS may occur. Self-care is key.",
  },
  {
    category: "Tracking",
    question: "How do I track my period on GlowCycle?",
    answer: "Go to the Tracker page and click 'Log New Period'. Enter the start date of your last period and your average cycle length (default is 28 days). GlowCycle will automatically calculate your next expected period, ovulation date, and fertile window for you.",
  },
  {
    category: "Tracking",
    question: "When is my ovulation date?",
    answer: "Ovulation typically occurs about 14 days before your next period starts. For a 28-day cycle, ovulation is usually around Day 14. GlowCycle calculates this for you on the Tracker and Calendar pages based on your logged cycle data.",
  },
  {
    category: "Tracking",
    question: "What is the fertile window?",
    answer: "The fertile window is the 5–6 days when pregnancy is possible — typically the 5 days before ovulation and the day of ovulation itself. On GlowCycle's calendar, fertile days are highlighted in light pink and ovulation day in purple.",
  },
  {
    category: "Health & BMI",
    question: "How does BMI affect my menstrual cycle?",
    answer: "BMI can significantly affect your cycle. Being underweight (BMI < 18.5) can cause irregular or absent periods because the body lacks fat reserves needed for hormonal production. Being overweight (BMI > 25) can cause heavy, irregular periods due to excess estrogen from fat cells. A normal BMI (18.5–24.9) generally supports regular, healthy cycles.",
  },
  {
    category: "Health & BMI",
    question: "How is BMI calculated?",
    answer: "BMI = Weight (kg) ÷ Height (m)²\n\nFor example, if you weigh 60 kg and are 1.65 m tall:\nBMI = 60 ÷ (1.65 × 1.65) = 60 ÷ 2.7225 ≈ 22.0 (Normal)\n\nCategories:\n• Under 18.5 → Underweight\n• 18.5–24.9 → Normal\n• 25–29.9 → Overweight\n• 30 and above → Obese",
  },
  {
    category: "Symptoms",
    question: "How can I reduce period cramps?",
    answer: "Here are effective ways to reduce period cramps:\n• Apply a heating pad to your lower abdomen\n• Take over-the-counter pain relief (ibuprofen works well)\n• Try gentle yoga or stretching\n• Stay hydrated with warm herbal teas\n• Eat magnesium-rich foods like bananas and almonds\n• Light walking can help improve blood flow\n• Get enough rest and sleep\nOur store has heating pads and pain relief products to help!",
  },
  {
    category: "Symptoms",
    question: "Why do I feel moody before my period?",
    answer: "Mood changes before your period are called PMS (Premenstrual Syndrome) and are caused by hormonal fluctuations — specifically the drop in estrogen and progesterone in the luteal phase. Common mood symptoms include irritability, anxiety, sadness, and fatigue.\n\nTo manage PMS mood swings:\n• Eat complex carbs (oats, brown rice)\n• Reduce caffeine and sugar\n• Exercise gently\n• Practice mindfulness or journaling\n• Get adequate sleep\nCheck the Wellness section for phase-specific tips!",
  },
  {
    category: "Symptoms",
    question: "Is it normal to have irregular periods?",
    answer: "Occasional irregularity is normal and can be caused by stress, travel, significant weight changes, illness, or hormonal fluctuations. However, consistently irregular periods (outside the 21–35 day range) may indicate conditions like PCOS, thyroid issues, or hormonal imbalances. If your periods are very irregular, very painful, or extremely heavy, consult a healthcare provider.",
  },
  {
    category: "Products",
    question: "What period care products does GlowCycle store offer?",
    answer: "Our Period Care Store offers a curated selection across 6 categories:\n• Sanitary Pads — ultra-thin, overnight, and flow-specific options\n• Tampons — regular and super absorbency\n• Menstrual Cups & Discs — eco-friendly, reusable options\n• Pain Relief — cramp patches and tablets\n• Heating Pads — portable and plug-in options\n• Comfort Kits — teas, chocolates, bath salts and self-care bundles\nAll prices are in INR. Visit the Store page to shop!",
  },
  {
    category: "Products",
    question: "Which product is best for heavy flow?",
    answer: "For heavy flow days, we recommend:\n• Overnight sanitary pads for extra-long coverage\n• Super absorbency tampons\n• A menstrual cup (holds 3x more than a regular tampon)\n• Pairing with a heating pad for cramp relief\nYou can find all these in our store, and we recommend them based on your expected period date!",
  },
  {
    category: "Products",
    question: "Are menstrual cups safe to use?",
    answer: "Yes, menstrual cups are safe and recommended by gynecologists. They are made of medical-grade silicone and can be worn for up to 12 hours. Benefits include:\n• More eco-friendly than disposables\n• Cost-effective in the long run\n• No risk of TSS when used correctly\n• Comfortable once you learn to insert it\nWe offer quality menstrual cups in our store!",
  },
  {
    category: "Nutrition",
    question: "What foods should I eat during my period?",
    answer: "During your period (menstrual phase):\n• Iron-rich foods: spinach, lentils, red meat, fortified cereals (replace lost iron)\n• Magnesium: almonds, bananas, dark chocolate (reduce cramps)\n• Vitamin C: citrus fruits, bell peppers (help absorb iron)\n• Warm herbal teas: ginger, chamomile, raspberry leaf\n• Stay well-hydrated\n• Avoid: excessive salt (bloating), caffeine (worsens cramps), alcohol\nCheck the Wellness section for phase-specific nutrition tips!",
  },
  {
    category: "Nutrition",
    question: "Does dark chocolate really help with period pain?",
    answer: "Yes! Dark chocolate (70% or higher cocoa) contains magnesium, which helps relax uterine muscles and reduce cramping. It also boosts serotonin levels, which can improve mood during PMS. It's a delicious, science-backed comfort food for your period! We even have a Dark Chocolate Gift Box in our store.",
  },
  {
    category: "App Features",
    question: "How do I use the GlowCycle calendar?",
    answer: "Go to the Calendar page to see your monthly view. Dates are color-coded:\n• Dark Pink — your period days\n• Purple — ovulation day\n• Light Pink — fertile window days\n\nYou can click on any date to add a personal note or journal entry. This helps you track symptoms, moods, and any important health observations over time.",
  },
  {
    category: "App Features",
    question: "What is the Wellness section for?",
    answer: "The Wellness section provides personalized health tips based on your current cycle phase. For each of the 4 phases, you'll find:\n• Diet recommendations\n• Exercise suggestions\n• Self-care tips\n• Mood management strategies\nThe tips automatically reflect your current phase based on your logged cycle data.",
  },
];

const SUGGESTED_QUESTIONS = [
  "How long is a normal menstrual cycle?",
  "How do I track my period on GlowCycle?",
  "How can I reduce period cramps?",
  "What foods should I eat during my period?",
  "How does BMI affect my menstrual cycle?",
  "What period care products does GlowCycle store offer?",
];

let nextId = 1;

const WELCOME_MESSAGE: Message = {
  id: nextId++,
  from: "bot",
  text: "Hello! I am your GlowCycle health companion. Ask me anything about your menstrual cycle, period care, nutrition, or how to use the app. You can type a question or pick one below:",
};

export function Chatbot() {
  const { data: user } = useGetMe();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!user) return null;

  function findAnswer(query: string): string {
    const q = query.toLowerCase().trim();
    const match = QA_DATA.find((item) =>
      item.question.toLowerCase().includes(q) ||
      q.includes(item.question.toLowerCase().slice(0, 20)) ||
      item.answer.toLowerCase().includes(q.slice(0, 20))
    );

    if (match) return match.answer;

    // Keyword-based fallback
    if (q.includes("cramp") || q.includes("pain")) {
      return QA_DATA.find(i => i.question.includes("cramps"))?.answer ?? defaultAnswer();
    }
    if (q.includes("bmi") || q.includes("weight") || q.includes("height")) {
      return QA_DATA.find(i => i.question.includes("BMI affect"))?.answer ?? defaultAnswer();
    }
    if (q.includes("ovulat")) {
      return QA_DATA.find(i => i.question.includes("ovulation date"))?.answer ?? defaultAnswer();
    }
    if (q.includes("fertile") || q.includes("window")) {
      return QA_DATA.find(i => i.question.includes("fertile window"))?.answer ?? defaultAnswer();
    }
    if (q.includes("mood") || q.includes("pms") || q.includes("irritab")) {
      return QA_DATA.find(i => i.question.includes("moody"))?.answer ?? defaultAnswer();
    }
    if (q.includes("chocolate")) {
      return QA_DATA.find(i => i.question.includes("chocolate"))?.answer ?? defaultAnswer();
    }
    if (q.includes("cup") || q.includes("menstrual cup")) {
      return QA_DATA.find(i => i.question.includes("cups safe"))?.answer ?? defaultAnswer();
    }
    if (q.includes("food") || q.includes("eat") || q.includes("diet") || q.includes("nutrition")) {
      return QA_DATA.find(i => i.question.includes("foods should I eat"))?.answer ?? defaultAnswer();
    }
    if (q.includes("track") || q.includes("log")) {
      return QA_DATA.find(i => i.question.includes("track my period"))?.answer ?? defaultAnswer();
    }
    if (q.includes("phase") || q.includes("follicular") || q.includes("luteal") || q.includes("menstrual phase")) {
      return QA_DATA.find(i => i.question.includes("4 phases"))?.answer ?? defaultAnswer();
    }
    if (q.includes("irregular")) {
      return QA_DATA.find(i => i.question.includes("irregular"))?.answer ?? defaultAnswer();
    }
    if (q.includes("store") || q.includes("product") || q.includes("buy")) {
      return QA_DATA.find(i => i.question.includes("store offer"))?.answer ?? defaultAnswer();
    }
    if (q.includes("calendar")) {
      return QA_DATA.find(i => i.question.includes("calendar"))?.answer ?? defaultAnswer();
    }
    if (q.includes("wellness")) {
      return QA_DATA.find(i => i.question.includes("Wellness section"))?.answer ?? defaultAnswer();
    }

    return defaultAnswer();
  }

  function defaultAnswer(): string {
    return "I am not sure about that specific question. Here are some things I can help you with:\n• Menstrual cycle basics and phases\n• Tracking your period on GlowCycle\n• Period symptoms and relief tips\n• Nutrition and wellness advice\n• BMI and cycle health\n• Store products and recommendations\n\nTry asking one of the suggested questions, or type your query differently!";
  }

  function sendMessage(text: string) {
    if (!text.trim()) return;
    setShowSuggestions(false);

    const userMsg: Message = { id: nextId++, from: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const answer = findAnswer(text);
      const botMsg: Message = { id: nextId++, from: "bot", text: answer };
      setMessages((prev) => [...prev, botMsg]);
    }, 400);
  }

  const categories = [...new Set(QA_DATA.map(q => q.category))];

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 right-5 md:bottom-8 md:right-8 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center"
            aria-label="Open health assistant"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-3 left-3 md:left-auto md:right-6 md:bottom-6 md:w-[380px] z-50 flex flex-col rounded-[2rem] overflow-hidden shadow-2xl border border-primary/15 bg-background"
            style={{ maxHeight: "min(85dvh, 600px)" }}
          >
            {/* Header */}
            <div className="bg-primary px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-primary-foreground text-sm leading-none">GlowCycle Assistant</p>
                  <p className="text-primary-foreground/70 text-xs mt-0.5">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors p-1"
                aria-label="Close chatbot"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", msg.from === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line",
                      msg.from === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {/* Suggested questions */}
              {showSuggestions && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-1">
                  <p className="text-xs text-muted-foreground font-medium px-1">Suggested questions:</p>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left text-xs px-3 py-2 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors leading-snug"
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}

              {!showSuggestions && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowSuggestions(true)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ChevronDown className="h-3 w-3" /> Show suggested questions
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Category quick picks */}
            <div className="px-4 py-2 border-t border-border/50 bg-muted/30 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    const first = QA_DATA.find(q => q.category === cat);
                    if (first) sendMessage(first.question);
                  }}
                  className="text-[10px] px-3 py-1 rounded-full border border-primary/20 text-primary whitespace-nowrap hover:bg-primary/10 transition-colors shrink-0"
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50 flex gap-2 shrink-0 bg-background">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask me anything..."
                className="flex-1 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground"
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
