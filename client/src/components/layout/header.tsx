import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { auth } from '@/lib/firebase'; // ADD THIS IMPORT

interface HeaderProps {
  title: string;
  subtitle?: string;
  unreadAlerts?: number;
}

export default function Header({ title, subtitle, unreadAlerts = 0 }: HeaderProps) {
  const user = auth.currentUser; // GET CURRENT USER
  
  // Generate user display name from email or use generic
  const getUserDisplayName = () => {
    if (user?.email) {
      // Convert email to display name: "test@mediconnect.com" → "Dr. Test"
      const namePart = user.email.split('@')[0];
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      return `Dr. ${formattedName}`;
    }
    return 'Hospital Staff';
  };

  const getUserRole = () => {
    return 'Medical Professional';
  };

  const getInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'HS';
  };

  return (
    <header className="bg-card border-b border-border p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {unreadAlerts}
              </span>
            )}
          </Button>
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              {/* REMOVED THE STATIC UNSPLASH IMAGE */}
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground" data-testid="text-user-name">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-user-role">
                {getUserRole()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}