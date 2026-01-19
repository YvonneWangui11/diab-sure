import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, X, Info, AlertTriangle, AlertCircle } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  published_at: string;
}

interface AnnouncementBannerProps {
  userRole?: string;
}

export const AnnouncementBanner = ({ userRole }: AnnouncementBannerProps) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_published", true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("priority", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error loading announcements:", error);
    }
  };

  const dismissAnnouncement = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-destructive bg-destructive/10";
      case "medium":
        return "border-warning bg-warning/10";
      default:
        return "border-primary bg-primary/5";
    }
  };

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.id)
  );

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-2 mb-4" role="region" aria-label="Announcements">
      {visibleAnnouncements.map((announcement) => (
        <Alert
          key={announcement.id}
          className={`relative ${getPriorityStyles(announcement.priority)}`}
        >
          <div className="flex items-start gap-3">
            {getPriorityIcon(announcement.priority)}
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2">
                {announcement.title}
                {announcement.priority === "high" && (
                  <Badge variant="destructive" className="text-xs">
                    Important
                  </Badge>
                )}
              </AlertTitle>
              <AlertDescription className="mt-1">
                {announcement.content}
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => dismissAnnouncement(announcement.id)}
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};