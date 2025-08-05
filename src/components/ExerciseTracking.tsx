import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Timer, 
  Flame, 
  Target, 
  Plus, 
  Play, 
  Pause, 
  Square,
  TrendingUp,
  Heart,
  Zap
} from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const ExerciseScene = () => (
  <Canvas camera={{ position: [0, 0, 8] }}>
    <ambientLight intensity={0.5} />
    <pointLight position={[10, 10, 10]} />
    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
    <mesh position={[-3, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
      <cylinderGeometry args={[0.5, 0.5, 2]} />
      <meshStandardMaterial color="#3b82f6" />
    </mesh>
    <mesh position={[0, 0, 0]} rotation={[0.5, 0.5, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ef4444" />
    </mesh>
    <mesh position={[3, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.3, 0.3, 1.5]} />
      <meshStandardMaterial color="#22c55e" />
    </mesh>
  </Canvas>
);

interface Exercise {
  id: string;
  name: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'balance';
  duration: number;
  calories: number;
  intensity: 'low' | 'moderate' | 'high';
  date: string;
  notes?: string;
}

interface WorkoutPlan {
  id: number;
  name: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  exercises: Array<{
    name: string;
    sets?: number;
    reps?: number;
    duration?: string;
    type: string;
  }>;
}

const workoutPlans: WorkoutPlan[] = [
  {
    id: 1,
    name: "Diabetes-Friendly Cardio",
    description: "Low-impact cardiovascular exercises perfect for blood sugar management",
    duration: "30 minutes",
    difficulty: "Beginner",
    exercises: [
      { name: "Brisk Walking", duration: "10 minutes", type: "Warm-up" },
      { name: "Stationary Cycling", duration: "15 minutes", type: "Cardio" },
      { name: "Gentle Stretching", duration: "5 minutes", type: "Cool-down" }
    ]
  },
  {
    id: 2,
    name: "Strength & Stability",
    description: "Building muscle strength to improve insulin sensitivity",
    duration: "45 minutes",
    difficulty: "Intermediate",
    exercises: [
      { name: "Bodyweight Squats", sets: 3, reps: 12, type: "Strength" },
      { name: "Push-ups (modified)", sets: 3, reps: 8, type: "Strength" },
      { name: "Resistance Band Rows", sets: 3, reps: 10, type: "Strength" },
      { name: "Plank Hold", duration: "30 seconds", type: "Core" }
    ]
  },
  {
    id: 3,
    name: "Flexibility & Balance",
    description: "Improve circulation and prevent diabetic complications",
    duration: "25 minutes",
    difficulty: "Beginner",
    exercises: [
      { name: "Tai Chi Movements", duration: "10 minutes", type: "Balance" },
      { name: "Yoga Stretches", duration: "10 minutes", type: "Flexibility" },
      { name: "Deep Breathing", duration: "5 minutes", type: "Relaxation" }
    ]
  }
];

const exerciseLibrary = {
  cardio: [
    { name: "Walking", caloriesPerMin: 4 },
    { name: "Swimming", caloriesPerMin: 8 },
    { name: "Cycling", caloriesPerMin: 6 },
    { name: "Dancing", caloriesPerMin: 5 },
    { name: "Elliptical", caloriesPerMin: 7 }
  ],
  strength: [
    { name: "Weight Training", caloriesPerMin: 5 },
    { name: "Resistance Bands", caloriesPerMin: 4 },
    { name: "Bodyweight Exercises", caloriesPerMin: 6 },
    { name: "Pilates", caloriesPerMin: 4 }
  ],
  flexibility: [
    { name: "Yoga", caloriesPerMin: 3 },
    { name: "Stretching", caloriesPerMin: 2 },
    { name: "Tai Chi", caloriesPerMin: 3 }
  ]
};

export const ExerciseTracking = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [newExercise, setNewExercise] = useState({
    name: "",
    type: "cardio" as const,
    duration: "",
    intensity: "moderate" as const,
    notes: ""
  });

  const weeklyGoals = {
    exerciseMinutes: 150, // WHO recommendation
    workouts: 5,
    caloriesBurned: 1000
  };

  const weeklyProgress = {
    exerciseMinutes: exercises.reduce((total, ex) => total + ex.duration, 0),
    workouts: exercises.length,
    caloriesBurned: exercises.reduce((total, ex) => total + ex.calories, 0)
  };

  const addExercise = () => {
    if (!newExercise.name || !newExercise.duration) return;

    const duration = Number(newExercise.duration);
    const caloriesPerMin = getCaloriesPerMinute(newExercise.name, newExercise.type);
    
    const exercise: Exercise = {
      id: Date.now().toString(),
      name: newExercise.name,
      type: newExercise.type,
      duration,
      calories: Math.round(duration * caloriesPerMin),
      intensity: newExercise.intensity,
      date: new Date().toISOString().split('T')[0],
      notes: newExercise.notes
    };

    setExercises([exercise, ...exercises]);
    setNewExercise({
      name: "",
      type: "cardio",
      duration: "",
      intensity: "moderate",
      notes: ""
    });
  };

  const getCaloriesPerMinute = (exerciseName: string, type: string) => {
    const category = exerciseLibrary[type as keyof typeof exerciseLibrary];
    const exercise = category?.find(ex => ex.name.toLowerCase().includes(exerciseName.toLowerCase()));
    return exercise?.caloriesPerMin || 4;
  };

  const startTimer = () => setIsTimerRunning(true);
  const pauseTimer = () => setIsTimerRunning(false);
  const stopTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* 3D Exercise Visualization */}
      <Card className="h-64">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Exercise Equipment Visualization
          </CardTitle>
        </CardHeader>
        <CardContent className="h-32">
          <ExerciseScene />
        </CardContent>
      </Card>

      <Tabs defaultValue="tracking" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tracking">Track Workout</TabsTrigger>
          <TabsTrigger value="plans">Workout Plans</TabsTrigger>
          <TabsTrigger value="timer">Exercise Timer</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-6">
          {/* Weekly Goals Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Exercise Minutes</p>
                    <p className="text-2xl font-bold">{weeklyProgress.exerciseMinutes}</p>
                    <p className="text-xs text-muted-foreground">of {weeklyGoals.exerciseMinutes} weekly</p>
                  </div>
                  <Timer className="h-8 w-8 text-primary" />
                </div>
                <Progress value={(weeklyProgress.exerciseMinutes / weeklyGoals.exerciseMinutes) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Workouts</p>
                    <p className="text-2xl font-bold">{weeklyProgress.workouts}</p>
                    <p className="text-xs text-muted-foreground">of {weeklyGoals.workouts} weekly</p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
                <Progress value={(weeklyProgress.workouts / weeklyGoals.workouts) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Calories Burned</p>
                    <p className="text-2xl font-bold">{weeklyProgress.caloriesBurned}</p>
                    <p className="text-xs text-muted-foreground">of {weeklyGoals.caloriesBurned} weekly</p>
                  </div>
                  <Flame className="h-8 w-8 text-orange-500" />
                </div>
                <Progress value={(weeklyProgress.caloriesBurned / weeklyGoals.caloriesBurned) * 100} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Log Exercise Form */}
          <Card>
            <CardHeader>
              <CardTitle>Log Exercise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                  <Label htmlFor="exercise-name">Exercise Name</Label>
                  <Input
                    id="exercise-name"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                    placeholder="e.g., Brisk Walking"
                  />
                </div>
                <div>
                  <Label htmlFor="exercise-type">Type</Label>
                  <select
                    id="exercise-type"
                    value={newExercise.type}
                    onChange={(e) => setNewExercise({ ...newExercise, type: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="cardio">Cardio</option>
                    <option value="strength">Strength</option>
                    <option value="flexibility">Flexibility</option>
                    <option value="balance">Balance</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newExercise.duration}
                    onChange={(e) => setNewExercise({ ...newExercise, duration: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="intensity">Intensity</Label>
                  <select
                    id="intensity"
                    value={newExercise.intensity}
                    onChange={(e) => setNewExercise({ ...newExercise, intensity: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  value={newExercise.notes}
                  onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                  placeholder="How did you feel? Any observations..."
                />
              </div>
              <Button onClick={addExercise} className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Log Exercise
              </Button>
            </CardContent>
          </Card>

          {/* Recent Exercises */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              {exercises.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No exercises logged yet</p>
              ) : (
                <div className="space-y-4">
                  {exercises.slice(0, 5).map((exercise) => (
                    <div key={exercise.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{exercise.type}</Badge>
                        <div>
                          <h4 className="font-medium">{exercise.name}</h4>
                          <p className="text-sm text-muted-foreground">{exercise.date}</p>
                          {exercise.notes && (
                            <p className="text-xs text-muted-foreground italic">{exercise.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{exercise.duration} min</p>
                        <p className="text-sm text-muted-foreground">{exercise.calories} cal</p>
                        <Badge variant={
                          exercise.intensity === 'high' ? 'destructive' :
                          exercise.intensity === 'moderate' ? 'default' : 'secondary'
                        }>
                          {exercise.intensity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workoutPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    <Badge variant="outline">{plan.difficulty}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        {plan.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        {plan.exercises.length} exercises
                      </div>
                    </div>
                    <div className="space-y-2">
                      {plan.exercises.map((exercise, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{exercise.name}</span>
                          <span className="text-muted-foreground">
                            {exercise.sets && exercise.reps && `${exercise.sets}x${exercise.reps}`}
                            {exercise.duration && exercise.duration}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full">Start Workout</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timer" className="space-y-6">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Exercise Timer</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="text-6xl font-mono font-bold text-primary">
                {formatTime(timerSeconds)}
              </div>
              <div className="flex justify-center gap-4">
                <Button
                  onClick={startTimer}
                  disabled={isTimerRunning}
                  size="lg"
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Button>
                <Button
                  onClick={pauseTimer}
                  disabled={!isTimerRunning}
                  variant="secondary"
                  size="lg"
                  className="gap-2"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
                <Button
                  onClick={stopTimer}
                  variant="destructive"
                  size="lg"
                  className="gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Weekly Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Exercise Minutes</span>
                    <span className="font-bold">{weeklyProgress.exerciseMinutes}/{weeklyGoals.exerciseMinutes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Workouts Completed</span>
                    <span className="font-bold">{weeklyProgress.workouts}/{weeklyGoals.workouts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Calories Burned</span>
                    <span className="font-bold">{weeklyProgress.caloriesBurned}/{weeklyGoals.caloriesBurned}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Health Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Improved insulin sensitivity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Better cardiovascular health</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Enhanced glucose control</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Increased energy levels</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};