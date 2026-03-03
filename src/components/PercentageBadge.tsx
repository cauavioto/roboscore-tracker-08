interface PercentageBadgeProps {
  hits: number;
  total: number;
  label: string;
}

const PercentageBadge = ({ hits, total, label }: PercentageBadgeProps) => {
  const pct = total > 0 ? Math.round((hits / total) * 100) : 0;
  const color = pct >= 70 ? "text-accent" : pct >= 40 ? "text-warning" : "text-destructive";

  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3">
      <span className="text-xs font-display uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-2xl font-mono-tech font-bold ${color}`}>{pct}%</span>
      <span className="text-xs text-muted-foreground font-mono-tech">{hits}/{total}</span>
    </div>
  );
};

export default PercentageBadge;
