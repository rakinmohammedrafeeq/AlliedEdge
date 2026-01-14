import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, User, Shield, LogOut, Menu, LogIn, Bell, MessageCircle, Moon, Sun, Search, X, FileText } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { DefaultAvatarFallback } from '@/components/DefaultAvatarFallback';

export function Navigation() {
  const { user, logout, isAuthenticated } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Keep the search box in sync with the current URL (?search=...)
  // so users can clear it after searching.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search') || '';
    setSearchQuery(q);
  }, [location.search]);

  const resolvedAvatarSrc = useMemo(() => {
    const raw = user?.avatar;
    if (!raw) return undefined;
    const trimmed = raw.trim();
    if (!trimmed) return undefined;

    // Stable cache-bust: only changes when the avatar URL itself changes.
    const stamp = encodeURIComponent(trimmed);
    const hasQuery = trimmed.includes('?');
    return `${trimmed}${hasQuery ? '&' : '?'}v=${stamp}`;
  }, [user?.avatar]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/');
    }
  };

  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur-lg bg-background/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="AlliedEdge"
              className="h-10 w-auto"
            />
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Feed
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/announcements" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Announcements
              </Link>
            </Button>
            {isAuthenticated && (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/chat" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Chat
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-72 pr-9"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleClearSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button type="submit" size="icon" variant="ghost" className="search-button">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {isAuthenticated ? (
          <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  {resolvedAvatarSrc ? (
                    <AvatarImage src={resolvedAvatarSrc} alt={user?.name} />
                  ) : (
                    <AvatarFallback>
                      <DefaultAvatarFallback alt={user?.name ? `${user.name} profile image` : 'Default profile image'} />
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/myposts" className="cursor-pointer flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  My Posts
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="cursor-pointer flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/" className="cursor-pointer">
                  <Home className="mr-2 h-4 w-4" />
                  Feed
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/announcements" className="cursor-pointer">
                  <Bell className="mr-2 h-4 w-4" />
                  Announcements
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/chat" className="cursor-pointer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </>
        ) : (
          <Button asChild>
            <Link to="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Link>
          </Button>
        )}
        </div>
      </div>
    </nav>
  );
}
