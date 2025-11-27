import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GraduationCap } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border shadow-lg">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Sign in to your GPA Manager account
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
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
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-primary hover:text-primary/80"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </Button>

                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">Don't have an account? </span>
                        <Link to="/register" className="font-medium text-primary hover:text-primary/80">
                            Register here
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
