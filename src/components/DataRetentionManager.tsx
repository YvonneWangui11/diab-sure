import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Clock, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";

interface RetentionPolicy {
  id: string;
  data_type: string;
  retention_days: number;
  is_active: boolean;
}

interface RetentionFlag {
  id: string;
  data_type: string;
  record_id: string;
  user_id: string;
  flagged_at: string;
  action_taken: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
}

export const DataRetentionManager = () => {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [flags, setFlags] = useState<RetentionFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [policiesRes, flagsRes] = await Promise.all([
        supabase.from('data_retention_policies').select('*').order('data_type'),
        supabase.from('data_retention_flags').select('*').eq('action_taken', 'pending').order('flagged_at', { ascending: false })
      ]);

      if (policiesRes.error) throw policiesRes.error;
      if (flagsRes.error) throw flagsRes.error;

      setPolicies(policiesRes.data || []);
      setFlags(flagsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePolicy = async (id: string, field: keyof RetentionPolicy, value: any) => {
    try {
      const { error } = await supabase
        .from('data_retention_policies')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      await logAction('UPDATE_RETENTION_POLICY', 'data_retention_policy', id, { field, value });

      toast({
        title: "Policy updated",
        description: "Retention policy has been updated successfully"
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error updating policy",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const runRetentionCheck = async () => {
    setRunningCheck(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-data-retention');

      if (error) throw error;

      await logAction('RUN_RETENTION_CHECK', 'system', undefined, data);

      toast({
        title: "Retention check complete",
        description: `${data.totalFlagged} records flagged for review`
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error running retention check",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRunningCheck(false);
    }
  };

  const reviewFlag = async (flagId: string, action: 'deleted' | 'retained', notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('data_retention_flags')
        .update({
          action_taken: action,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          notes
        })
        .eq('id', flagId);

      if (error) throw error;

      await logAction('REVIEW_RETENTION_FLAG', 'data_retention_flag', flagId, { action, notes });

      toast({
        title: "Flag reviewed",
        description: `Record marked as ${action}`
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error reviewing flag",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Data Retention Policies
          </CardTitle>
          <CardDescription>
            Configure automatic data retention periods and flag old data for deletion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Data older than the specified retention period will be automatically flagged for review
            </p>
            <Button onClick={runRetentionCheck} disabled={runningCheck}>
              {runningCheck ? "Running..." : "Run Retention Check"}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data Type</TableHead>
                <TableHead>Retention Period (Days)</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium capitalize">
                    {policy.data_type.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={policy.retention_days}
                      onChange={(e) => updatePolicy(policy.id, 'retention_days', parseInt(e.target.value))}
                      className="w-24"
                      min="1"
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={policy.is_active}
                      onCheckedChange={(checked) => updatePolicy(policy.id, 'is_active', checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={policy.is_active ? "default" : "secondary"}>
                      {policy.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Flagged Records ({flags.length})
          </CardTitle>
          <CardDescription>
            Review and approve data flagged for deletion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {flags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No records flagged for deletion</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Flagged Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell className="capitalize">
                      {flag.data_type.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell>
                      {new Date(flag.flagged_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => reviewFlag(flag.id, 'deleted', 'Approved for deletion')}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reviewFlag(flag.id, 'retained', 'Retained by admin')}
                      >
                        Keep
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
