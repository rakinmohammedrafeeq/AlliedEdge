import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { HelpCircle, MessageCircle, Mail } from 'lucide-react';

export default function Help() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Help Center</h1>
          <p className="text-muted-foreground brand-name">
            Find answers to common questions and learn how to use <span className="allied">Allied</span><span className="edge">Edge</span>
          </p>
        </div>

        <div className="space-y-6">
          {/* About AlliedEdge */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 brand-name">
                <HelpCircle className="h-5 w-5" />
                About <span className="allied">Allied</span><span className="edge">Edge</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="brand-name">
                <span className="allied">Allied</span><span className="edge">Edge</span> is a social platform designed for students and developers to connect,
                share knowledge, collaborate on projects, and grow together. Whether you're learning
                to code, working on a project, or looking to network with like-minded individuals,
                <span className="allied"> Allied</span><span className="edge">Edge</span> provides the tools and community you need.
              </p>
            </CardContent>
          </Card>

          {/* Account & Profile */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>Account & Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How do I create an account?</h3>
                <p className="text-sm text-muted-foreground">
                  Click "Sign Up" in the navigation bar and provide your email address and password.
                  You'll need to verify your email to activate your account.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How do I edit my profile?</h3>
                <p className="text-sm text-muted-foreground">
                  Click on your profile picture in the top-right corner, then select "Edit Profile"
                  from the dropdown menu. You can update your name, bio, avatar, and other details.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Can I change my username?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! Go to your profile menu and select "Change Username". Your new username must
                  be unique and follow our community guidelines.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How do I reset my password?</h3>
                <p className="text-sm text-muted-foreground">
                  On the login page, click "Forgot Password" and enter your email. We'll send you
                  instructions to reset your password.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Posts & Content */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>Posts & Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How do I create a post?</h3>
                <p className="text-sm text-muted-foreground">
                  Click the "Create Post" button on your feed. Write your content, add any media
                  if needed, and click "Post" to share with the community.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Can I edit or delete my posts?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! Click on your post and select "Edit" or "Delete" from the options menu.
                  Edited posts will show an "edited" indicator.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How do I search for posts?</h3>
                <p className="text-sm text-muted-foreground">
                  Use the search bar in the navigation menu to find posts by keywords. You can
                  also filter and sort posts on the main feed.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">What content is allowed?</h3>
                <p className="text-sm text-muted-foreground">
                  Share tech-related content, projects, questions, tutorials, and meaningful
                  discussions. Avoid spam, harassment, or content that violates our community
                  guidelines.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Community Features */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>Community Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How do likes and comments work?</h3>
                <p className="text-sm text-muted-foreground">
                  Click the heart icon to like a post. Click "View Comments" to read and add
                  comments. Engage respectfully and constructively with others.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Can I message other users?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! Use the Chat feature to send direct messages to other users. Access it
                  from the navigation menu.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How do I find other users?</h3>
                <p className="text-sm text-muted-foreground">
                  Use the "Search Users" feature in the sidebar to find people by name or username.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reporting & Safety */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>Reporting & Safety</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How do I report inappropriate content?</h3>
                <p className="text-sm text-muted-foreground">
                  Click the options menu (three dots) on any post and select "Report". Choose
                  the reason and provide details. Our team will review it promptly.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How do I block or mute someone?</h3>
                <p className="text-sm text-muted-foreground">
                  Visit their profile and select "Block" or "Mute" from the options. Blocked
                  users cannot see your content or interact with you.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Still Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                If you couldn't find the answer you're looking for, our support team is here to help.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                <span className="text-muted-foreground">Contact us at:</span>
                <a href="mailto:support@alliededge.com" className="text-primary hover:underline">
                  support@alliededge.com
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                We typically respond within 24-48 hours.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
