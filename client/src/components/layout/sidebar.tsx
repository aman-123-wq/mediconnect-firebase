import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Bed, 
  Calendar, 
  Heart, 
  UserCheck, 
  Users, 
  Bot 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Bed Management", href: "/beds", icon: Bed },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Organ Donors", href: "/donors", icon: Heart },
  { name: "Doctors", href: "/doctors", icon: UserCheck },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "AI Assistant", href: "/chatbot", icon: Bot },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border shadow-sm">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">MediCare HMS</h1>
            <p className="text-sm text-muted-foreground">Smart Management</p>
          </div>
        </div>
      </div>
      
      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
