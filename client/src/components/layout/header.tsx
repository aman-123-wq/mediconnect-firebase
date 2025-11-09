import { Bell, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from "@/hooks/use-toast";

interface HeaderProps {
  title: string;
  subtitle?: string;
  unreadAlerts?: number;
}

export default function Header({ title, subtitle, unreadAlerts = 0 }: HeaderProps) {
  const user = auth.currentUser;

  // SIMPLE LOGOUT - NO ROUTER NEEDED
  const handleLogout = async () => {
    try {
      await signOut(auth);
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of MediConnect",
      });
      
      // Simple page reload - will redirect to login automatically
      window.location.href = '/'; // or your login page URL
      
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out",
        variant: "destructive",
      });
    }
  };

  // Generate user display name from email or use generic
  const getUserDisplayName = () => {
    if (user?.email) {
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
          
          {/* LOGOUT BUTTON */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
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