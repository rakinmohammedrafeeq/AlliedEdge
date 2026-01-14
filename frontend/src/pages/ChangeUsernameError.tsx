import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

export default function ChangeUsernameError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthContext();
  
  const error = searchParams.get('error') || 'You are not allowed to change your username.';

  return (
    <>
      <Navigation />
      <div className="min-h-screen pb-8">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="gradient-mesh-card p-8">
          <h1 className="text-2xl font-semibold mb-6">Change Username</h1>

          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-yellow-800 mb-2">{error}</p>
                <p className="text-sm text-yellow-700">
                  Account: <strong>{user?.email || 'Unknown'}</strong>
                </p>
              </div>
            </div>
          </div>

          <Button onClick={() => navigate('/')}>
            Back to Home
          </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
