import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AtSign, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function SetupUsername() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock user data - in real app, get from context/session
  const currentDisplayName = 'User';

  const validateUsername = (value: string): string | null => {
    if (value.length < 3 || value.length > 30) {
      return 'Username must be between 3 and 30 characters';
    }

    const usernamePattern = /^[A-Za-z0-9._-]+$/;
    if (!usernamePattern.test(value)) {
      return 'Username can only contain letters, numbers, dots (.), underscores (_), and hyphens (-)';
    }

    if (value.includes('@')) {
      return 'Username cannot be an email address';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // In real app, would call API to save username
      console.log('Setting username:', username);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Username saved successfully!');
      navigate('/');
    } catch (err) {
      console.error('Failed to save username:', err);
      setError('Failed to save username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="gradient-mesh-card w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Choose a Username</h1>
            <p className="text-muted-foreground">
              Hi <strong>{currentDisplayName}</strong>, please choose a username that will be visible
              on your posts and comments.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                <AtSign className="h-4 w-4 inline mr-2" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your username"
                required
                minLength={3}
                maxLength={30}
                disabled={isLoading}
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                3-30 characters, only letters, numbers, dots (.), underscores (_) and hyphens (-).
                Do not use your email.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                'Saving...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Username
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
