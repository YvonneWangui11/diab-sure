import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
        )}
        {action && (
          <Button onClick={action.onClick} variant="default">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};