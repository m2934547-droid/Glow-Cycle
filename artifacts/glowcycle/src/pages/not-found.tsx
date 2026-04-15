import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Droplet } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-md"
      >
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-2">
          <Droplet className="h-12 w-12 text-primary" />
        </div>
        
        <h1 className="text-5xl font-serif font-bold text-foreground">404</h1>
        
        <h2 className="text-2xl font-medium text-foreground/80">Page not found</h2>
        
        <p className="text-muted-foreground text-lg">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="pt-8">
          <Link href="/">
            <Button size="lg" className="rounded-full px-8 shadow-md hover-elevate h-12 text-base">
              Return Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
