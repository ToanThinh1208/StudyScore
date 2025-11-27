import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { updateUserPassword } from '../lib/authUtils';
import { User, Lock, Save, Camera, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile State
    const [fullName, setFullName] = useState('');
    const [fptStudentCode, setFptStudentCode] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || '');
            setFptStudentCode(user.user_metadata?.fpt_student_code || '');
            setAvatarUrl(user.user_metadata?.avatar_url || '');

            // Also fetch from profiles table to be sure
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, fpt_student_code, avatar_url')
                .eq('id', user?.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
                return;
            }

            if (data) {
                setFullName(data.full_name || '');
                setFptStudentCode(data.fpt_student_code || '');
                if (data.avatar_url) setAvatarUrl(data.avatar_url);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setMessage(null);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
            setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            setMessage(null);

            const updates = {
                id: user?.id,
                full_name: fullName,
                fpt_student_code: fptStudentCode,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            };

            // 1. Update profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert(updates);

            if (profileError) throw profileError;

            // 2. Update auth.users metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    fpt_student_code: fptStudentCode,
                    avatar_url: avatarUrl
                }
            });

            if (authError) throw authError;

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        setLoading(true);
        setMessage(null);

        const result = await updateUserPassword(newPassword, confirmPassword);

        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setMessage({ type: 'error', text: result.message });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/')} className="p-2">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
                </div>

                {message && (
                    <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                {/* Public Profile Section */}
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold text-foreground">Public Profile</h2>
                    </div>

                    <div className="flex flex-col items-center mb-6">
                        <div className="relative w-24 h-24 mb-4">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-md">
                                <img
                                    src={avatarUrl || "/avatar-mac-dinh-4-2.jpg"}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-sm">
                                <Camera className="w-4 h-4" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={uploadAvatar}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {uploading ? 'Uploading...' : 'Click camera icon to change avatar'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">Email</label>
                            <Input
                                value={user?.email || ''}
                                disabled
                                className="bg-muted text-muted-foreground"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">Full Name</label>
                            <Input
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">Student ID (fpt_student_code)</label>
                            <Input
                                value={fptStudentCode}
                                onChange={(e) => setFptStudentCode(e.target.value)}
                                placeholder="Enter your student ID"
                            />
                        </div>

                        <Button onClick={handleUpdateProfile} disabled={loading || uploading} className="w-full">
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold text-foreground">Security</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">New Password</label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">Confirm New Password</label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                            />
                        </div>

                        <Button onClick={handleUpdatePassword} disabled={loading} variant="outline" className="w-full">
                            {loading ? 'Updating...' : 'Update Password'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
