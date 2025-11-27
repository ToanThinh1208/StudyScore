import { supabase } from './supabase';

export interface PasswordUpdateResult {
    success: boolean;
    message: string;
}

export const updateUserPassword = async (password: string, confirmPassword: string): Promise<PasswordUpdateResult> => {
    if (password !== confirmPassword) {
        return { success: false, message: 'Passwords do not match' };
    }

    if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
    }

    try {
        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) throw error;

        return { success: true, message: 'Password updated successfully!' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to update password.' };
    }
};
