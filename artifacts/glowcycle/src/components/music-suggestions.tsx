import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Play, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Track = {
  title: string;
  artist: string;
  url: string;
};

type PhaseMusic = {
  mood: string;
  description: string;
  accent: string;
  playlistUrl: string;
  playlistLabel: string;
  tracks: Track[];
};

const MUSIC_BY_PHASE: Record<string, PhaseMusic> = {
  menstrual: {
    mood: "Tender & Low Energy",
    description:
      "Soothing, slow-tempo songs to ease cramps, calm your nervous system, and let you rest. Cozy up with these gentle tracks.",
    accent: "from-rose-100 to-rose-50 dark:from-rose-900/20 dark:to-rose-900/5 border-rose-200/60 text-rose-900 dark:text-rose-100",
    playlistUrl: "https://music.youtube.com/playlist?list=RDCLAK5uy_lf8okgl2ygD075nhnJVjlfhwp8NsUgEbs",
    playlistLabel: "Calm & Cozy on YouTube Music",
    tracks: [
      { title: "Weightless", artist: "Marconi Union", url: "https://music.youtube.com/search?q=Weightless+Marconi+Union" },
      { title: "Sunday Morning", artist: "Norah Jones", url: "https://music.youtube.com/search?q=Sunday+Morning+Norah+Jones" },
      { title: "The Night We Met", artist: "Lord Huron", url: "https://music.youtube.com/search?q=The+Night+We+Met+Lord+Huron" },
      { title: "Holocene", artist: "Bon Iver", url: "https://music.youtube.com/search?q=Holocene+Bon+Iver" },
      { title: "River", artist: "Leon Bridges", url: "https://music.youtube.com/search?q=River+Leon+Bridges" },
    ],
  },
  follicular: {
    mood: "Bright & Optimistic",
    description:
      "Your energy is rising — these upbeat, feel-good tracks match your fresh, motivated headspace. Perfect for morning routines and new starts.",
    accent: "from-pink-100 to-pink-50 dark:from-pink-900/20 dark:to-pink-900/5 border-pink-200/60 text-pink-900 dark:text-pink-100",
    playlistUrl: "https://music.youtube.com/playlist?list=RDCLAK5uy_kuo_NioExeUmw07dFf8BzQ64DKnbSuesk",
    playlistLabel: "Feel-Good Pop on YouTube Music",
    tracks: [
      { title: "Good Days", artist: "SZA", url: "https://music.youtube.com/search?q=Good+Days+SZA" },
      { title: "Flowers", artist: "Miley Cyrus", url: "https://music.youtube.com/search?q=Flowers+Miley+Cyrus" },
      { title: "Walking on Sunshine", artist: "Katrina & The Waves", url: "https://music.youtube.com/search?q=Walking+on+Sunshine+Katrina" },
      { title: "Sunflower", artist: "Post Malone, Swae Lee", url: "https://music.youtube.com/search?q=Sunflower+Post+Malone" },
      { title: "Lovely Day", artist: "Bill Withers", url: "https://music.youtube.com/search?q=Lovely+Day+Bill+Withers" },
    ],
  },
  ovulation: {
    mood: "Confident & Energized",
    description:
      "You're at your most magnetic. Power anthems and high-energy tracks to channel your peak confidence — great for workouts and bold plans.",
    accent: "from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-900/5 border-purple-200/60 text-purple-900 dark:text-purple-100",
    playlistUrl: "https://music.youtube.com/playlist?list=RDCLAK5uy_kmPRjHDECIcuVwnKsx2Ng7b3F4UyVr1nE",
    playlistLabel: "Confidence Boost on YouTube Music",
    tracks: [
      { title: "Levitating", artist: "Dua Lipa", url: "https://music.youtube.com/search?q=Levitating+Dua+Lipa" },
      { title: "Run the World (Girls)", artist: "Beyoncé", url: "https://music.youtube.com/search?q=Run+the+World+Beyonce" },
      { title: "Confident", artist: "Demi Lovato", url: "https://music.youtube.com/search?q=Confident+Demi+Lovato" },
      { title: "Physical", artist: "Dua Lipa", url: "https://music.youtube.com/search?q=Physical+Dua+Lipa" },
      { title: "Stronger", artist: "Kanye West", url: "https://music.youtube.com/search?q=Stronger+Kanye+West" },
    ],
  },
  luteal: {
    mood: "Reflective & Sensitive",
    description:
      "PMS may bring mood swings — these soft, grounding tracks are perfect for calming irritability, journaling, or a quiet evening in.",
    accent: "from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-900/5 border-amber-200/60 text-amber-900 dark:text-amber-100",
    playlistUrl: "https://music.youtube.com/playlist?list=RDCLAK5uy_mHAEb33pqvgdtuxsemicZNu-5w6rLRweo",
    playlistLabel: "Mellow Mood on YouTube Music",
    tracks: [
      { title: "Skinny Love", artist: "Birdy", url: "https://music.youtube.com/search?q=Skinny+Love+Birdy" },
      { title: "Liability", artist: "Lorde", url: "https://music.youtube.com/search?q=Liability+Lorde" },
      { title: "Falling", artist: "Harry Styles", url: "https://music.youtube.com/search?q=Falling+Harry+Styles" },
      { title: "Someone Like You", artist: "Adele", url: "https://music.youtube.com/search?q=Someone+Like+You+Adele" },
      { title: "Breathe Me", artist: "Sia", url: "https://music.youtube.com/search?q=Breathe+Me+Sia" },
    ],
  },
};

export function MusicSuggestions({ phase }: { phase: string }) {
  const music = MUSIC_BY_PHASE[phase] ?? MUSIC_BY_PHASE.follicular;

  return (
    <motion.div
      key={phase}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn("rounded-[2rem] shadow-md overflow-hidden bg-gradient-to-br border", music.accent)}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="bg-background/70 backdrop-blur-sm p-3 rounded-2xl shadow-sm">
                <Music className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-serif">Music for Your Mood</CardTitle>
                <CardDescription className="text-current/70 mt-1 text-sm">
                  {music.mood}
                </CardDescription>
              </div>
            </div>
            <a href={music.playlistUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="rounded-xl gap-2 bg-background/80 hover:bg-background text-foreground shadow-sm backdrop-blur-sm">
                <Play className="h-4 w-4 fill-current" />
                Open Playlist
              </Button>
            </a>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-sm leading-relaxed text-current/80">{music.description}</p>

          <div className="grid sm:grid-cols-2 gap-2">
            {music.tracks.map((t, i) => (
              <motion.a
                key={t.title}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex items-center gap-3 p-3 rounded-xl bg-background/60 hover:bg-background/90 backdrop-blur-sm border border-current/5 hover:border-current/20 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-current/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Play className="h-4 w-4 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-foreground truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.artist}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </motion.a>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-current/60 pt-2 border-t border-current/10">
            <ExternalLink className="h-3 w-3" />
            All links open in YouTube Music. No account needed to listen.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
