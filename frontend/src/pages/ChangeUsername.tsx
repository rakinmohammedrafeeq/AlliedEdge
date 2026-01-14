import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/AuthContext';

export default function ChangeUsername() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [username, setUsername] = useState(user?.username || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (username.length < 3 || username.length > 30) {
      setError('Username must be between 3 and 30 characters');
      return;
    }

    const usernamePattern = /^[A-Za-z0-9._-]+$/;
    if (!usernamePattern.test(username)) {
      setError('Username can only contain letters, numbers, dots, underscores, and hyphens');
      return;
    }

    if (username.includes('@')) {
      setError('Username cannot be an email address');
      return;
    }

    // TODO: Replace with actual API call
    console.log('Updating username to:', username);

    // Navigate back to home or profile after successful update
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen pb-8">
        <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="gradient-mesh-card p-8">
          <h1 className="text-2xl font-semibold mb-6">Change Username</h1>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-1">Email</p>
            <p className="font-semibold text-lg">{user?.email || 'user@example.com'}</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <Label htmlFor="username" className="text-base font-semibold mb-2">
                New Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={30}
                pattern="^[A-Za-z0-9._-]+$"
                className="mt-2"
              />
              <div className="mt-2 text-sm text-gray-600">
                3–30 characters. Allowed: letters, numbers, dots, underscores, hyphens. Must not be an email.
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">
                Save Username
              </Button>
            </div>
          </form>
        </Card>
        </div>
      </div>
    </>
  );
}
