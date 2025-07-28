import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Pill, 
  Apple, 
  Activity, 
  Calendar, 
  BarChart3,
  Shield,
  Users,
  Smartphone,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import heroImage from "@/assets/hero-medical.jpg";

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const features = [
    {
      icon: Heart,
      title: "Glucose Monitoring",
      description: "Track blood sugar levels with visual trends and personalized insights"
    },
    {
      icon: Pill,
      title: "Medication Management",
      description: "Never miss a dose with smart reminders and adherence tracking"
    },
    {
      icon: Apple,
      title: "AI Meal Planning",
      description: "Personalized meal plans based on your health profile and preferences"
    },
    {
      icon: Activity,
      title: "Exercise Tracking",
      description: "Log physical activities and get guidance for optimal health"
    },
    {
      icon: Calendar,
      title: "Appointment Reminders",
      description: "Stay on top of clinic visits and health checkups"
    },
    {
      icon: BarChart3,
      title: "Health Analytics",
      description: "Comprehensive reports for you and your healthcare provider"
    }
  ];

  const benefits = [
    "Improved medication adherence",
    "Better glucose control",
    "Personalized health insights",
    "Enhanced patient-doctor communication",
    "Reduced hospital visits",
    "Lifestyle behavior tracking"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <Badge className="bg-white/20 text-white border-white/30 mb-6">
                Powered by AI Technology
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                DiabeSure
              </h1>
              <p className="text-xl md:text-2xl mb-4 text-white/90">
                Comprehensive Diabetes Management Platform
              </p>
              <p className="text-lg mb-8 text-white/80">
                Empowering patients at JKUAT Hospital with AI-powered tools for effective 
                diabetes self-management, medication tracking, and lifestyle monitoring.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90"
                  onClick={onGetStarted}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Medical Technology" 
                className="rounded-lg shadow-elevated w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Comprehensive Diabetes Care
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              DiabeSure provides a complete digital solution for diabetes management, 
              designed specifically for the needs of JKUAT Hospital patients.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="shadow-card bg-gradient-card border-0">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Choose DiabeSure?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform is specifically designed for the Kenyan healthcare context, 
                addressing the unique challenges faced by diabetes patients at JKUAT Hospital.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardContent className="p-6 text-center">
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Secure & Private</h3>
                  <p className="text-sm text-muted-foreground">
                    Your health data is protected with enterprise-grade security
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-secondary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Clinician Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Healthcare providers can monitor patient progress remotely
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-6 text-center">
                  <Smartphone className="h-12 w-12 text-accent mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Easy to Use</h3>
                  <p className="text-sm text-muted-foreground">
                    Intuitive interface designed for all age groups
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Intelligent recommendations based on your health data
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your Diabetes?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join JKUAT Hospital patients who are already using DiabeSure to manage their health effectively.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90"
            onClick={onGetStarted}
          >
            Start Your Journey Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Heart className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
                DiabeSure
              </span>
            </div>
            <p className="text-muted-foreground text-center md:text-right">
              Developed for JKUAT Hospital<br />
              Supporting diabetes management in Kenya
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};