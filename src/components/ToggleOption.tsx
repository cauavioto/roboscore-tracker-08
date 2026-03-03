interface ToggleOptionProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleOption = ({ label, description, checked, onChange }: ToggleOptionProps) => {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 rounded-xl border p-4 transition-all w-full text-left ${
        checked
          ? "border-primary/50 bg-primary/10 glow-primary"
          : "border-border bg-card hover:border-muted-foreground/30"
      }`}
    >
      <div
        className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
          checked ? "border-primary bg-primary" : "border-muted-foreground/40"
        }`}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div>
        <span className="font-display text-sm text-foreground">{label}</span>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </button>
  );
};

export default ToggleOption;
