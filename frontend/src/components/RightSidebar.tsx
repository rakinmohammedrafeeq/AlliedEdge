import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { Info, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';

export function RightSidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please log in to search users');
      navigate('/login');
      return;
    }

    const q = searchQuery.trim();
    if (!q) return;

    const params = new URLSearchParams(window.location.search);
    params.set('userSearch', q);
    // Reset posts search if present, because we are switching modes.
    params.delete('search');
    // Reset paging if any
    params.delete('page');
    window.location.href = `/?${params.toString()}`;
  };

  return (
      <aside className="hidden lg:block w-72 xl:w-80 fixed right-6 top-20 max-h-[calc(100vh-5rem)] overflow-y-auto hide-scrollbar">
      <div className="space-y-4">
        {/* Search Users */}
        <Card className="gradient-mesh-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" className="search-button">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Community Guidelines */}
        <Card className="gradient-mesh-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              Community Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">•</span>
                <span>Be respectful to all users</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">•</span>
                <span>Share genuine, tech-related content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">•</span>
                <span>Protect privacy and personal data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">•</span>
                <span>No fake profiles, spam, or harmful activity</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* About AlliedEdge */}
        <Card className="gradient-mesh-card">
          <CardHeader>
            <CardTitle className="text-lg brand-name">
              About <span className="allied">Allied</span><span className="edge">Edge</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              A social platform for students and developers to connect, share knowledge, and grow together.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link to="/help" className="hover:underline">Help</Link>
              <span>•</span>
              <Link to="/terms" className="hover:underline">Terms</Link>
              <span>•</span>
              <Link to="/privacy" className="hover:underline">Privacy</Link>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span>Admin Contacts:</span>
              <a
                href="https://www.linkedin.com/in/rayan-mohammed-rafeeq"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:underline"
              >
                Rayan
              </a>
              <span>•</span>
              <a
                href="https://www.linkedin.com/in/rakinmohammedrafeeq"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:underline"
              >
                Rakin
              </a>
            </div>
            <p className="text-xs text-muted-foreground brand-name">
              © 2026 <span className="allied">Allied</span><span className="edge">Edge</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
