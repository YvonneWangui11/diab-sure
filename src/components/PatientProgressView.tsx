import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Utensils, Pill, TrendingUp } from "lucide-react";

interface PatientProgressViewProps {
  patientId: string;
  patientName: string;
}

export const PatientProgressView = ({ patientId, patientName }: PatientProgressViewProps) => {
  const [medicationLogs, setMedicationLogs] = useState<any[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<any[]>([]);
  const [mealLogs, setMealLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPatientData = async () => {
    try {
      setLoading(true);

      // Load medication logs
      const { data: medLogs, error: medError } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('patient_id', patientId)
        .gte('taken_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('taken_at', { ascending: true });

      if (medError) throw medError;
      setMedicationLogs(medLogs || []);

      // Load exercise logs
      const { data: exLogs, error: exError } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('patient_id', patientId)
        .gte('date_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('date_time', { ascending: true });

      if (exError) throw exError;
      setExerciseLogs(exLogs || []);

      // Load meal logs
      const { data: mlLogs, error: mlError } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('patient_id', patientId)
        .gte('date_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('date_time', { ascending: true });

      if (mlError) throw mlError;
      setMealLogs(mlLogs || []);

    } catch (error) {
      console.error('Error loading patient progress:', error);
      toast({
        title: "Error",
        description: "Failed to load patient progress data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();

    const medSubscription = supabase
      .channel('patient-med-logs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'medication_logs',
        filter: `patient_id=eq.${patientId}`
      }, loadPatientData)
      .subscribe();

    const exSubscription = supabase
      .channel('patient-ex-logs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'exercise_logs',
        filter: `patient_id=eq.${patientId}`
      }, loadPatientData)
      .subscribe();

    return () => {
      supabase.removeChannel(medSubscription);
      supabase.removeChannel(exSubscription);
    };
  }, [patientId]);

  // Prepare chart data
  const medicationAdherence = medicationLogs.reduce((acc, log) => {
    const date = new Date(log.taken_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const adherenceChartData = Object.entries(medicationAdherence).map(([date, count]) => ({
    date,
    count
  }));

  const exerciseChartData = exerciseLogs.map(log => ({
    date: new Date(log.date_time).toLocaleDateString(),
    duration: log.duration_minutes
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Patient Progress: {patientName}</h2>
        <p className="text-muted-foreground">Monitor patient health metrics and adherence</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medication Logs</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicationLogs.length}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercise Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exerciseLogs.length}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meal Logs</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mealLogs.length}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="medication" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="medication">Medication Adherence</TabsTrigger>
          <TabsTrigger value="exercise">Exercise Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="medication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medication Adherence Trend</CardTitle>
              <CardDescription>Daily medication intake over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {adherenceChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={adherenceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No medication data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Medication Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {medicationLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <Badge>{log.status}</Badge>
                      {log.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.taken_at).toLocaleString()}
                    </span>
                  </div>
                ))}
                {medicationLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No medication logs yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exercise Duration Trend</CardTitle>
              <CardDescription>Daily exercise duration over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {exerciseChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exerciseChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="duration" stroke="hsl(var(--secondary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No exercise data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Exercise Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {exerciseLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{log.exercise_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.duration_minutes} min • {log.intensity}
                      </p>
                      {log.note && (
                        <p className="text-xs text-muted-foreground mt-1">{log.note}</p>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.date_time).toLocaleString()}
                    </span>
                  </div>
                ))}
                {exerciseLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No exercise logs yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
