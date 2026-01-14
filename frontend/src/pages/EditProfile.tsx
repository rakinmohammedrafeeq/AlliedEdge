import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { DefaultAvatarFallback } from '@/components/DefaultAvatarFallback';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuthContext();

  const [formData, setFormData] = useState({
    username: user?.username || '',
    displayName: user?.name || '',
    bio: '',
    linkedin: '',
    github: '',
    website: '',
    profilePhoto: user?.avatar || '',
  });
  
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    profileImage: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({
          ...errors,
          profileImage: 'Invalid file type. Allowed: JPG, JPEG, PNG, WEBP',
        });
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setErrors({
          ...errors,
          profileImage: 'File size must be less than 2MB',
        });
        return;
      }
      
      setProfileImageFile(file);
      setErrors({ ...errors, profileImage: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ username: '', profileImage: '' });

    const usernamePattern = /^[A-Za-z0-9._-]{3,30}$/;
    if (!usernamePattern.test(formData.username)) {
      setErrors({
        ...errors,
        username: 'Username must be 3-30 characters and contain only letters, numbers, dots, underscores, and hyphens',
      });
      return;
    }

    if (formData.username.includes('@')) {
      setErrors({
        ...errors,
        username: 'Username cannot be an email address',
      });
      return;
    }

    const data = new FormData();
    data.append('username', formData.username);
    data.append('displayName', formData.displayName);
    data.append('bio', formData.bio);
    data.append('linkedin', formData.linkedin);
    data.append('github', formData.github);
    data.append('website', formData.website);
    data.append('removeProfileImage', String(removeProfileImage));

    if (profileImageFile) {
      data.append('profileImageFile', profileImageFile);
    }

    try {
      // Backend expects multipart/form-data via @RequestParam
      await apiClient('/profile', { method: 'PUT', body: data });

      // Refresh the authenticated user from /auth/status so navbar gets the new avatar.
      await checkAuth();

      toast.success('Profile updated');
      navigate('/profile');
    } catch (err) {
      console.error('Failed to update profile:', err);

      if (err instanceof ApiError) {
        // If backend returns field-specific error (e.g., username), respect it.
        if (err.message.toLowerCase().includes('username')) {
          setErrors({ ...errors, username: err.message });
        } else {
          toast.error(err.message || 'Failed to update profile');
        }
      } else {
        toast.error('Failed to update profile');
      }
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen pb-8">
        <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Edit Profile</h1>
          <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </div>

        <Card className="gradient-mesh-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <Label className="block mb-3 text-base font-semibold">Current Profile Image</Label>
              <div className="inline-block">
                <Avatar className="w-24 h-24 border-2 border-gray-200">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    <DefaultAvatarFallback alt={user?.name || 'Default profile image'} />
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div>
              <Label htmlFor="profileImageFile" className="text-base font-semibold mb-2">
                Upload New Profile Image
              </Label>
              <Input
                id="profileImageFile"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                className="mt-2"
              />
              <div className="text-sm text-gray-600 mt-2">
                Allowed types: JPG, JPEG, PNG, WEBP. Max size ~2MB.
              </div>
              {errors.profileImage && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  {errors.profileImage}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="removeProfileImage"
                checked={removeProfileImage}
                onCheckedChange={(checked) => setRemoveProfileImage(checked as boolean)}
              />
              <Label htmlFor="removeProfileImage" className="cursor-pointer">
                Remove current profile image
              </Label>
            </div>

            <div>
              <Label className="text-base font-semibold mb-2">Email (readonly)</Label>
              <Input
                type="email"
                value={user?.email || ''}
                readOnly
                className="mt-2 bg-gray-50"
              />
            </div>

            <div>
              <Label htmlFor="username" className="text-base font-semibold mb-2">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                minLength={3}
                maxLength={30}
                pattern="^[A-Za-z0-9._-]{3,30}$"
                required
                className="mt-2"
              />
              <div className="text-sm text-gray-600 mt-2">
                3–30 characters. Allowed: letters, numbers, dots, underscores, hyphens. Cannot be an email address.
              </div>
              {errors.username && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  {errors.username}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="displayName" className="text-base font-semibold mb-2">
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                maxLength={100}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="bio" className="text-base font-semibold mb-2">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                maxLength={512}
                rows={3}
                className="mt-2"
              />
              <div className="text-sm text-gray-600 mt-2">Max 512 characters.</div>
            </div>

            <div>
              <Label htmlFor="linkedin" className="text-base font-semibold mb-2">
                LinkedIn URL
              </Label>
              <Input
                id="linkedin"
                type="url"
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="github" className="text-base font-semibold mb-2">
                GitHub URL
              </Label>
              <Input
                id="github"
                type="url"
                value={formData.github}
                onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                placeholder="https://github.com/yourusername"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="website" className="text-base font-semibold mb-2">
                Website
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="profilePhoto" className="text-base font-semibold mb-2">
                Profile Image URL (optional)
              </Label>
              <Input
                id="profilePhoto"
                type="url"
                value={formData.profilePhoto}
                onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="mt-2"
              />
              <div className="text-sm text-gray-600 mt-2">
                Paste a direct image URL (e.g. Cloudinary). Uploaded image will be used in preference.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/profile')}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
        </div>
      </div>
    </>
  );
}
