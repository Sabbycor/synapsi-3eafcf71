import * as React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer = React.forwardRef<HTMLElement, PageContainerProps>(
  ({ children, className }, ref) => {
    return (
      <main ref={ref} className={cn("min-h-screen pb-24 md:pb-8", className)}>
        <div className="w-full max-w-xl mx-auto px-4 py-5 md:max-w-4xl lg:max-w-5xl md:px-6 md:py-6">
          {children}
        </div>
      </main>
    );
  }
);
PageContainer.displayName = "PageContainer";
