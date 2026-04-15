import { Router, type IRouter } from "express";
import { GetWellnessTipsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const wellnessTips: Record<string, {
  phaseDescription: string;
  dietTips: string[];
  exerciseTips: string[];
  selfCareTips: string[];
  moodTips: string[];
}> = {
  menstrual: {
    phaseDescription: "Your body is shedding the uterine lining. Rest and gentle care are essential right now.",
    dietTips: [
      "Eat iron-rich foods like spinach, lentils, and red meat to replenish lost iron",
      "Dark chocolate can help with cravings and boost serotonin",
      "Stay hydrated with warm herbal teas like ginger or chamomile",
      "Avoid salty and processed foods to reduce bloating",
      "Magnesium-rich foods like almonds and bananas ease cramps",
    ],
    exerciseTips: [
      "Gentle yoga and stretching to relieve cramps",
      "Short walks in fresh air can boost your mood",
      "Light swimming if you feel up to it",
      "Rest is productive — listen to your body",
    ],
    selfCareTips: [
      "Use a heating pad on your lower abdomen for cramp relief",
      "Take warm baths with Epsom salts",
      "Get extra sleep — your body is working hard",
      "Journal your feelings and be kind to yourself",
      "Wear comfortable, loose clothing",
    ],
    moodTips: [
      "It is completely normal to feel fatigued or emotional right now",
      "Watch your favorite movies or shows without guilt",
      "Reach out to a trusted friend for support",
      "Practice deep breathing exercises when feeling overwhelmed",
    ],
  },
  follicular: {
    phaseDescription: "Estrogen is rising, energy levels increase, and you may feel more optimistic and creative.",
    dietTips: [
      "Focus on fermented foods like yogurt and kimchi to support gut health",
      "Eat plenty of fresh vegetables and fruits for antioxidants",
      "Lean proteins like chicken and tofu support new tissue growth",
      "Complex carbs like quinoa and oats provide sustained energy",
    ],
    exerciseTips: [
      "Try high-intensity workouts — your energy is building",
      "Start a new fitness challenge or class",
      "Cardio like running, cycling, or dancing",
      "Strength training works well during this phase",
    ],
    selfCareTips: [
      "This is a great time to try new things and set intentions",
      "Plan social activities — you are likely to feel sociable",
      "Start a creative project you have been postponing",
      "Refresh your skincare routine",
    ],
    moodTips: [
      "Harness your rising energy for goal-setting",
      "Your confidence is naturally higher now — use it",
      "Connect with friends and loved ones",
      "Try mindfulness meditation to stay grounded",
    ],
  },
  ovulation: {
    phaseDescription: "Peak fertility window. You may feel your most energetic, confident, and social this phase.",
    dietTips: [
      "Increase fiber intake with whole grains and vegetables",
      "Stay well-hydrated — aim for 8-10 glasses of water daily",
      "Antioxidant-rich berries and citrus fruits support egg quality",
      "Zinc-rich foods like pumpkin seeds and shellfish are beneficial",
      "Anti-inflammatory foods like turmeric and omega-3 rich fish",
    ],
    exerciseTips: [
      "Push yourself in workouts — this is your peak performance window",
      "Try group fitness classes to leverage your social energy",
      "High-intensity interval training (HIIT) works great now",
      "Sports and competitive activities feel particularly rewarding",
    ],
    selfCareTips: [
      "Schedule important meetings or presentations during this phase",
      "This is a great time for social events and networking",
      "Wear something that makes you feel confident and beautiful",
      "Take photos — many women feel their most radiant now",
    ],
    moodTips: [
      "Your communication skills are at their peak",
      "Express yourself creatively — art, writing, or music",
      "Enjoy your natural high energy and confidence",
      "Use this time for difficult conversations that need clarity",
    ],
  },
  luteal: {
    phaseDescription: "Progesterone rises then falls. PMS symptoms may appear in the second half. Self-care is key.",
    dietTips: [
      "Complex carbohydrates help stabilize mood — oats, brown rice, sweet potato",
      "Calcium-rich foods ease PMS symptoms — dairy, broccoli, kale",
      "Reduce caffeine and alcohol to minimize anxiety and bloating",
      "Vitamin B6-rich foods like bananas and sunflower seeds help with mood",
      "Eat small, frequent meals to maintain stable blood sugar",
    ],
    exerciseTips: [
      "Moderate exercise like yoga or pilates is ideal",
      "Walking and light cardio support mood stability",
      "Reduce workout intensity if you feel fatigued",
      "Restorative yoga in the late luteal phase is very helpful",
    ],
    selfCareTips: [
      "Prioritize sleep — aim for 8-9 hours nightly",
      "Reduce screen time before bed for better sleep quality",
      "Practice journaling to process emotions",
      "Say no to commitments that drain your energy",
      "Prepare cozy self-care activities for the end of this phase",
    ],
    moodTips: [
      "Mood swings are normal — be patient with yourself",
      "Identify your PMS triggers and create a comfort plan",
      "Communicate your needs clearly to loved ones",
      "Mindfulness and breathing exercises manage anxiety well",
      "Remember — this phase is temporary and will pass",
    ],
  },
};

const quotes = [
  { text: "Your body is not a problem to be solved, but a miracle to be celebrated.", author: "Unknown" },
  { text: "Taking care of yourself is the most powerful way to begin to take care of others.", author: "Bryant McGill" },
  { text: "You are allowed to be both a masterpiece and a work in progress simultaneously.", author: "Sophia Bush" },
  { text: "Her strength was not in never being afraid, but in carrying on despite the fear.", author: "Unknown" },
  { text: "She remembered who she was and the game changed.", author: "Lalah Delia" },
  { text: "Caring for myself is not self-indulgence. It is self-preservation.", author: "Audre Lorde" },
  { text: "You are enough just as you are. Each emotion you feel is valid.", author: "Meghan Markle" },
  { text: "Nourishing yourself in a way that helps you blossom in the direction you want to go is attainable.", author: "Deborah Day" },
  { text: "Be gentle with yourself — you are a child of the universe.", author: "Max Ehrmann" },
  { text: "Loving yourself first does not mean others love you less.", author: "Unknown" },
];

router.get("/wellness/tips", async (req, res): Promise<void> => {
  const qParams = GetWellnessTipsQueryParams.safeParse(req.query);
  const phase = (qParams.success ? qParams.data.phase : null) ?? "follicular";

  const tips = wellnessTips[phase as keyof typeof wellnessTips] ?? wellnessTips.follicular;

  res.json({
    phase,
    ...tips,
  });
});

router.get("/wellness/quotes", async (_req, res): Promise<void> => {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  res.json(randomQuote);
});

export default router;
