import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Droplet, Heart, Activity, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
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
            <span className="text-primary relative whitespace-nowrap">
              cycle companion
            </span>
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

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto w-full px-4"
      >
        <div className="bg-card/50 backdrop-blur-sm border border-card-border p-8 rounded-3xl text-center space-y-4 hover-elevate transition-all duration-300 group">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold font-serif">Track with Care</h3>
          <p className="text-muted-foreground leading-relaxed">Log your periods and symptoms in a beautiful, stress-free interface.</p>
        </div>
        
        <div className="bg-card/50 backdrop-blur-sm border border-card-border p-8 rounded-3xl text-center space-y-4 hover-elevate transition-all duration-300 group">
          <div className="mx-auto w-12 h-12 bg-secondary/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold font-serif">Daily Wellness</h3>
          <p className="text-muted-foreground leading-relaxed">Receive personalized self-care and diet tips tailored to your exact phase.</p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-card-border p-8 rounded-3xl text-center space-y-4 hover-elevate transition-all duration-300 group">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShoppingBag className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold font-serif">Curated Store</h3>
          <p className="text-muted-foreground leading-relaxed">Shop highly rated, organic period care products delivered to your door.</p>
        </div>
      </motion.div>
    </div>
  );
}
