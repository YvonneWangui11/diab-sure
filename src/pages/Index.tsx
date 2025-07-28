import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Dashboard } from "@/components/Dashboard";
import { GlucoseTracking } from "@/components/GlucoseTracking";
import { MedicationTracking } from "@/components/MedicationTracking";
import { NutritionTracking } from "@/components/NutritionTracking";
import { ExerciseTracking } from "@/components/ExerciseTracking";
import { ProfilePage } from "@/components/ProfilePage";
import { LandingPage } from "@/components/LandingPage";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleGetStarted = () => {
    setIsLoggedIn(true);
    setCurrentPage("dashboard");
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
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
        return <ProfilePage />;
      default:
        return <Dashboard />;
    }
  };

  if (!isLoggedIn) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default Index;
