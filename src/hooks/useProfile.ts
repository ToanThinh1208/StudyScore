import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface ProfileData {
    id: string;
    full_name: string | null;
    fpt_student_code: string | null;
    avatar_url: string | null;
    updated_at: string | null;
}

export function useProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                // If profile doesn't exist, we might want to create it or just return null
                // For now, let's just log it and potentially fallback to user_metadata in the UI if needed
                // But the goal is to use profiles, so we should probably ensure it exists.
                if (error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
                    console.error('Error fetching profile:', error);
                    setError(error.message);
                }
            }

            if (data) {
                setProfile(data);
            } else {
                // Fallback to user metadata if profile record doesn't exist yet
                // This helps with the transition or if the trigger failed
                setProfile({
                    id: user.id,
                    full_name: user.user_metadata?.full_name || null,
                    fpt_student_code: user.user_metadata?.fpt_student_code || null,
                    avatar_url: user.user_metadata?.avatar_url || null,
                    updated_at: new Date().toISOString()
                });
            }
        } catch (err: any) {
            console.error('Error in useProfile:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();

        if (!user) return;

        // Subscribe to realtime changes
        const channel = supabase
            .channel(`public:profiles:id=eq.${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${user.id}`
            }, (payload) => {
                // console.log('Profile updated:', payload);
                if (payload.eventType === 'DELETE') {
                    setProfile(null);
                } else {
                    setProfile(payload.new as ProfileData);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return { profile, loading, error, refetch: fetchProfile };
}
