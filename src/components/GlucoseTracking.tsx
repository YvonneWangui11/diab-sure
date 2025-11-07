import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, Plus, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GlucoseReading {
  id: string;
  glucose_value: number;
  test_time: string;
  notes?: string;
  created_at: string;
}

interface GlucoseTrackingProps {
  userId: string;
}

export const GlucoseTracking = ({ userId }: GlucoseTrackingProps) => {
  const [glucoseValue, setGlucoseValue] = useState("");
  const [testTime, setTestTime] = useState("fasting");
  const [notes, setNotes] = useState("");
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadReadings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('glucose_readings')
        .select('*')
        .eq('patient_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReadings(data || []);
    } catch (error) {
      console.error('Error loading glucose readings:', error);
      toast({
        title: "Error",
        description: "Failed to load glucose readings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveReading = async () => {
    if (!glucoseValue) {
      toast({
        title: "Error",
        description: "Please enter a glucose value",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('glucose_readings')
        .insert({
          patient_id: userId,
          glucose_value: Number(glucoseValue),
          test_time: testTime,
          notes: notes || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Glucose reading saved successfully",
      });

      setGlucoseValue("");
      setNotes("");
      setTestTime("fasting");
      loadReadings();
    } catch (error) {
      console.error('Error saving glucose reading:', error);
      toast({
        title: "Error",
        description: "Failed to save glucose reading",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadReadings();

    const subscription = supabase
      .channel('glucose-readings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'glucose_readings',
        filter: `patient_id=eq.${userId}`
      }, () => {
        loadReadings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  const getStatus = (value: number, testTime: string) => {
    if (testTime === "fasting") {
      if (value < 70) return { text: "Low", color: "bg-warning text-warning-foreground" };
      if (value <= 100) return { text: "Normal", color: "bg-success text-success-foreground" };
      if (value <= 125) return { text: "Pre-diabetes", color: "bg-orange-100 text-orange-800" };
      return { text: "High", color: "bg-destructive text-destructive-foreground" };
    } else {
      if (value < 70) return { text: "Low", color: "bg-warning text-warning-foreground" };
      if (value <= 140) return { text: "Normal", color: "bg-success text-success-foreground" };
      if (value <= 199) return { text: "Pre-diabetes", color: "bg-orange-100 text-orange-800" };
      return { text: "High", color: "bg-destructive text-destructive-foreground" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Glucose Tracking</h1>
          <p className="text-muted-foreground">Monitor and log your blood glucose levels</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add New Reading */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Log New Reading
            </CardTitle>
            <CardDescription>Record your current blood glucose level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="glucose">Glucose Level (mg/dL)</Label>
              <Input
                id="glucose"
                type="number"
                placeholder="Enter reading..."
                value={glucoseValue}
                onChange={(e) => setGlucoseValue(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="testTime">Test Time</Label>
              <Select value={testTime} onValueChange={setTestTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fasting">Fasting (before breakfast)</SelectItem>
                  <SelectItem value="pre-lunch">Before lunch</SelectItem>
                  <SelectItem value="post-lunch">After lunch (2 hours)</SelectItem>
                  <SelectItem value="pre-dinner">Before dinner</SelectItem>
                  <SelectItem value="post-dinner">After dinner (2 hours)</SelectItem>
                  <SelectItem value="bedtime">Bedtime</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button className="w-full" onClick={saveReading}>
              <Heart className="h-4 w-4 mr-2" />
              Save Reading
            </Button>
          </CardContent>
        </Card>

        {/* Recent Readings */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Readings
            </CardTitle>
            <CardDescription>Your glucose readings history</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : readings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No glucose readings yet</p>
                <p className="text-sm mt-2">Start tracking by adding your first reading above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {readings.map((reading) => {
                  const status = getStatus(reading.glucose_value, reading.test_time);
                  return (
                    <div key={reading.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">{reading.glucose_value}</p>
                          <p className="text-xs text-muted-foreground">mg/dL</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground capitalize">{reading.test_time.replace('-', ' ')}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(reading.created_at).toLocaleDateString()} at {new Date(reading.created_at).toLocaleTimeString()}
                          </p>
                          {reading.notes && (
                            <p className="text-xs text-muted-foreground italic mt-1">{reading.notes}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={status.color}>
                        {status.text}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Glucose Ranges Reference */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Target Glucose Ranges</CardTitle>
          <CardDescription>Reference ranges for blood glucose levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-success/10 rounded-lg border border-success/20">
              <h3 className="font-semibold text-success mb-2">Normal Range</h3>
              <p className="text-sm text-muted-foreground mb-2">Fasting: 70-100 mg/dL</p>
              <p className="text-sm text-muted-foreground">Post-meal: &lt;140 mg/dL</p>
            </div>
            <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
              <h3 className="font-semibold text-warning mb-2">Pre-diabetes</h3>
              <p className="text-sm text-muted-foreground mb-2">Fasting: 100-125 mg/dL</p>
              <p className="text-sm text-muted-foreground">Post-meal: 140-199 mg/dL</p>
            </div>
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <h3 className="font-semibold text-destructive mb-2">Diabetes Range</h3>
              <p className="text-sm text-muted-foreground mb-2">Fasting: ≥126 mg/dL</p>
              <p className="text-sm text-muted-foreground">Post-meal: ≥200 mg/dL</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};