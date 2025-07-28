import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Heart, 
  Activity,
  Settings,
  Edit,
  Save,
  Shield,
  Bell
} from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";

const ProfileScene = () => (
  <Canvas camera={{ position: [0, 0, 5] }}>
    <ambientLight intensity={0.5} />
    <pointLight position={[10, 10, 10]} />
    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    <Sphere args={[1.5, 32, 32]}>
      <meshStandardMaterial color="#3b82f6" wireframe />
    </Sphere>
  </Canvas>
);

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  diabetesType: '1' | '2' | 'gestational';
  diagnosisDate: string;
  targetGlucose: string;
  medications: string;
  allergies: string;
  dietaryRestrictions: string;
}

export const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+254 700 123 456",
    dateOfBirth: "1990-05-15",
    address: "JKUAT, Juja, Kiambu County",
    emergencyContact: "Jane Doe",
    emergencyPhone: "+254 700 654 321",
    diabetesType: "2",
    diagnosisDate: "2020-03-10",
    targetGlucose: "80-130",
    medications: "Metformin 500mg twice daily",
    allergies: "None",
    dietaryRestrictions: "Low carb diet"
  });

  const [notifications, setNotifications] = useState({
    medicationReminders: true,
    appointmentAlerts: true,
    glucoseTracking: true,
    exerciseGoals: false,
    weeklyReports: true
  });

  const handleSave = () => {
    setIsEditing(false);
    // Here you would save to backend
    console.log("Profile saved:", profile);
  };

  const updateProfile = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getInitials = () => {
    return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* 3D Profile Visualization */}
      <Card className="h-64">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Visualization
          </CardTitle>
        </CardHeader>
        <CardContent className="h-32">
          <ProfileScene />
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="medical">Medical Info</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </p>
                  <Badge variant="outline">Patient</Badge>
                </div>
                <div className="ml-auto">
                  <Button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    variant={isEditing ? "default" : "outline"}
                  >
                    {isEditing ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => updateProfile("firstName", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => updateProfile("lastName", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateProfile("email", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => updateProfile("phone", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(e) => updateProfile("dateOfBirth", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => updateProfile("address", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    value={profile.emergencyContact}
                    onChange={(e) => updateProfile("emergencyContact", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={profile.emergencyPhone}
                    onChange={(e) => updateProfile("emergencyPhone", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Diabetes Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="diabetesType">Diabetes Type</Label>
                  <select
                    id="diabetesType"
                    value={profile.diabetesType}
                    onChange={(e) => updateProfile("diabetesType", e.target.value)}
                    disabled={!isEditing}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background disabled:opacity-50"
                  >
                    <option value="1">Type 1</option>
                    <option value="2">Type 2</option>
                    <option value="gestational">Gestational</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="diagnosisDate">Diagnosis Date</Label>
                  <Input
                    id="diagnosisDate"
                    type="date"
                    value={profile.diagnosisDate}
                    onChange={(e) => updateProfile("diagnosisDate", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="targetGlucose">Target Glucose Range (mg/dL)</Label>
                  <Input
                    id="targetGlucose"
                    value={profile.targetGlucose}
                    onChange={(e) => updateProfile("targetGlucose", e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., 80-130"
                  />
                </div>
                <div>
                  <Label htmlFor="medications">Current Medications</Label>
                  <Input
                    id="medications"
                    value={profile.medications}
                    onChange={(e) => updateProfile("medications", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="allergies">Known Allergies</Label>
                  <Input
                    id="allergies"
                    value={profile.allergies}
                    onChange={(e) => updateProfile("allergies", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
                  <Input
                    id="dietaryRestrictions"
                    value={profile.dietaryRestrictions}
                    onChange={(e) => updateProfile("dietaryRestrictions", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-sm text-muted-foreground">
                      {key === 'medicationReminders' && 'Receive reminders for medication schedules'}
                      {key === 'appointmentAlerts' && 'Get notified about upcoming appointments'}
                      {key === 'glucoseTracking' && 'Reminders to log glucose readings'}
                      {key === 'exerciseGoals' && 'Notifications about exercise goals'}
                      {key === 'weeklyReports' && 'Weekly health summary reports'}
                    </p>
                  </div>
                  <Button
                    variant={value ? "default" : "outline"}
                    onClick={() => toggleNotification(key as keyof typeof notifications)}
                    size="sm"
                  >
                    {value ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                App Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                </div>
                <Button variant="outline" size="sm">Auto</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Language</p>
                  <p className="text-sm text-muted-foreground">Choose your preferred language</p>
                </div>
                <Button variant="outline" size="sm">English</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Units</p>
                  <p className="text-sm text-muted-foreground">Glucose measurement units</p>
                </div>
                <Button variant="outline" size="sm">mg/dL</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" placeholder="Enter current password" />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" placeholder="Enter new password" />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" placeholder="Confirm new password" />
                </div>
                <Button>Update Password</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export your health data for personal records or to share with healthcare providers.
              </p>
              <div className="flex gap-2">
                <Button variant="outline">Export Glucose Data</Button>
                <Button variant="outline">Export Medication Log</Button>
                <Button variant="outline">Export All Data</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};