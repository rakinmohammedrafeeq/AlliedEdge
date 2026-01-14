import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { profileApi, UserProfile, followApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Edit,
  ExternalLink,
  Briefcase,
  MapPin,
  Globe,
  Mail,
  UserPlus,
  MessageCircle,
  Linkedin,
  Github,
  Twitter,
  Languages,
  GraduationCap,
  FileText,
  PlayCircle,
  Image,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import { DefaultAvatarFallback } from '@/components/DefaultAvatarFallback';
import { toast } from 'sonner';
import { VerifiedBadge } from '@/components/VerifiedBadge';

export default function Profile() {
  const { userId, username } = useParams<{ userId?: string; username?: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const isOwnProfile = !userId && !username;

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = userId
        ? await profileApi.getById(Number(userId))
        : username
        ? await profileApi.getByUsername(username)
        : await profileApi.get();
      setProfile(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, username]);

  const handleProfileUpdated = (updatedProfile: UserProfile) => {
    // Optimistic UI update so the dialog closes immediately.
    setProfile(updatedProfile);
    setShowEditDialog(false);

    // Then re-fetch from the backend to ensure we display the persisted state.
    // This prevents fields that aren't persisted server-side from appearing to “stick” until refresh.
    void fetchProfile();
  };

  const handleFollowToggle = async () => {
    if (!profile) return;
    try {
      if (profile.isFollowing) {
        await followApi.unfollow(profile.id);
      } else {
        await followApi.follow(profile.id);
      }
      await fetchProfile();
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  const handleMessageClick = () => {
    if (!profile) return;
    // Always navigate to the chat page; the chat UI will show a LinkedIn-style lock
    // when users aren't mutually following.
    navigate(`/chat/${profile.id}`);
  };

  const handleShareProfile = async () => {
    if (!profile) return;

    const sharePath = profile.username ? `/u/${profile.username}` : `/profile/${profile.id}`;
    const shareUrl = `${window.location.origin}${sharePath}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers / restricted contexts.
        const el = document.createElement('textarea');
        el.value = shareUrl;
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      toast.success('Profile link copied');
    } catch (e) {
      console.error('Failed to copy profile link:', e);
      toast.error('Could not copy link. Please copy it manually from the address bar.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <p className="text-destructive">{error || 'Profile not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Banner - User uploaded or default image */}
      <div className="profile-banner h-48 w-full relative">
        <img
          src={profile.bannerImage || '/default-banner.png'}
          alt="Profile banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <main className="container mx-auto px-4 -mt-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header with Avatar */}
          <div className="text-center mb-8">
            <Avatar className="h-40 w-40 sm:h-44 sm:w-44 md:h-48 md:w-48 mx-auto border-4 border-background shadow-xl">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback className="text-4xl">
                <DefaultAvatarFallback alt={profile.name} />
              </AvatarFallback>
            </Avatar>

            <h1 className="text-3xl font-bold mt-4 inline-flex items-center justify-center gap-2">
              {profile.name}
              <VerifiedBadge show={profile.role === 'ROLE_ADMIN'} size={18} title="Admin" />
            </h1>
            <p className="text-muted-foreground">
              @{profile.username || profile.email?.split('@')[0]}
            </p>

            {/* Followers Count */}
            <div className="flex gap-4 justify-center mt-2 text-sm">
              <div>
                <span className="font-semibold text-foreground">{profile.followersCount || 0}</span>
                <span className="text-muted-foreground ml-1">Followers</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">{profile.followingCount || 0}</span>
                <span className="text-muted-foreground ml-1">Following</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center mt-4">
              <Button variant="outline" onClick={handleShareProfile}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Share Profile
              </Button>
              {isOwnProfile ? (
                <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleFollowToggle}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {profile.isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                  <Button onClick={handleMessageClick} disabled={!profile.canMessage}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About me */}
              {profile.bio && (
                <Card className="gradient-mesh-card">
                  <CardHeader>
                    <CardTitle>About me</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/90 leading-relaxed">{profile.bio}</p>
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <Card className="gradient-mesh-card">
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} className="gradient-label px-3 py-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Projects Section */}
              {profile.projects && profile.projects.length > 0 && (
                <Card className="gradient-mesh-card">
                  <CardHeader>
                    <CardTitle>Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {profile.projects.map((project, index) => (
                        <div
                          key={project.id || index}
                          className="border rounded-lg p-5 bg-card hover:shadow-lg transition-shadow"
                        >
                          {/* Header with Title and Status */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg">{project.title}</h3>
                                {project.status && (
                                  <Badge className="gradient-label flex items-center gap-1">
                                    {String(project.status).toLowerCase() === 'shipped' ? (
                                      <CheckCircle className="h-3 w-3" />
                                    ) : (
                                      <Clock className="h-3 w-3" />
                                    )}
                                    {project.status}
                                  </Badge>
                                )}
                              </div>
                              {project.summary && (
                                <p className="text-sm text-muted-foreground italic">{project.summary}</p>
                              )}
                            </div>
                          </div>

                          {/* Problem and Solution */}
                          <div className="space-y-3 mb-4">
                            {project.problem && (
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Problem</h4>
                                <p className="text-sm text-foreground">{project.problem}</p>
                              </div>
                            )}
                            {project.built && (
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">What I Built</h4>
                                <p className="text-sm text-foreground">{project.built}</p>
                              </div>
                            )}
                            {project.role && (
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Role</h4>
                                <p className="text-sm font-medium text-foreground">{project.role}</p>
                              </div>
                            )}
                            {!project.problem && !project.built && project.description && (
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</h4>
                                <p className="text-sm text-foreground">{project.description}</p>
                              </div>
                            )}
                          </div>

                          {/* Tech Stack */}
                          {project.techStack && project.techStack.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Tech Stack</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {project.techStack
                                  .flatMap((t) =>
                                    String(t)
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  )
                                  .map((tech, techIndex) => (
                                    <Badge key={`${tech}-${techIndex}`} className="gradient-label text-xs px-2 py-0.5">
                                      {tech}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Proof Links */}
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Proof</h4>
                            <div className="flex flex-wrap gap-2">
                              {project.proofLinks?.github && (
                                <Button asChild variant="outline" size="sm">
                                  <a
                                    href={project.proofLinks.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5"
                                  >
                                    <Github className="h-3.5 w-3.5" />
                                    GitHub
                                  </a>
                                </Button>
                              )}
                              {project.proofLinks?.demo && (
                                <Button asChild variant="outline" size="sm">
                                  <a
                                    href={project.proofLinks.demo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Live Demo
                                  </a>
                                </Button>
                              )}
                              {project.proofLinks?.video && (
                                <Button asChild variant="outline" size="sm">
                                  <a
                                    href={project.proofLinks.video}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5"
                                  >
                                    <PlayCircle className="h-3.5 w-3.5" />
                                    Video
                                  </a>
                                </Button>
                              )}
                              {!!project.proofLinks?.screenshots?.length && (
                                <Button asChild variant="outline" size="sm">
                                  <a
                                    href={project.proofLinks.screenshots[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5"
                                  >
                                    <Image className="h-3.5 w-3.5" />
                                    Screenshots
                                  </a>
                                </Button>
                              )}
                              {!project.proofLinks?.github && !project.proofLinks?.demo && !project.proofLinks?.video && project.link && (
                                <Button asChild variant="outline" size="sm">
                                  <a
                                    href={project.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Link
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experience Section */}
              {profile.experience && profile.experience.length > 0 && (
                <Card className="gradient-mesh-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profile.experience.map((exp, index) => (
                        <div
                          key={exp.id || index}
                          className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{exp.position}</h3>
                            <p className="text-sm text-muted-foreground">{exp.company}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 mt-1">
                            <span className="gradient-link-text">{exp.startDate} - {exp.endDate || 'Present'}</span>
                          </p>
                          {exp.description && (
                            <p className="text-foreground/90">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Info */}
            <div className="space-y-6">
              {/* View Resume Section */}
              {profile.resumeUrl && (
                <Card className="gradient-mesh-card">
                  <CardContent className="pt-6">
                    <Button asChild className="w-full" variant="outline">
                      <a
                        href={profile.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        View Resume
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Availability Section */}
              {profile.availability &&
                (profile.availability.openToCollaboration ||
                  profile.availability.openToInternships ||
                  profile.availability.openToFreelance ||
                  profile.availability.justBuilding) && (
                <Card className="gradient-mesh-card">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {profile.availability.openToCollaboration && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Open to collaboration</span>
                        </div>
                      )}
                      {profile.availability.openToInternships && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Open to internships</span>
                        </div>
                      )}
                      {profile.availability.openToFreelance && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Open to freelance</span>
                        </div>
                      )}
                      {profile.availability.justBuilding && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Just building</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Education Section */}
              {profile.education && profile.education.length > 0 && (
                <Card className="gradient-mesh-card">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.education.map((edu, index) => (
                      <div key={edu.id || index} className="space-y-1">
                        <h4 className="font-semibold text-sm">{edu.school}</h4>
                        <p className="text-sm text-foreground/90">
                          {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                        </p>
                        <div className="flex justify-between items-center text-xs">
                          {edu.cgpa ? (
                            <span className="gradient-link-text">CGPA: {edu.cgpa}</span>
                          ) : (
                            <span></span>
                          )}
                          <span className="gradient-link-text">{edu.startYear} - {edu.endYear || 'Present'}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Contact / basics */}
              <Card className="gradient-mesh-card">
                <CardContent className="pt-6 space-y-4">
                  {/* Location */}
                  {!!profile.location && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Location</h3>
                      <div className="flex items-center gap-2 text-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {profile.website && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Website</h3>
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 gradient-link-text hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        <span className="truncate">{profile.website}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* Portfolio (GitHub) */}
                  {profile.github && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Portfolio</h3>
                      <a
                        href={profile.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 gradient-link-text hover:underline"
                      >
                        <Briefcase className="h-4 w-4" />
                        <span className="truncate">@{profile.github.split('/').pop()}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* Email */}
                  {!!profile.email && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Email</h3>
                      <p className="flex items-center gap-2 gradient-link-text">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{profile.email}</span>
                      </p>
                    </div>
                  )}

                </CardContent>
              </Card>

              {/* Social Media Links */}
              {(profile.linkedin || profile.github || profile.twitter) && (
                <Card className="gradient-mesh-card">
                  <CardHeader>
                    <CardTitle className="text-base">Social Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* LinkedIn */}
                    {profile.linkedin && (
                      <a
                        href={profile.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-foreground hover:text-primary transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center">
                          <Linkedin className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">LinkedIn</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {profile.linkedin.replace('https://', '').replace('http://', '')}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}

                    {/* GitHub */}
                    {profile.github && (
                      <a
                        href={profile.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-foreground hover:text-primary transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#181717] dark:bg-white flex items-center justify-center">
                          <Github className="h-5 w-5 text-white dark:text-black" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">GitHub</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {profile.github.replace('https://', '').replace('http://', '')}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}

                    {/* Twitter */}
                    {profile.twitter && (
                      <a
                        href={profile.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-foreground hover:text-primary transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#1DA1F2] flex items-center justify-center">
                          <Twitter className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">Twitter</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {profile.twitter.replace('https://', '').replace('http://', '')}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Languages Section */}
              {profile.languages && profile.languages.length > 0 && (
                <Card className="gradient-mesh-card">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      Languages
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {profile.languages.map((lang, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{lang.language}</span>
                        <Badge className="gradient-label">{lang.proficiency}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Empty State */}
          {isOwnProfile && !profile.skills?.length && !profile.projects?.length && !profile.bio && (
            <Card className="gradient-mesh-card mt-6">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">Your profile is empty. Add some information about yourself!</p>
                <Button onClick={() => setShowEditDialog(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {isOwnProfile && (
        <EditProfileDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          profile={profile}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
}
