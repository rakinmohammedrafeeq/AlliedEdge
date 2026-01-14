import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile, Project, Language, Education, Experience, ProjectProofLinkKey } from '@/lib/api';
import { profileApi } from '@/lib/api';
import { Loader2, Plus, X, Trash2, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  onProfileUpdated,
}: EditProfileDialogProps) {
  const [username, setUsername] = useState(profile.username || '');
  const [displayName, setDisplayName] = useState(profile.name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [location, setLocation] = useState(profile.location || '');
  const [linkedin, setLinkedin] = useState(profile.linkedin || '');
  const [github, setGithub] = useState(profile.github || '');
  const [twitter, setTwitter] = useState(profile.twitter || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [resumeUrl] = useState(profile.resumeUrl || '');
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [projects, setProjects] = useState<Project[]>(profile.projects || []);
  const [experience, setExperience] = useState<Experience[]>(profile.experience || []);
  const [languages, setLanguages] = useState<Language[]>(profile.languages || []);
  const [education, setEducation] = useState<Education[]>(profile.education || []);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [removeResume, setRemoveResume] = useState(false);
  const [availability, setAvailability] = useState({
    openToCollaboration: profile.availability?.openToCollaboration || false,
    openToInternships: profile.availability?.openToInternships || false,
    openToFreelance: profile.availability?.openToFreelance || false,
    justBuilding: profile.availability?.justBuilding || false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [removeBannerImage, setRemoveBannerImage] = useState(false);
  const [showEmailOnProfile, setShowEmailOnProfile] = useState<boolean>(Boolean(profile.showEmailOnProfile));
  const [showResumeOnProfile, setShowResumeOnProfile] = useState<boolean>(Boolean(profile.showResumeOnProfile));

  useEffect(() => {
    setShowEmailOnProfile(Boolean(profile.showEmailOnProfile));
    setShowResumeOnProfile(Boolean(profile.showResumeOnProfile));
  }, [profile.showEmailOnProfile, profile.showResumeOnProfile]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleAddProject = () => {
    setProjects([...projects, {
      title: '',
      summary: '',
      status: 'Building',
      problem: '',
      built: '',
      role: '',
      techStack: [],
      proofLinks: {}
    }]);
  };

  const handleUpdateProject = (index: number, field: keyof Project, value: string | string[] | Project['proofLinks'] | Project['status']) => {
    const updatedProjects = [...projects];
    updatedProjects[index] = { ...updatedProjects[index], [field]: value };
    setProjects(updatedProjects);
  };

  const handleUpdateProjectTechStack = (index: number, techStack: string) => {
    const updatedProjects = [...projects];
    updatedProjects[index] = {
      ...updatedProjects[index],
      techStack: techStack.split(',').map(s => s.trim()).filter(Boolean)
    };
    setProjects(updatedProjects);
  };

  const handleUpdateProjectProofLink = (
    index: number,
    linkType: ProjectProofLinkKey,
    value: string,
  ) => {
    const updatedProjects = [...projects];
    const existingLinks = updatedProjects[index].proofLinks ?? {};
    updatedProjects[index] = {
      ...updatedProjects[index],
      proofLinks: {
        ...existingLinks,
        [linkType]: value || undefined,
      },
    };
    setProjects(updatedProjects);
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleAddExperience = () => {
    setExperience([...experience, { company: '', position: '', startDate: '', endDate: '', description: '' }]);
  };

  const handleRemoveExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const handleExperienceChange = (index: number, field: keyof Experience, value: string) => {
    const updatedExperience = [...experience];
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    setExperience(updatedExperience);
  };

  const handleAddLanguage = () => {
    setLanguages([...languages, { language: '', proficiency: 'Basic' }]);
  };

  const handleRemoveLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const handleLanguageChange = (index: number, field: keyof Language, value: string) => {
    const updatedLanguages = [...languages];
    updatedLanguages[index] = { ...updatedLanguages[index], [field]: value };
    setLanguages(updatedLanguages);
  };

  const handleAddEducation = () => {
    setEducation([...education, { school: '', degree: '', field: '', startYear: '', endYear: '', cgpa: '' }]);
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const handleEducationChange = (index: number, field: keyof Education, value: string) => {
    const updatedEducation = [...education];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    setEducation(updatedEducation);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Allowed: JPG, JPEG, PNG, WEBP');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setRemoveProfileImage(false);
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Allowed: JPG, JPEG, PNG, WEBP');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setRemoveBannerImage(false);
      setBannerImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Invalid file type. Only PDF files are allowed');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setResumeFile(file);
      setResumeFileName(file.name);
      toast.success('Resume selected. Save changes to upload.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validProjects = projects.filter((p) =>
      p.title.trim() &&
      (p.summary ?? '').trim() &&
      (p.problem ?? '').trim() &&
      (p.built ?? '').trim() &&
      (p.role ?? '').trim() &&
      (p.techStack ?? []).length > 0 &&
      (((p.proofLinks ?? {}).github) || ((p.proofLinks ?? {}).demo) || ((p.proofLinks ?? {}).video))
    );

    try {
      setIsSubmitting(true);
      const validExperience = experience.filter((exp) => exp.company.trim() && exp.position.trim() && exp.startDate.trim());
      const validLanguages = languages.filter((lang) => lang.language.trim());
      const validEducation = education.filter((edu) => {
        const school = (edu.school ?? '').trim();
        const degree = (edu.degree ?? '').trim();
        return Boolean(school || degree);
      });

      // 1) Save profile fields (including images/JSON sections)
      await profileApi.update({
        username: username.trim() || undefined,
        name: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        github: github.trim() || undefined,
        twitter: twitter.trim() || undefined,
        website: website.trim() || undefined,
        resumeUrl: resumeUrl.trim() || undefined,
        skills,
        projects: validProjects,
        experience: validExperience,
        languages: validLanguages,
        education: validEducation,
        availability,
        showEmailOnProfile,
        showResumeOnProfile,
        // uploads
        profileImageFile: removeProfileImage ? null : profileImageFile,
        bannerImageFile: removeBannerImage ? null : bannerImageFile,
        removeProfileImage,
        removeBannerImage,
      });

      // 2) If a resume was selected, upload it
      if (resumeFile) {
        await profileApi.uploadResume(resumeFile);
      }

      // 2b) Or, if user requested removal (and didn't upload a replacement), delete it
      if (removeResume && !resumeFile) {
        await profileApi.deleteResume();
      }

      // 3) Re-fetch so we get the latest resumeUrl and server-computed fields
      const refreshed = await profileApi.get();
      onProfileUpdated(refreshed);

      // Clean local selection after successful upload
      if (resumeFile) {
        setResumeFile(null);
        // keep resumeFileName so user sees confirmation; Profile page will show "View Resume".
      }

      if (removeResume) {
        setRemoveResume(false);
        setResumeFileName(null);
        setResumeFile(null);
      }

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Banner Image Upload */}
            <div className="space-y-3">
              <Label>Banner Image</Label>
              <div className="space-y-3">
                {/* Banner Preview */}
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                  {bannerImagePreview ? (
                    <img src={bannerImagePreview} alt="Banner preview" className="w-full h-full object-cover" />
                  ) : (
                    <img src={profile.bannerImage || '/default-banner.png'} alt="Banner" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Upload Button */}
                  <Label htmlFor="bannerImage" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors w-fit">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Upload Banner</span>
                    </div>
                    <Input
                      id="bannerImage"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                  </Label>

                  {/* Remove Banner */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRemoveBannerImage(true);
                      setBannerImageFile(null);
                      setBannerImagePreview(null);
                    }}
                    disabled={!profile.bannerImage && !bannerImagePreview && !bannerImageFile}
                  >
                    Remove Banner
                  </Button>

                  {removeBannerImage && (
                    <Badge variant="secondary">Will remove on save</Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Recommended size: 1500x500px. JPG, JPEG, PNG or WEBP. Max 5MB.
                </p>
              </div>
            </div>

            {/* Profile Image Upload */}
            <div className="space-y-3">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileImagePreview || profile.avatar} />
                  <AvatarFallback className="text-2xl">
                    {profile.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Label htmlFor="profileImage" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors w-fit">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Upload Photo</span>
                      </div>
                      <Input
                        id="profileImage"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </Label>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setRemoveProfileImage(true);
                        setProfileImageFile(null);
                        setProfileImagePreview(null);
                      }}
                      disabled={!profile.avatar && !profileImagePreview && !profileImageFile}
                    >
                      Remove Photo
                    </Button>

                    {removeProfileImage && (
                      <Badge variant="secondary">Will remove on save</Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    JPG, JPEG, PNG or WEBP. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
              />
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px] resize-none"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bangalore, India"
              />
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex gap-2">
                <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                />
                <Button type="button" onClick={handleAddSkill} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {skill}
                          <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-2 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                    ))}
                  </div>
              )}
            </div>

            {/* Projects */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Projects</Label>
                <Button type="button" onClick={handleAddProject} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
              </div>

              {projects.length > 0 && (
                  <div className="space-y-4 mt-2">
                    {projects.map((project, index) => (
                        <div key={index} className="border border-border/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-sm">Project {index + 1}</h4>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveProject(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {/* Title and Summary */}
                            <Input
                                value={project.title}
                                onChange={(e) => handleUpdateProject(index, 'title', e.target.value)}
                                placeholder="Project title"
                            />
                            <Input
                                value={project.summary}
                                onChange={(e) => handleUpdateProject(index, 'summary', e.target.value)}
                                placeholder="One-line summary"
                            />

                            {/* Status */}
                            <Select
                                value={project.status}
                                onValueChange={(value) => handleUpdateProject(index, 'status', value as 'Building' | 'Shipped')}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Building">Building</SelectItem>
                                <SelectItem value="Shipped">Shipped</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Problem */}
                            <Textarea
                                value={project.problem}
                                onChange={(e) => handleUpdateProject(index, 'problem', e.target.value)}
                                placeholder="Problem it solves"
                                className="min-h-[60px] resize-none"
                            />

                            {/* What I Built */}
                            <Textarea
                                value={project.built}
                                onChange={(e) => handleUpdateProject(index, 'built', e.target.value)}
                                placeholder="What you actually built"
                                className="min-h-[60px] resize-none"
                            />

                            {/* Role */}
                            <Input
                                value={project.role}
                                onChange={(e) => handleUpdateProject(index, 'role', e.target.value)}
                                placeholder="Your role (e.g., Full-stack Developer)"
                            />

                            {/* Tech Stack */}
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase">Tech Stack</Label>
                              <div className="flex flex-wrap gap-2">
                                {(project.techStack ?? []).map((tech, techIndex) => (
                                  <Badge key={techIndex} variant="secondary" className="px-3 py-1">
                                    {tech}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = [...(project.techStack ?? [])].filter((_, i) => i !== techIndex);
                                        handleUpdateProject(index, 'techStack', next);
                                      }}
                                      className="ml-2 hover:text-destructive"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>

                              <div className="flex gap-2">
                                <Input
                                  value={(project as any).__newTech ?? ''}
                                  onChange={(e) => {
                                    const updatedProjects = [...projects];
                                    (updatedProjects[index] as any).__newTech = e.target.value;
                                    setProjects(updatedProjects);
                                  }}
                                  placeholder="Add tech (e.g., React)"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    const updatedProjects = [...projects];
                                    const p: any = updatedProjects[index];
                                    const raw = String(p.__newTech ?? '').trim();
                                    if (!raw) return;

                                    // allow comma-separated paste
                                    const additions = raw
                                      .split(',')
                                      .map((s: string) => s.trim())
                                      .filter(Boolean);

                                    const existing = (p.techStack ?? []) as string[];
                                    const merged = [...existing];
                                    for (const a of additions) {
                                      if (!merged.includes(a)) merged.push(a);
                                    }

                                    p.techStack = merged;
                                    p.__newTech = '';
                                    setProjects(updatedProjects);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Proof Links */}
                            <div className="space-y-2 pt-2 border-t">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase">Proof Links</Label>
                              <Input
                                  value={(project.proofLinks?.github ?? '')}
                                  onChange={(e) => handleUpdateProjectProofLink(index, 'github', e.target.value)}
                                  placeholder="GitHub URL (optional)"
                                  type="url"
                              />
                              <Input
                                  value={(project.proofLinks?.demo ?? '')}
                                  onChange={(e) => handleUpdateProjectProofLink(index, 'demo', e.target.value)}
                                  placeholder="Live Demo URL (optional)"
                                  type="url"
                              />
                              <Input
                                  value={(project.proofLinks?.video ?? '')}
                                  onChange={(e) => handleUpdateProjectProofLink(index, 'video', e.target.value)}
                                  placeholder="Video URL (optional)"
                                  type="url"
                              />
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Experience</Label>
                <Button type="button" onClick={handleAddExperience} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Experience
                </Button>
              </div>

              {experience.length > 0 && (
                  <div className="space-y-4 mt-2">
                    {experience.map((exp, index) => (
                        <div key={index} className="border border-border/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <Input
                                  value={exp.position}
                                  onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                                  placeholder="Position/Job title"
                              />
                              <Input
                                  value={exp.company}
                                  onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                                  placeholder="Company name"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                    value={exp.startDate}
                                    onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                                    placeholder="Start date (e.g., 2020)"
                                />
                                <Input
                                    value={exp.endDate || ''}
                                    onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                                    placeholder="End date (or leave blank)"
                                />
                              </div>
                              <Textarea
                                  value={exp.description || ''}
                                  onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                                  placeholder="Job description (optional)"
                                  className="min-h-[80px] resize-none"
                              />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveExperience(index)}
                                className="ml-2"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                  id="linkedin"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  type="url"
              />
            </div>

            {/* GitHub */}
            <div className="space-y-2">
              <Label htmlFor="github">GitHub URL</Label>
              <Input
                  id="github"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/yourusername"
                  type="url"
              />
            </div>

            {/* Twitter */}
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter URL</Label>
              <Input
                  id="twitter"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://twitter.com/yourusername"
                  type="url"
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  type="url"
              />
            </div>

            {/* Resume Upload */}
            <div className="space-y-3">
              <Label>Resume (PDF only)</Label>
              <div className="space-y-3">
                {/* Current Resume or Upload Status */}
                {(resumeFileName || profile.resumeUrl) && (
                  <div className="flex items-center gap-2 p-3 border border-border rounded-md bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1 truncate">
                      {resumeFileName || 'Current resume uploaded'}
                    </span>
                    {resumeFileName && (
                      <button
                        type="button"
                        onClick={() => {
                          setResumeFileName(null);
                          setResumeFile(null);
                        }}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Remove current resume */}
                {profile.resumeUrl && !resumeFileName && (
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setRemoveResume((v) => !v);
                        // If user chooses to remove, clear any selected replacement
                        setResumeFileName(null);
                        setResumeFile(null);
                      }}
                    >
                      {removeResume ? 'Undo remove resume' : 'Remove current resume'}
                    </Button>
                    {removeResume && (
                      <Badge variant="secondary">Will remove on save</Badge>
                    )}
                  </div>
                )}

                {/* Upload Button */}
                <Label htmlFor="resumeFile" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors w-fit">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">{resumeFileName ? 'Change Resume' : 'Upload Resume'}</span>
                  </div>
                  <Input
                      id="resumeFile"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        setRemoveResume(false);
                        handleResumeChange(e);
                      }}
                      className="hidden"
                  />
                </Label>
                <p className="text-xs text-muted-foreground">
                  PDF only. Max 10MB.
                </p>
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Languages</Label>
                <Button type="button" onClick={handleAddLanguage} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Language
                </Button>
              </div>

              {languages.length > 0 && (
                  <div className="space-y-3 mt-2">
                    {languages.map((lang, index) => (
                        <div key={index} className="border border-border/50 rounded-lg p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                  value={lang.language}
                                  onChange={(e) => handleLanguageChange(index, 'language', e.target.value)}
                                  placeholder="Language name (e.g., English)"
                              />
                              <Select
                                  value={lang.proficiency}
                                  onValueChange={(value) => handleLanguageChange(index, 'proficiency', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select proficiency" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Native">Native</SelectItem>
                                  <SelectItem value="Fluent">Fluent</SelectItem>
                                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                                  <SelectItem value="Basic">Basic</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveLanguage(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>

            {/* Education */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Education</Label>
                <Button type="button" onClick={handleAddEducation} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Education
                </Button>
              </div>

              {education.length > 0 && (
                  <div className="space-y-4 mt-2">
                    {education.map((edu, index) => (
                        <div key={index} className="border border-border/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <Input
                                  value={edu.school}
                                  onChange={(e) => handleEducationChange(index, 'school', e.target.value)}
                                  placeholder="School/University name"
                              />
                              <Input
                                  value={edu.degree}
                                  onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                                  placeholder="Degree (e.g., Bachelor of Science)"
                              />
                              <Input
                                  value={edu.field || ''}
                                  onChange={(e) => handleEducationChange(index, 'field', e.target.value)}
                                  placeholder="Field of study (optional)"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                    value={edu.startYear}
                                    onChange={(e) => handleEducationChange(index, 'startYear', e.target.value)}
                                    placeholder="Start year (e.g., 2020)"
                                />
                                <Input
                                    value={edu.endYear || ''}
                                    onChange={(e) => handleEducationChange(index, 'endYear', e.target.value)}
                                    placeholder="End year (or leave blank)"
                                />
                              </div>
                              <Input
                                  value={edu.cgpa || ''}
                                  onChange={(e) => handleEducationChange(index, 'cgpa', e.target.value)}
                                  placeholder="CGPA/GPA (optional, e.g., 3.8)"
                              />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveEducation(index)}
                                className="ml-2"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>

            {/* Availability Section */}
            <div className="space-y-3">
              <Label className="text-base">Availability / Intent</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                      id="openToCollaboration"
                      checked={availability.openToCollaboration}
                      onCheckedChange={(checked) =>
                          setAvailability({ ...availability, openToCollaboration: !!checked })
                      }
                  />
                  <label
                      htmlFor="openToCollaboration"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Open to collaboration
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                      id="openToInternships"
                      checked={availability.openToInternships}
                      onCheckedChange={(checked) =>
                          setAvailability({ ...availability, openToInternships: !!checked })
                      }
                  />
                  <label
                      htmlFor="openToInternships"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Open to internships
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                      id="openToFreelance"
                      checked={availability.openToFreelance}
                      onCheckedChange={(checked) =>
                          setAvailability({ ...availability, openToFreelance: !!checked })
                      }
                  />
                  <label
                      htmlFor="openToFreelance"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Open to freelance
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                      id="justBuilding"
                      checked={availability.justBuilding}
                      onCheckedChange={(checked) =>
                          setAvailability({ ...availability, justBuilding: !!checked })
                      }
                  />
                  <label
                      htmlFor="justBuilding"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Just building
                  </label>
                </div>
              </div>
            </div>

            {/* Public profile visibility */}
            <div className="space-y-3">
              <Label className="text-base">Public Profile Visibility</Label>
              <p className="text-xs text-muted-foreground">
                These settings control what appears on your shareable profile link (e.g. /u/{profile.username || 'username'}).
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showEmailOnProfile"
                    checked={showEmailOnProfile}
                    onCheckedChange={(checked) => setShowEmailOnProfile(!!checked)}
                  />
                  <label
                    htmlFor="showEmailOnProfile"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Show my email on public profile
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showResumeOnProfile"
                    checked={showResumeOnProfile}
                    onCheckedChange={(checked) => setShowResumeOnProfile(!!checked)}
                  />
                  <label
                    htmlFor="showResumeOnProfile"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Show my resume on public profile
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                ) : (
                    'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
}

