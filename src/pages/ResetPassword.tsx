import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const navigate = useNavigate();

    // Check if we have a session (user clicked the email link)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If no session, they might have clicked a link but it expired or something.
                // However, the magic link should log them in. 
                // If they are not logged in, they can't reset password this way usually.
                // But let's allow them to try if the recovery token is in the URL hash (Supabase handles this).
            }
        };
        checkSession();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Password updated successfully!',
            });

            // Redirect to login after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Failed to update password.',
            });
        } finally {
            setLoading(false);
        }
    };

    if (message?.type === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md text-center space-y-6 bg-card p-8 rounded-xl border border-border shadow-lg">
                    <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Password Reset Complete</h2>
                    <p className="text-muted-foreground">
                        Your password has been successfully updated. You will be redirected to the login page shortly.
                    </p>
                    <Button onClick={() => navigate('/login')} className="w-full">
                        Return to Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border shadow-lg">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Set new password</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Please enter your new password below.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleUpdatePassword}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                                New Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
                                Confirm New Password
                            </label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                    </div>

                    {message && message.type === 'error' && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            {message.text}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
