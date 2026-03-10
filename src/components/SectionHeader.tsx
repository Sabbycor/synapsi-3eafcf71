import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ title, subtitle, action, className }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center justify-between", className)}>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
    );
  }
);
SectionHeader.displayName = "SectionHeader";
