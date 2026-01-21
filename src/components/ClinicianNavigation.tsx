import { useState } from "react";
import { 
  Menu, X, Heart, LayoutDashboard, Users, Calendar, 
  Pill, AlertTriangle, MessageSquare, FileText, LogOut, User 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClinicianNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onSignOut?: () => void;
}

export const ClinicianNavigation = ({ currentPage, onPageChange, onSignOut }: ClinicianNavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "patients", label: "Patients", icon: Users },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "prescriptions", label: "Prescriptions", icon: Pill },
    { id: "alerts", label: "Alerts", icon: AlertTriangle },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="bg-card shadow-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button 
            onClick={() => onPageChange('overview')}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <Heart className="h-8 w-8 text-primary" />
            <div className="flex flex-col items-start">
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                DiabeSure
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1">Clinician Portal</span>
            </div>
          </button>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentPage === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onPageChange(item.id)}
                  className={`flex items-center space-x-2 ${
                    item.id === 'alerts' ? 'text-orange-600 hover:text-orange-700' : ''
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Button>
              );
            })}
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-4 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-in slide-in-from-top-2">
            <div className="flex flex-col space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      onPageChange(item.id);
                      setIsMenuOpen(false);
                    }}
                    className="justify-start"
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start text-destructive"
                onClick={onSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
