import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { User, Lock, Save, Camera } from 'lucide-react';

export default function Profile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile State
    const [fullName, setFullName] = useState('');
    const [fpt_student_code, setfpt_student_code] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || '');
            setfpt_student_code(user.user_metadata?.fpt_student_code || '');
            setAvatarUrl(user.user_metadata?.avatar_url || '');
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            setMessage(null);

            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    fpt_student_code: fpt_student_code,
                    avatar_url: avatarUrl
                }
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        try {
            setLoading(true);
            setMessage(null);

            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>

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
                                    type="text"
                                    className="hidden"
                                    // For now, we'll just use a text input for URL or handle file upload later if bucket exists
                                    // This is a placeholder for the file input logic
                                    onChange={(e) => console.log('File upload not implemented yet')}
                                />
                            </label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Avatar URL (Optional)
                        </p>
                        <Input
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://example.com/avatar.jpg"
                            className="mt-2"
                        />
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
                                value={fpt_student_code}
                                onChange={(e) => setfpt_student_code(e.target.value)}
                                placeholder="Enter your student ID"
                            />
                        </div>

                        <Button onClick={handleUpdateProfile} disabled={loading} className="w-full">
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
