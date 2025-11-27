import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { KeyRound, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Check your email for the password reset link.',
            });
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'An error occurred. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border shadow-lg">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <KeyRound className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Forgot password?</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        No worries, we'll send you reset instructions.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                            Email address
                        </label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="student@fpt.edu.vn"
                        />
                    </div>

                    {message && (
                        <div className={`text-sm p-3 rounded-md ${message.type === 'success'
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-destructive/10 text-destructive'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Sending link...' : 'Send Reset Link'}
                    </Button>

                    <div className="text-center">
                        <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to log in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
