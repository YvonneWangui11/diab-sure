import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Pill, 
  Apple, 
  Activity, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const Dashboard = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => loadUserData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_details'
        },
        () => loadUserData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);

        // Load patient details if user is a patient
        if (profile.role === 'patient') {
          const { data: patientData } = await supabase
            .from('patient_details')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          setPatientDetails(patientData);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getWelcomeMessage = () => {
    if (!userProfile) return "Welcome back!";
    return `Welcome back, ${userProfile.full_name}!`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">{getWelcomeMessage()} Here's your health overview.</p>
        </div>
        <Badge variant="outline" className="bg-success text-success-foreground">
          <CheckCircle className="h-4 w-4 mr-1" />
          All systems normal
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blood Glucose</p>
                <p className="text-2xl font-bold text-foreground">126 mg/dL</p>
                <p className="text-xs text-success">Within target range</p>
              </div>
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medication</p>
                <p className="text-2xl font-bold text-foreground">2/3</p>
                <p className="text-xs text-warning">1 dose remaining</p>
              </div>
              <Pill className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Exercise Today</p>
                <p className="text-2xl font-bold text-foreground">45 min</p>
                <p className="text-xs text-success">Goal achieved</p>
              </div>
              <Activity className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Next Appointment</p>
                <p className="text-2xl font-bold text-foreground">3 days</p>
                <p className="text-xs text-muted-foreground">Dr. Kamau</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Readings */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Glucose Readings
            </CardTitle>
            <CardDescription>Your glucose levels over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { date: "Today 8:00 AM", value: 126, status: "normal" },
                { date: "Yesterday 8:00 AM", value: 134, status: "normal" },
                { date: "2 days ago 8:00 AM", value: 118, status: "normal" },
                { date: "3 days ago 8:00 AM", value: 142, status: "high" },
              ].map((reading, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{reading.value} mg/dL</p>
                    <p className="text-sm text-muted-foreground">{reading.date}</p>
                  </div>
                  <Badge 
                    variant={reading.status === "normal" ? "secondary" : "destructive"}
                    className={reading.status === "normal" ? "bg-success text-success-foreground" : ""}
                  >
                    {reading.status === "normal" ? "Normal" : "High"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Alerts */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alerts & Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                <Clock className="h-4 w-4 text-warning mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Medication Reminder</p>
                  <p className="text-muted-foreground">Take Metformin in 2 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <Calendar className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Upcoming Appointment</p>
                  <p className="text-muted-foreground">Dr. Kamau - Friday 10:00 AM</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="default">
                <Heart className="h-4 w-4 mr-2" />
                Log Glucose Reading
              </Button>
              <Button className="w-full" variant="secondary">
                <Pill className="h-4 w-4 mr-2" />
                Mark Medication Taken
              </Button>
              <Button className="w-full" variant="outline">
                <Apple className="h-4 w-4 mr-2" />
                Log Meal
              </Button>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Medication Adherence</span>
                  <span className="text-sm text-muted-foreground">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Exercise Goals</span>
                  <span className="text-sm text-muted-foreground">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Glucose in Range</span>
                  <span className="text-sm text-muted-foreground">78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};