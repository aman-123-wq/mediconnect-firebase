import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
  unreadAlerts?: number;
}

export default function Header({ title, subtitle, unreadAlerts = 0 }: HeaderProps) {
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
              <AvatarImage src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64" />
              <AvatarFallback>DJ</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground" data-testid="text-user-name">
                Dr. Sarah Johnson
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-user-role">
                Hospital Administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
