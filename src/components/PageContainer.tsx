import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn("min-h-screen pb-20 md:pb-6", className)}>
      <div className="container max-w-xl mx-auto px-4 py-6 md:max-w-4xl">
        {children}
      </div>
    </main>
  );
}
