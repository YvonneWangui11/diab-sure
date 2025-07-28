import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Plus, TrendingUp, Calendar, Clock } from "lucide-react";

export const GlucoseTracking = () => {
  const [glucoseValue, setGlucoseValue] = useState("");
  const [testTime, setTestTime] = useState("");
  const [notes, setNotes] = useState("");

  const glucoseReadings = [
    { id: 1, value: 126, time: "8:00 AM", date: "Today", type: "Fasting", status: "normal" },
    { id: 2, value: 142, time: "2:00 PM", date: "Today", type: "Post-meal", status: "high" },
    { id: 3, value: 118, time: "8:00 AM", date: "Yesterday", type: "Fasting", status: "normal" },
    { id: 4, value: 134, time: "7:30 PM", date: "Yesterday", type: "Post-meal", status: "normal" },
    { id: 5, value: 115, time: "8:00 AM", date: "2 days ago", type: "Fasting", status: "normal" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "bg-success text-success-foreground";
      case "high": return "bg-destructive text-destructive-foreground";
      case "low": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "normal": return "Normal";
      case "high": return "High";
      case "low": return "Low";
      default: return "Unknown";
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

            <Button className="w-full">
              <Heart className="h-4 w-4 mr-2" />
              Save Reading
            </Button>
          </CardContent>
        </Card>

        {/* Recent Readings */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Readings
            </CardTitle>
            <CardDescription>Your glucose readings history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {glucoseReadings.map((reading) => (
                <div key={reading.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{reading.value}</p>
                      <p className="text-xs text-muted-foreground">mg/dL</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{reading.type}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{reading.date}</span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>{reading.time}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(reading.status)}>
                    {getStatusText(reading.status)}
                  </Badge>
                </div>
              ))}
            </div>
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