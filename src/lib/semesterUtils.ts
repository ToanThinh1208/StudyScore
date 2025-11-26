import { supabase } from './supabase';

export const updateSemesterOrder = async (semesters: { id: string; index_order: number }[]) => {
    try {
        const updates = semesters.map(({ id, index_order }) =>
            supabase
                .from('semesters')
                .update({ index_order })
                .eq('id', id)
        );

        await Promise.all(updates);
        return true;
    } catch (error) {
        console.error('Error updating semester order:', error);
        return false;
    }
};
