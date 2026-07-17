import { cn } from "@/lib/cn";

interface TabsProps {
  tabs: { key: string; label: string; icon?: React.ReactNode; count?: number }[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(isActive ? "" : tab.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              isActive
                ? "bg-accent border-accent text-accent-text"
                : "border-border text-text-secondary hover:text-text hover:border-border-strong"
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                isActive ? "bg-white/20" : "bg-surface-hover"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
