import { Minus, Plus } from "lucide-react";

interface CounterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color?: "primary" | "accent" | "destructive" | "warning";
}

const colorMap = {
  primary: "border-primary/40 glow-primary",
  accent: "border-accent/40 glow-accent",
  destructive: "border-destructive/40 glow-destructive",
  warning: "border-warning/40",
};

const btnMap = {
  primary: "bg-primary/20 hover:bg-primary/30 text-primary",
  accent: "bg-accent/20 hover:bg-accent/30 text-accent",
  destructive: "bg-destructive/20 hover:bg-destructive/30 text-destructive",
  warning: "bg-warning/20 hover:bg-warning/30 text-warning",
};

const Counter = ({ label, value, onChange, color = "primary" }: CounterProps) => {
  return (
    <div className={`flex flex-col items-center gap-2 rounded-xl border p-4 bg-card ${colorMap[color]}`}>
      <span className="text-xs font-display uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-3xl font-mono-tech font-bold text-foreground">{value}</span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className={`rounded-lg p-2 transition-all ${btnMap[color]}`}
        >
          <Minus size={18} />
        </button>
        <button
          onClick={() => onChange(value + 1)}
          className={`rounded-lg p-2 transition-all ${btnMap[color]}`}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};

export default Counter;
