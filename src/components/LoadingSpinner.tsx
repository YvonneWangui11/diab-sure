import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const LoadingSpinner = ({
  size = "md",
  text,
  fullScreen = false,
  className,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

export const PageLoader = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

export const InlineLoader = () => (
  <LoadingSpinner size="sm" className="inline-flex ml-2" />
);