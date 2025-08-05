import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Dashboard } from "@/components/Dashboard";
import { DoctorDashboard } from "@/components/DoctorDashboard";
import { GlucoseTracking } from "@/components/GlucoseTracking";
import { MedicationTracking } from "@/components/MedicationTracking";
import { NutritionTracking } from "@/components/NutritionTracking";
import { ExerciseTracking } from "@/components/ExerciseTracking";
import { ProfilePage } from "@/components/ProfilePage";
import { LandingPage } from "@/components/LandingPage";
import { AuthPage } from "@/components/AuthPage";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        loadUserRole(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setIsLoggedIn(true);
          await loadUserRole(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setUserRole("");
          setCurrentPage("dashboard");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserRole = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (profile) {
        setUserRole(profile.role);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const handleGetStarted = () => {
    setShowAuth(true);
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserRole("");
    setShowAuth(false);
    setCurrentPage("dashboard");
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return userRole === 'doctor' ? <DoctorDashboard /> : <Dashboard />;
      case "glucose":
        return <GlucoseTracking />;
      case "medication":
        return <MedicationTracking />;
      case "nutrition":
        return <NutritionTracking />;
      case "exercise":
        return <ExerciseTracking />;
      case "appointments":
        return <div className="p-8 text-center"><h2 className="text-2xl font-bold">Appointments Module Coming Soon</h2></div>;
      case "education":
        return <div className="p-8 text-center"><h2 className="text-2xl font-bold">Education Module Coming Soon</h2></div>;
      case "profile":
        return <ProfilePage onSignOut={handleSignOut} />;
      default:
        return userRole === 'doctor' ? <DoctorDashboard /> : <Dashboard />;
    }
  };

  if (!isLoggedIn && !showAuth) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (showAuth) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        onSignOut={handleSignOut}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default Index;
