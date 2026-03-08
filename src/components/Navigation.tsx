import { View } from "../App";
import { Home, Activity, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export default function Navigation({
  currentView,
  onViewChange,
}: NavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800 px-6 py-4 z-40">
      <div className="max-w-4xl mx-auto flex justify-around items-center">
        <button
          onClick={() => onViewChange("home")}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            currentView === "home"
              ? "text-emerald-500"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button
          onClick={() => onViewChange("activity")}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            currentView === "activity"
              ? "text-emerald-500"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          <Activity className="w-6 h-6" />
          <span className="text-[10px] font-medium">Activity</span>
        </button>
        <button
          onClick={() => onViewChange("wallets")}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            currentView === "wallets"
              ? "text-emerald-500"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <span className="text-[10px] font-medium">Wallets</span>
        </button>
        <button
          onClick={() => onViewChange("alerts")}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            currentView === "alerts"
              ? "text-emerald-500"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          <AlertTriangle className="w-6 h-6" />
          <span className="text-[10px] font-medium">Alerts</span>
        </button>
      </div>
    </div>
  );
}
