import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Activity, TrendingUp } from "lucide-react";

export const DoctorDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctor Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, Dr. Smith. Here's your practice overview.
          </p>
        </div>
        <Badge variant="secondary" className="h-fit">
          Doctor Portal
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">
              +8 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3 pending confirmations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              Currently under care
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Alerts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Patient Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Patient Activity</CardTitle>
            <CardDescription>
              Latest glucose readings and medication adherence from your patients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">JS</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">John Smith</p>
                <p className="text-xs text-muted-foreground">Glucose: 145 mg/dL (30 min ago)</p>
              </div>
              <Badge variant="outline">Normal</Badge>
            </div>
            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">MD</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Mary Davis</p>
                <p className="text-xs text-muted-foreground">Missed medication reminder (2 hours ago)</p>
              </div>
              <Badge variant="destructive">Alert</Badge>
            </div>
            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">RJ</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Robert Johnson</p>
                <p className="text-xs text-muted-foreground">Exercise completed (4 hours ago)</p>
              </div>
              <Badge variant="default">Good</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>
              Your appointments for today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Sarah Wilson</p>
                  <p className="text-xs text-muted-foreground">Routine checkup</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">9:00 AM</p>
                  <Badge variant="default">Confirmed</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Mike Brown</p>
                  <p className="text-xs text-muted-foreground">Follow-up</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">10:30 AM</p>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Lisa Garcia</p>
                  <p className="text-xs text-muted-foreground">Consultation</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">2:00 PM</p>
                  <Badge variant="default">Confirmed</Badge>
                </div>
              </div>
            </div>
            <Button className="w-full" variant="outline">
              View Full Schedule
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and tools for managing your practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-20 flex flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>View All Patients</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Calendar className="h-6 w-6" />
              <span>Manage Schedule</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Activity className="h-6 w-6" />
              <span>Health Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};