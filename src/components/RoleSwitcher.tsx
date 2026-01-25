import { useState } from "react";
import { ChevronDown, User, Stethoscope, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type UserRole = "patient" | "clinician" | "admin";

interface RoleSwitcherProps {
  currentRole: UserRole;
  availableRoles: UserRole[];
  onRoleChange: (role: UserRole) => void;
}

const roleConfig: Record<UserRole, { label: string; icon: typeof User; color: string }> = {
  patient: {
    label: "Patient",
    icon: User,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  clinician: {
    label: "Clinician",
    icon: Stethoscope,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
};

export const RoleSwitcher = ({ currentRole, availableRoles, onRoleChange }: RoleSwitcherProps) => {
  // Don't render if user has only one role
  if (availableRoles.length <= 1) {
    const config = roleConfig[currentRole];
    const IconComponent = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }

  const currentConfig = roleConfig[currentRole];
  const CurrentIcon = currentConfig.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-2 ${currentConfig.color} border-0 hover:opacity-80`}
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentConfig.label}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {availableRoles.map((role) => {
          const config = roleConfig[role];
          const IconComponent = config.icon;
          const isActive = role === currentRole;
          
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => onRoleChange(role)}
              className={`gap-2 cursor-pointer ${isActive ? "bg-muted" : ""}`}
            >
              <IconComponent className="h-4 w-4" />
              <span>{config.label}</span>
              {isActive && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  Active
                </Badge>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
