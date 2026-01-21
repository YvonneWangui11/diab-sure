import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Bell, CheckCircle, Clock, Plus, Filter, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { PatientSelector } from "./PatientSelector";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

interface HealthAlert {
  id: string;
  patient_id: string;
  doctor_id: string;
  alert_type: string;
  message: string;
  severity: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  patient_name?: string;
}

interface HealthAlertsManagerProps {
  doctorId: string;
}

export const HealthAlertsManager = ({ doctorId }: HealthAlertsManagerProps) => {
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const [newAlert, setNewAlert] = useState({
    patient_id: "",
    alert_type: "",
    message: "",
    severity: "info",
  });

  useEffect(() => {
    loadAlerts();

    const channel = supabase
      .channel('health-alerts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'health_alerts' },
        () => loadAlerts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorId]);

  const loadAlerts = async () => {
    try {
      const { data: alertsData, error } = await supabase
        .from('health_alerts')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch patient names
      if (alertsData && alertsData.length > 0) {
        const patientIds = [...new Set(alertsData.map(a => a.patient_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', patientIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        
        const alertsWithNames = alertsData.map(alert => ({
          ...alert,
          patient_name: profileMap.get(alert.patient_id) || 'Unknown Patient'
        }));

        setAlerts(alertsWithNames);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load health alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async () => {
    if (!newAlert.patient_id || !newAlert.alert_type || !newAlert.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('health_alerts')
        .insert({
          doctor_id: doctorId,
          patient_id: newAlert.patient_id,
          alert_type: newAlert.alert_type,
          message: newAlert.message,
          severity: newAlert.severity,
        });

      if (error) throw error;

      toast({
        title: "Alert Created",
        description: "Health alert has been created successfully",
      });

      setNewAlert({ patient_id: "", alert_type: "", message: "", severity: "info" });
      setIsAddingAlert(false);
    } catch (error: any) {
      console.error('Error creating alert:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create alert",
        variant: "destructive",
      });
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('health_alerts')
        .update({ resolved: true, updated_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert Resolved",
        description: "Health alert has been marked as resolved",
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('health_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert Deleted",
        description: "Health alert has been deleted",
      });
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { color: 'bg-red-500 text-white', icon: AlertTriangle, label: 'Critical' };
      case 'warning':
        return { color: 'bg-orange-500 text-white', icon: Bell, label: 'Warning' };
      case 'info':
      default:
        return { color: 'bg-blue-500 text-white', icon: Bell, label: 'Info' };
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'resolved' && alert.resolved) || 
      (filterStatus === 'active' && !alert.resolved);
    const matchesSearch = !searchQuery || 
      alert.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.alert_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const activeAlerts = alerts.filter(a => !a.resolved);
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading health alerts..." />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Active</p>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{criticalCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Warnings</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{warningCount}</p>
              </div>
              <Bell className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold">
                  {alerts.filter(a => 
                    a.resolved && 
                    new Date(a.updated_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Health Alerts</h2>
          <p className="text-muted-foreground">Monitor and manage patient health alerts</p>
        </div>
        <Dialog open={isAddingAlert} onOpenChange={setIsAddingAlert}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Health Alert</DialogTitle>
              <DialogDescription>
                Create a new health alert for a patient
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Patient *</Label>
                <PatientSelector
                  doctorId={doctorId}
                  value={newAlert.patient_id}
                  onValueChange={(value) => setNewAlert(prev => ({ ...prev, patient_id: value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Alert Type *</Label>
                <Select
                  value={newAlert.alert_type}
                  onValueChange={(value) => setNewAlert(prev => ({ ...prev, alert_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select alert type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_glucose">High Glucose</SelectItem>
                    <SelectItem value="low_glucose">Low Glucose</SelectItem>
                    <SelectItem value="missed_medication">Missed Medication</SelectItem>
                    <SelectItem value="missed_appointment">Missed Appointment</SelectItem>
                    <SelectItem value="abnormal_readings">Abnormal Readings</SelectItem>
                    <SelectItem value="follow_up_required">Follow-up Required</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity *</Label>
                <Select
                  value={newAlert.severity}
                  onValueChange={(value) => setNewAlert(prev => ({ ...prev, severity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea
                  placeholder="Describe the alert..."
                  value={newAlert.message}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingAlert(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAlert}>Create Alert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No alerts found"
          description={alerts.length === 0 
            ? "No health alerts have been created yet" 
            : "No alerts match your current filters"
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const severityConfig = getSeverityConfig(alert.severity);
            const SeverityIcon = severityConfig.icon;
            
            return (
              <Card 
                key={alert.id} 
                className={`transition-all ${alert.resolved ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-full ${severityConfig.color}`}>
                        <SeverityIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{alert.patient_name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {alert.alert_type.replace(/_/g, ' ')}
                          </Badge>
                          <Badge className={severityConfig.color}>
                            {severityConfig.label}
                          </Badge>
                          {alert.resolved && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!alert.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteAlert(alert.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
