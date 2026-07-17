import { cn } from "@/lib/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = "md",
  className,
}: ProgressBarProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const isComplete = pct >= 100;

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs font-medium text-text-secondary">{label}</span>}
          {showPercentage && <span className="text-xs font-medium text-accent">{pct}%</span>}
        </div>
      )}
      <div className={cn("overflow-hidden rounded-full bg-surface-hover", size === "sm" ? "h-1.5" : "h-2.5")}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            isComplete ? "bg-success" : "bg-accent"
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
