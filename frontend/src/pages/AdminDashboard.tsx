import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Users, Newspaper, Bell, ArrowRight, Home } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  useEffect(() => {if (user?.role !== 'ROLE_ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

  if (user?.role !== 'ROLE_ADMIN') {
    return null;
  }

  const dashboardCards = [
    {
      title: 'User Management',
      description: 'View, search, and manage all registered users. Monitor user activity and access user profiles.',
      icon: Users,
      link: '/admin/users',
    },
    {
      title: 'Post Management',
      description: 'Create, edit, and moderate posts. Review all content published on the platform.',
      icon: Newspaper,
      link: '/admin/posts',
    },
    {
      title: 'Manage Announcements',
      description: 'Create and publish announcements to notify all users about important updates and news.',
      icon: Bell,
      link: '/admin/announcements',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <Shield className="h-12 w-12 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your platform from one central location
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {dashboardCards.map((card) => (
            <Link key={card.link} to={card.link} className="group">
              <Card className="gradient-mesh-card h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <CardContent className="pt-6 text-center">
                  {/* Icon Container */}
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300">
                    <card.icon className="h-10 w-10" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold mb-3">
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6 min-h-[4rem]">
                    {card.description}
                  </p>

                  {/* Button */}
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-muted font-semibold transition-all duration-300 group-hover:gap-4 admin-card-button">
                    <span>Manage</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-lg hover:opacity-80 transition-opacity"
          >
            <Home className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
