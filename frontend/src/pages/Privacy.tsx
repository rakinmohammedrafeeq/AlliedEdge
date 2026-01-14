import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Shield, Eye, Lock, Database, UserCheck } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: January 6, 2026
          </p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Your Privacy Matters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                At AlliedEdge, we take your privacy seriously. This policy explains what information
                we collect, how we use it, and how we protect it. We believe in transparency and
                giving you control over your personal data.
              </p>
              <p className="text-sm font-semibold text-primary">
                We will never sell your personal data to third parties.
              </p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                1. What Data We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Account Information</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  When you create an account, we collect:
                </p>
                <ul className="space-y-2 text-sm ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>Email address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>Username</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>Password (encrypted)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>Profile information (name, bio, avatar)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Content You Create</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  We store content you voluntarily share:
                </p>
                <ul className="space-y-2 text-sm ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>Posts, comments, and messages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>Projects and code you share</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>Likes and interactions with other content</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Usage Data</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  To improve our platform, we automatically collect:
                </p>
                <ul className="space-y-2 text-sm ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>Device type and browser information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>IP address (for security purposes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>Pages visited and features used</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>Time and duration of your visits</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Cookies</h3>
                <p className="text-sm text-muted-foreground">
                  We use cookies to keep you logged in and remember your preferences (like theme settings).
                  These help improve your experience on AlliedEdge.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Data */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                2. How We Use Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>We use your information to:</p>
              <ul className="space-y-2 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Provide and maintain the AlliedEdge platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Personalize your experience (show relevant content)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Send you important updates and notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Improve our features and fix bugs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Protect against spam, abuse, and security threats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Comply with legal requirements</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                We only use your data for these purposes and don't use it in ways you wouldn't
                reasonably expect.
              </p>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                3. Data Sharing Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="font-semibold text-primary mb-2">Our Promise:</p>
                <p className="text-sm">
                  We will NEVER sell your personal data to advertisers, data brokers, or any
                  third parties for profit.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">When We Might Share Data:</h3>
                <ul className="space-y-2 text-sm ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>
                      <strong>Public Content:</strong> Posts and profiles you make public are
                      visible to other users
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>
                      <strong>Service Providers:</strong> Trusted companies that help us run the
                      platform (like hosting providers), under strict confidentiality agreements
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>
                      <strong>Legal Obligations:</strong> If required by law or to protect safety
                      and rights
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>
                      <strong>With Your Consent:</strong> Any other sharing will require your
                      explicit permission
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Anonymous Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  We may share anonymous, aggregated statistics about AlliedEdge usage (e.g.,
                  "1,000 posts created this month") that don't identify individual users.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                4. How We Protect Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>We take security seriously and implement multiple layers of protection:</p>
              <ul className="space-y-2 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Passwords are encrypted using industry-standard methods</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Data is transmitted over secure HTTPS connections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Regular security audits and monitoring for vulnerabilities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Limited employee access to user data (only when necessary)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Automated systems to detect and prevent unauthorized access</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                While we do our best to protect your data, no system is 100% secure. Please
                use a strong, unique password and keep it confidential.
              </p>
            </CardContent>
          </Card>

          {/* User Control */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>5. Your Control Over Your Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You have the right to:</p>

              <div>
                <h3 className="font-semibold mb-2">Access & Download</h3>
                <p className="text-sm text-muted-foreground">
                  Request a copy of all the data we have about you at any time.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Update & Correct</h3>
                <p className="text-sm text-muted-foreground">
                  Edit your profile, bio, and other information through your account settings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Delete Content</h3>
                <p className="text-sm text-muted-foreground">
                  Remove individual posts, comments, or messages at any time.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and associated data. Some information may be
                  retained for legal or security purposes (like IP logs for abuse prevention).
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Control Visibility</h3>
                <p className="text-sm text-muted-foreground">
                  Choose what information is public and what stays private through privacy settings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Opt-Out of Communications</h3>
                <p className="text-sm text-muted-foreground">
                  Unsubscribe from promotional emails (you'll still receive important account updates).
                </p>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                To exercise any of these rights, contact us at{' '}
                <a href="mailto:privacy@alliededge.com" className="text-primary hover:underline">
                  privacy@alliededge.com
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>6. How Long We Keep Your Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Account data is kept as long as your account is active</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Deleted content is permanently removed within 30 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Some data may be retained longer for legal compliance or security</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Anonymous analytics data may be kept indefinitely</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>7. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                AlliedEdge is intended for users aged 13 and older. We don't knowingly collect
                data from children under 13. If you believe a child under 13 has created an
                account, please contact us immediately.
              </p>
            </CardContent>
          </Card>

          {/* International Users */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>8. International Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                If you're accessing AlliedEdge from outside the United States, your data may be
                transferred to and stored on servers in the U.S. By using our platform, you
                consent to this transfer and processing.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Privacy Policy */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>9. Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                We may update this privacy policy from time to time. We'll notify you of
                significant changes through email or a notice on the platform. We encourage
                you to review this policy periodically.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>Questions or Concerns?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                If you have any questions about this Privacy Policy or how we handle your data,
                we're here to help:
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:privacy@alliededge.com" className="text-primary hover:underline">
                    privacy@alliededge.com
                  </a>
                </p>
                <p>
                  <strong>General Support:</strong>{' '}
                  <a href="mailto:support@alliededge.com" className="text-primary hover:underline">
                    support@alliededge.com
                  </a>
                </p>
              </div>
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
