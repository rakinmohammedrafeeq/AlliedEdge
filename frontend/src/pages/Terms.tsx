import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { FileText, AlertCircle } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
          <p className="text-muted-foreground">
            Last updated: January 6, 2026
          </p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Welcome to AlliedEdge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                By creating an account and using AlliedEdge, you agree to follow these terms.
                These rules help us maintain a safe, respectful, and productive community for
                all students and developers.
              </p>
              <p className="text-sm text-muted-foreground">
                If you don't agree with these terms, please don't use our platform.
              </p>
            </CardContent>
          </Card>

          {/* Acceptance of Terms */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                When you sign up for AlliedEdge, you're agreeing to:
              </p>
              <ul className="space-y-2 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Follow all the rules outlined in these Terms & Conditions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Respect our Community Guidelines and Privacy Policy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Be at least 13 years old (or the minimum age in your country)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Provide accurate information when creating your account</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>2. Your Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Account Security</h3>
                <ul className="space-y-2 text-sm ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>Keep your password secure and don't share it with anyone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>You're responsible for all activity on your account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>Notify us immediately if your account is compromised</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Respectful Behavior</h3>
                <ul className="space-y-2 text-sm ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>Treat everyone with respect and kindness</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>No harassment, bullying, hate speech, or discrimination</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>Constructive criticism is welcome, but stay professional</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Acceptable Use */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>3. Acceptable Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-semibold">You may use AlliedEdge to:</p>
              <ul className="space-y-2 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Share tech-related projects, tutorials, and learning resources</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Ask questions and help others with their coding problems</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Network with students and developers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Collaborate on projects and ideas</span>
                </li>
              </ul>

              <p className="font-semibold mt-4">You may NOT:</p>
              <ul className="space-y-2 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Post spam, misleading content, or excessive self-promotion</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Share harmful, illegal, or inappropriate content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Plagiarize or steal others' work without credit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Attempt to hack, exploit, or damage the platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Use bots, scrapers, or automated tools without permission</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Account Authenticity */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>4. Account Authenticity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>To maintain trust in our community:</p>
              <ul className="space-y-2 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Create only one personal account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Use your real name or a recognizable username</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Don't impersonate others or create fake profiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Don't create accounts for malicious purposes</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Content Ownership */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>5. Content Ownership & Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Your Content</h3>
                <p className="text-sm text-muted-foreground">
                  You own everything you post on AlliedEdge. We don't claim ownership of your
                  posts, projects, or code. However, by posting on our platform, you give us
                  permission to display, store, and share your content within the platform.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Platform Rights</h3>
                <p className="text-sm text-muted-foreground">
                  AlliedEdge reserves the right to remove content that violates these terms or
                  our community guidelines. We may also use anonymous, aggregated data to improve
                  our services.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Respecting Others' Work</h3>
                <p className="text-sm text-muted-foreground">
                  Always give credit when sharing someone else's work. Don't post copyrighted
                  material without permission.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Consequences */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                6. Consequences of Violations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                If you violate these terms or our community guidelines, we may:
              </p>
              <ul className="space-y-2 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Issue a warning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Remove specific posts or content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Temporarily suspend your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">•</span>
                  <span>Permanently ban your account for serious or repeated violations</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                We'll always try to be fair and give you a chance to improve, but we prioritize
                keeping our community safe.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>7. Changes to These Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                We may update these terms from time to time. When we do, we'll notify you through
                the platform or via email. Continuing to use AlliedEdge after changes means you
                accept the new terms.
              </p>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>8. Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                AlliedEdge is provided "as is" without warranties. We strive to keep the platform
                running smoothly, but we can't guarantee it will always be available or error-free.
                We're not responsible for any loss or damage resulting from your use of the platform.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="gradient-mesh-card">
            <CardHeader>
              <CardTitle>Questions About These Terms?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                If you have questions or concerns about these Terms & Conditions, please contact us at:
              </p>
              <p className="text-sm">
                <a href="mailto:legal@alliededge.com" className="text-primary hover:underline">
                  legal@alliededge.com
                </a>
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
