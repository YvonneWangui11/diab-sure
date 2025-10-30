import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Minus, Activity, Apple, Pill } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

interface ProgressDashboardProps {
  userId: string;
}

export const ProgressDashboard = ({ userId }: ProgressDashboardProps) => {
  const [medicationData, setMedicationData] = useState<any[]>([]);
  const [exerciseData, setExerciseData] = useState<any[]>([]);
  const [mealData, setMealData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadProgressData = async () => {
    try {
      setLoading(true);

      // Get last 7 days of medication logs
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: medLogs } = await supabase
        .from('medication_logs')
        .select('taken_at, status')
        .eq('patient_id', userId)
        .gte('taken_at', sevenDaysAgo.toISOString())
        .eq('status', 'taken');

      const { data: exercises } = await supabase
        .from('exercise_logs')
        .select('date_time, duration_minutes, exercise_type')
        .eq('patient_id', userId)
        .gte('date_time', sevenDaysAgo.toISOString());

      const { data: meals } = await supabase
        .from('meal_logs')
        .select('date_time, meal_type')
        .eq('patient_id', userId)
        .gte('date_time', sevenDaysAgo.toISOString());

      // Process medication adherence by day
      const medByDay = processDataByDay(medLogs || [], 'taken_at');
      setMedicationData(medByDay);

      // Process exercise minutes by day
      const exerciseByDay = processExerciseByDay(exercises || []);
      setExerciseData(exerciseByDay);

      // Process meal logs by day
      const mealsByDay = processDataByDay(meals || [], 'date_time');
      setMealData(mealsByDay);

    } catch (error) {
      console.error('Error loading progress data:', error);
      toast({
        title: "Error",
        description: "Failed to load progress data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processDataByDay = (data: any[], dateField: string) => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = date.toISOString().split('T')[0];
      
      const count = data.filter(item => {
        const itemDate = new Date(item[dateField]).toISOString().split('T')[0];
        return itemDate === dateStr;
      }).length;
      
      last7Days.push({
        day: dayName,
        count,
        date: dateStr
      });
    }
    return last7Days;
  };

  const processExerciseByDay = (data: any[]) => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = date.toISOString().split('T')[0];
      
      const totalMinutes = data
        .filter(item => {
          const itemDate = new Date(item.date_time).toISOString().split('T')[0];
          return itemDate === dateStr;
        })
        .reduce((sum, item) => sum + (item.duration_minutes || 0), 0);
      
      last7Days.push({
        day: dayName,
        minutes: totalMinutes,
        date: dateStr
      });
    }
    return last7Days;
  };

  const calculateTrend = (data: any[], valueKey: string) => {
    if (data.length < 2) return { trend: 'neutral', percentage: 0 };
    
    const lastWeek = data.slice(0, 3).reduce((sum, d) => sum + (d[valueKey] || 0), 0);
    const thisWeek = data.slice(4, 7).reduce((sum, d) => sum + (d[valueKey] || 0), 0);
    
    if (lastWeek === 0) return { trend: 'neutral', percentage: 0 };
    
    const percentage = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    const trend = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'neutral';
    
    return { trend, percentage: Math.abs(percentage) };
  };

  useEffect(() => {
    loadProgressData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const medTrend = calculateTrend(medicationData, 'count');
  const exerciseTrend = calculateTrend(exerciseData, 'minutes');
  const mealTrend = calculateTrend(mealData, 'count');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Progress Dashboard</h2>
        <p className="text-muted-foreground">
          Visualize your health journey over the past week
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Medication Adherence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {medicationData.reduce((sum, d) => sum + d.count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">doses this week</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                medTrend.trend === 'up' ? 'text-green-600' : 
                medTrend.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {medTrend.trend === 'up' && <TrendingUp className="h-4 w-4" />}
                {medTrend.trend === 'down' && <TrendingDown className="h-4 w-4" />}
                {medTrend.trend === 'neutral' && <Minus className="h-4 w-4" />}
                <span>{medTrend.percentage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Exercise Minutes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {exerciseData.reduce((sum, d) => sum + d.minutes, 0)}
                </p>
                <p className="text-xs text-muted-foreground">minutes this week</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                exerciseTrend.trend === 'up' ? 'text-green-600' : 
                exerciseTrend.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {exerciseTrend.trend === 'up' && <TrendingUp className="h-4 w-4" />}
                {exerciseTrend.trend === 'down' && <TrendingDown className="h-4 w-4" />}
                {exerciseTrend.trend === 'neutral' && <Minus className="h-4 w-4" />}
                <span>{exerciseTrend.percentage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Apple className="h-4 w-4" />
              Meal Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {mealData.reduce((sum, d) => sum + d.count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">meals logged</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                mealTrend.trend === 'up' ? 'text-green-600' : 
                mealTrend.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {mealTrend.trend === 'up' && <TrendingUp className="h-4 w-4" />}
                {mealTrend.trend === 'down' && <TrendingDown className="h-4 w-4" />}
                {mealTrend.trend === 'neutral' && <Minus className="h-4 w-4" />}
                <span>{mealTrend.percentage}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="medication" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="medication">Medication</TabsTrigger>
          <TabsTrigger value="exercise">Exercise</TabsTrigger>
          <TabsTrigger value="meals">Meals</TabsTrigger>
        </TabsList>

        <TabsContent value="medication">
          <Card>
            <CardHeader>
              <CardTitle>Medication Adherence Trend</CardTitle>
              <CardDescription>Daily medication doses taken over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Doses Taken",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={medicationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercise">
          <Card>
            <CardHeader>
              <CardTitle>Exercise Activity Trend</CardTitle>
              <CardDescription>Daily exercise minutes over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  minutes: {
                    label: "Minutes",
                    color: "hsl(var(--secondary))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exerciseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="minutes" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meals">
          <Card>
            <CardHeader>
              <CardTitle>Meal Logging Consistency</CardTitle>
              <CardDescription>Daily meal logs over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Meals Logged",
                    color: "hsl(var(--accent))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mealData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};