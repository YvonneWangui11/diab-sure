import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Database, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";

export const DataDeletionRequest = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading deletion requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletionRequest = async (requestType: 'account' | 'data') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('deletion_requests')
        .insert({
          user_id: user.id,
          request_type: requestType,
          reason: reason || null
        });

      if (error) throw error;

      await logAction(
        `REQUEST_${requestType.toUpperCase()}_DELETION`,
        'deletion_request',
        user.id,
        { reason }
      );

      toast({
        title: "Request submitted",
        description: `Your ${requestType} deletion request has been submitted. An administrator will review it shortly.`
      });

      setReason("");
      loadRequests();
    } catch (error: any) {
      toast({
        title: "Error submitting request",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      completed: "outline"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const hasPendingRequest = requests.some(r => r.status === 'pending');

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Data Retention & Deletion
          </CardTitle>
          <CardDescription>
            Request deletion of your data or entire account in compliance with GDPR regulations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for deletion (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Please let us know why you'd like to delete your data..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={hasPendingRequest}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={hasPendingRequest}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Request Data Deletion
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Request Data Deletion?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will request deletion of all your health records, including glucose readings, 
                    meal logs, exercise logs, and medical information. Your account will remain active.
                    An administrator will review your request.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeletionRequest('data')}>
                    Submit Request
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={hasPendingRequest}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Request Account Deletion
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Request Account Deletion?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will request permanent deletion of your account and all associated data. 
                    This action cannot be undone once approved. An administrator will review your request.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleDeletionRequest('account')}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Submit Request
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {hasPendingRequest && (
            <p className="text-sm text-muted-foreground">
              You have a pending deletion request. You cannot submit another request until it's been processed.
            </p>
          )}
        </CardContent>
      </Card>

      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deletion Requests History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.map((request) => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium capitalize">{request.request_type} Deletion</p>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Requested: {new Date(request.requested_at).toLocaleDateString()}
                    </p>
                    {request.reason && (
                      <p className="text-sm text-muted-foreground">
                        Reason: {request.reason}
                      </p>
                    )}
                    {request.admin_notes && (
                      <p className="text-sm text-muted-foreground">
                        Admin notes: {request.admin_notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
