import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Dashboard } from "@/components/Dashboard";
import { DoctorDashboard } from "@/components/DoctorDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { GlucoseTracking } from "@/components/GlucoseTracking";
import { NutritionTrackingEnhanced } from "@/components/NutritionTrackingEnhanced";
import { ExerciseTrackingEnhanced } from "@/components/ExerciseTrackingEnhanced";
import { AppointmentViewing } from "@/components/AppointmentViewing";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { EducationHub } from "@/components/EducationHub";
import { ProfilePage } from "@/components/ProfilePage";
import { LandingPage } from "@/components/LandingPage";
import { AuthPage } from "@/components/AuthPage";
import { FloatingYvonneButton } from "@/components/FloatingYvonneButton";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showAuth, setShowAuth] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        setUserId(session.user.id);
        loadUserRole(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setIsLoggedIn(true);
          setUserId(session.user.id);
          await loadUserRole(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setUserRole("");
          setUserId("");
          setCurrentPage("dashboard");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserRole = async (userId: string) => {
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (roleData) {
        setUserRole(roleData.role);
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
    setUserId("");
    setShowAuth(false);
    setCurrentPage("dashboard");
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        if (userRole === 'admin') return <AdminDashboard />;
        return userRole === 'clinician' ? <DoctorDashboard /> : <Dashboard onNavigate={setCurrentPage} />;
      case "glucose":
        return userId ? <GlucoseTracking userId={userId} /> : null;
      case "nutrition":
        return userId ? <NutritionTrackingEnhanced userId={userId} /> : null;
      case "exercise":
        return userId ? <ExerciseTrackingEnhanced userId={userId} /> : null;
      case "appointments":
        return userId ? <AppointmentViewing userId={userId} /> : null;
      case "progress":
        return userId ? <ProgressDashboard userId={userId} /> : null;
      case "education":
        return <EducationHub />;
      case "profile":
        return <ProfilePage onSignOut={handleSignOut} />;
      default:
        if (userRole === 'admin') return <AdminDashboard />;
        return userRole === 'clinician' ? <DoctorDashboard /> : <Dashboard onNavigate={setCurrentPage} />;
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
      <FloatingYvonneButton />
    </div>
  );
};

export default Index;
