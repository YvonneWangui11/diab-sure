import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingDown, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock 
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface RetentionStats {
  totalFlagged: number;
  totalDeleted: number;
  totalRetained: number;
  totalPending: number;
  estimatedStorageSaved: number;
  byDataType: Record<string, { flagged: number; deleted: number; retained: number }>;
  timeline: Array<{ date: string; flagged: number; deleted: number; retained: number }>;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const STORAGE_ESTIMATES_KB = {
  glucose_readings: 1,
  meal_logs: 5,
  exercise_logs: 2,
  medication_logs: 1,
  appointments: 2,
  prescriptions: 3,
  audit_logs: 1,
};

export const DataRetentionDashboard = () => {
  const [stats, setStats] = useState<RetentionStats>({
    totalFlagged: 0,
    totalDeleted: 0,
    totalRetained: 0,
    totalPending: 0,
    estimatedStorageSaved: 0,
    byDataType: {},
    timeline: [],
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: flags, error } = await supabase
        .from('data_retention_flags')
        .select('*')
        .order('flagged_at', { ascending: false });

      if (error) throw error;

      if (!flags) {
        setLoading(false);
        return;
      }

      // Calculate statistics
      const totalFlagged = flags.length;
      const totalDeleted = flags.filter(f => f.action_taken === 'deleted').length;
      const totalRetained = flags.filter(f => f.action_taken === 'retained').length;
      const totalPending = flags.filter(f => f.action_taken === 'pending').length;

      // Calculate storage savings (estimated)
      let estimatedStorageSaved = 0;
      flags.forEach(flag => {
        if (flag.action_taken === 'deleted') {
          const sizeKb = STORAGE_ESTIMATES_KB[flag.data_type as keyof typeof STORAGE_ESTIMATES_KB] || 1;
          estimatedStorageSaved += sizeKb;
        }
      });

      // Group by data type
      const byDataType: Record<string, { flagged: number; deleted: number; retained: number }> = {};
      flags.forEach(flag => {
        if (!byDataType[flag.data_type]) {
          byDataType[flag.data_type] = { flagged: 0, deleted: 0, retained: 0 };
        }
        byDataType[flag.data_type].flagged++;
        if (flag.action_taken === 'deleted') byDataType[flag.data_type].deleted++;
        if (flag.action_taken === 'retained') byDataType[flag.data_type].retained++;
      });

      // Create timeline (last 30 days)
      const timeline: Array<{ date: string; flagged: number; deleted: number; retained: number }> = [];
      const days = 30;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayFlags = flags.filter(f => f.flagged_at.startsWith(dateStr));
        const dayDeleted = flags.filter(f => f.reviewed_at?.startsWith(dateStr) && f.action_taken === 'deleted');
        const dayRetained = flags.filter(f => f.reviewed_at?.startsWith(dateStr) && f.action_taken === 'retained');
        
        timeline.push({
          date: dateStr,
          flagged: dayFlags.length,
          deleted: dayDeleted.length,
          retained: dayRetained.length,
        });
      }

      setStats({
        totalFlagged,
        totalDeleted,
        totalRetained,
        totalPending,
        estimatedStorageSaved,
        byDataType,
        timeline,
      });
    } catch (error: any) {
      toast({
        title: "Error loading statistics",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pieData = Object.entries(stats.byDataType).map(([type, data]) => ({
    name: type.replace(/_/g, ' '),
    value: data.deleted,
  }));

  const barData = Object.entries(stats.byDataType).map(([type, data]) => ({
    type: type.replace(/_/g, ' '),
    flagged: data.flagged,
    deleted: data.deleted,
    retained: data.retained,
  }));

  if (loading) {
    return <div className="text-center p-8">Loading statistics...</div>;
  }

  const chartConfig = {
    flagged: {
      label: "Flagged",
      color: "hsl(var(--chart-1))",
    },
    deleted: {
      label: "Deleted",
      color: "hsl(var(--chart-2))",
    },
    retained: {
      label: "Retained",
      color: "hsl(var(--chart-3))",
    },
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flagged</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFlagged}</div>
            <p className="text-xs text-muted-foreground">
              All records flagged for review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deleted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalDeleted}</div>
            <p className="text-xs text-muted-foreground">
              Records successfully removed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retained</CardTitle>
            <XCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalRetained}</div>
            <p className="text-xs text-muted-foreground">
              Records kept after review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Saved</CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.estimatedStorageSaved < 1024 
                ? `${stats.estimatedStorageSaved.toFixed(0)} KB`
                : `${(stats.estimatedStorageSaved / 1024).toFixed(2)} MB`}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated space freed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Actions Alert */}
      {stats.totalPending > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Clock className="w-5 h-5" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              There are <span className="font-bold">{stats.totalPending}</span> records waiting for review. 
              Please review and approve or reject these flagged records.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Retention Activity Timeline (Last 30 Days)
          </CardTitle>
          <CardDescription>
            Daily trends of flagged, deleted, and retained records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="flagged" 
                  stroke="var(--color-flagged)" 
                  strokeWidth={2}
                  name="Flagged"
                />
                <Line 
                  type="monotone" 
                  dataKey="deleted" 
                  stroke="var(--color-deleted)" 
                  strokeWidth={2}
                  name="Deleted"
                />
                <Line 
                  type="monotone" 
                  dataKey="retained" 
                  stroke="var(--color-retained)" 
                  strokeWidth={2}
                  name="Retained"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Breakdown by Data Type */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Records by Data Type</CardTitle>
            <CardDescription>Comparison of flagged, deleted, and retained records</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="type" 
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="flagged" fill="var(--color-flagged)" name="Flagged" />
                  <Bar dataKey="deleted" fill="var(--color-deleted)" name="Deleted" />
                  <Bar dataKey="retained" fill="var(--color-retained)" name="Retained" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deleted Records Distribution</CardTitle>
            <CardDescription>Breakdown of deleted records by type</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No deleted records yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Type Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Summary by Data Type</CardTitle>
          <CardDescription>Detailed breakdown of retention actions per data type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.byDataType).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium capitalize">{type.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-muted-foreground">
                    Total: {data.flagged} flagged
                  </p>
                </div>
                <div className="flex gap-4">
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    {data.deleted} deleted
                  </Badge>
                  <Badge variant="outline" className="border-blue-500 text-blue-700">
                    {data.retained} retained
                  </Badge>
                  <Badge variant="outline">
                    {data.flagged - data.deleted - data.retained} pending
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
