import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const TEST_USERS = [
  { email: 'test@mediconnect.com', password: 'test123' },
  { email: 'admin@mediconnect.com', password: 'admin123' }
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      
      // ADD THIS - Force page reload to update auth state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const useTestAccount = (index: number) => {
    setEmail(TEST_USERS[index].email);
    setPassword(TEST_USERS[index].password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">MediConnect HMS</CardTitle>
          <p className="text-muted-foreground">Sign in to access the system</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Test Accounts:</p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => useTestAccount(0)}
                disabled={loading}
              >
                Use Test Account 1
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => useTestAccount(1)}
                disabled={loading}
              >
                Use Test Account 2
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}