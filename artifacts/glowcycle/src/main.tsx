import { createRoot } from "react-dom/client";
import App from "./App";
import "leaflet/dist/leaflet.css";
import "./index.css";
import { WaveBackdrop } from "@/components/wave-backdrop";

createRoot(document.getElementById("root")!).render(
  <div className="relative isolate min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fff8fb_0%,#fff3f7_45%,#fff9fc_100%)] text-foreground">
    <WaveBackdrop className="fixed inset-0 -z-10" />
    <div className="relative z-10">
      <App />
    </div>
  </div>
);
