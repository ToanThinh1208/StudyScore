import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { Plus, TrendingUp, Calculator } from 'lucide-react';
import type { SemesterWithCourses } from '../types';
import { calculateSemesterGPA } from '../lib/gpaUtils';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { updateSemesterOrder } from '../lib/semesterUtils';
import { SortableSemesterItem } from '../components/SortableSemesterItem';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';

export default function Dashboard() {
    const { user, signOut } = useAuth();
    // console.log('User Object:', user);
    // console.log('User Metadata:', user?.user_metadata);
    const navigate = useNavigate();
    const location = useLocation();
    const [semesters, setSemesters] = useState<SemesterWithCourses[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingSemester, setIsAddingSemester] = useState(false);
    const [newSemesterName, setNewSemesterName] = useState('');

    useEffect(() => {
        fetchDashboardData();

        // Refresh data when window/tab regains focus
        const handleFocus = () => {
            fetchDashboardData();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // Refresh when navigating back to dashboard
    useEffect(() => {
        if (location.pathname === '/') {
            fetchDashboardData();
        }
    }, [location.pathname]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('semesters')
                .select(`
                    *,
                    courses:courses (
                        id,
                        name,
                        credit,
                        bonus,
                        is_gpa,
                        components:course_components (
                            score,
                            weight
                        )
                    )
                `)
                .order('index_order', { ascending: true });

            if (error) throw error;

            // Calculate GPAs for each semester
            const processedSemesters = data.map((sem: any) => {
                const { semesterGPA10, semesterGPA4, processedCourses } = calculateSemesterGPA(sem.courses);

                return {
                    ...sem,
                    courses: processedCourses,
                    semesterGPA10,
                    semesterGPA4
                };
            });

            setSemesters(processedSemesters);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSemester = async () => {
        if (!newSemesterName.trim()) return;

        try {
            const maxIndex = semesters.length > 0 ? Math.max(...semesters.map(s => s.index_order)) : 0;

            const { data, error } = await supabase
                .from('semesters')
                .insert([
                    {
                        name: newSemesterName,
                        index_order: maxIndex + 1,
                        user_id: user?.id
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            setSemesters([...semesters, { ...data, courses: [], semesterGPA10: 0, semesterGPA4: 0 }]);
            setNewSemesterName('');
            setIsAddingSemester(false);
        } catch (error) {
            console.error('Error adding semester:', error);
        }
    };

    const handleDeleteSemester = async (semesterId: string) => {
        if (!confirm('Are you sure you want to delete this semester and all its courses?')) return;

        try {
            const { error } = await supabase
                .from('semesters')
                .delete()
                .eq('id', semesterId);

            if (error) throw error;

            setSemesters(semesters.filter(s => s.id !== semesterId));
        } catch (error) {
            console.error('Error deleting semester:', error);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setSemesters((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update index_order for all items
                const updatedItems = newItems.map((item, index) => ({
                    ...item,
                    index_order: index + 1
                }));

                // Persist to database
                updateSemesterOrder(updatedItems.map(s => ({ id: s.id, index_order: s.index_order })));

                return updatedItems;
            });
        }
    };

    const handleMoveSemester = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === semesters.length - 1)
        ) {
            return;
        }

        const newIndex = direction === 'up' ? index - 1 : index + 1;

        setSemesters((items) => {
            const newItems = arrayMove(items, index, newIndex);

            // Update index_order
            const updatedItems = newItems.map((item, idx) => ({
                ...item,
                index_order: idx + 1
            }));

            // Persist
            updateSemesterOrder(updatedItems.map(s => ({ id: s.id, index_order: s.index_order })));

            return updatedItems;
        });
    };

    // Calculate cumulative GPA
    const cumulativeGPA10 = semesters.length > 0
        ? Math.round(semesters.reduce((sum, s) => sum + (s.semesterGPA10 || 0), 0) / semesters.length * 100) / 100
        : 0;

    const totalCredits = semesters.reduce((sum, s) => {
        return sum + s.courses.reduce((cSum, c) => cSum + c.credit, 0);
    }, 0);

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <Dropdown
                            trigger={
                                <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                    <div className="text-right hidden md:block">
                                        <p className="text-sm font-medium text-foreground">{user?.user_metadata?.full_name}</p>
                                        <p className="text-xs text-muted-foreground">Student</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
                                        <img
                                            src="/avatar-mac-dinh-4-2.jpg"
                                            alt="User Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            }
                        >
                            <div className="px-4 py-2 border-b border-border md:hidden">
                                <p className="text-sm font-medium text-foreground truncate">{user?.user_metadata?.full_name}</p>
                            </div>
                            <DropdownItem onClick={() => navigate('/profile')}>
                                Profile
                            </DropdownItem>
                            <DropdownItem onClick={signOut} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                                Logout
                            </DropdownItem>
                        </Dropdown>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-4 mb-8">
                    <Button onClick={() => navigate('/analytics')}>
                        <TrendingUp className="w-4 h-4 mr-2" /> Analytics
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/grade-conversion')}>
                        <Calculator className="w-4 h-4 mr-2" /> Grade Conversion
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                        <h3 className="text-lg font-medium text-foreground mb-2">Latest Semester GPA</h3>
                        <p className="text-3xl font-bold text-primary">
                            {semesters.length > 0 ? semesters[semesters.length - 1].semesterGPA10?.toFixed(2) : '--'}
                        </p>
                    </div>
                    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                        <h3 className="text-lg font-medium text-foreground mb-2">Cumulative GPA</h3>
                        <p className="text-3xl font-bold text-primary">{cumulativeGPA10.toFixed(2)}</p>
                    </div>
                    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                        <h3 className="text-lg font-medium text-foreground mb-2">Total Credits</h3>
                        <p className="text-3xl font-bold text-primary">{totalCredits}</p>
                    </div>
                </div>

                {/* Semesters */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-foreground">Semesters</h2>
                        <Button onClick={() => setIsAddingSemester(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Add Semester
                        </Button>
                    </div>

                    {isAddingSemester && (
                        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1">Semester Name</label>
                                    <Input
                                        value={newSemesterName}
                                        onChange={(e) => setNewSemesterName(e.target.value)}
                                        placeholder="e.g. Spring 2025"
                                    />
                                </div>
                                <Button onClick={handleAddSemester}>Add</Button>
                                <Button variant="ghost" onClick={() => setIsAddingSemester(false)}>Cancel</Button>
                            </div>
                        </div>
                    )}

                    {semesters.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No semesters added yet.</p>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={semesters.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-4">
                                    {semesters.map((semester, index) => (
                                        <SortableSemesterItem
                                            key={semester.id}
                                            semester={semester}
                                            isFirst={index === 0}
                                            isLast={index === semesters.length - 1}
                                            onDelete={handleDeleteSemester}
                                            onClick={() => navigate(`/semester/${semester.id}`)}
                                            onMoveUp={() => handleMoveSemester(index, 'up')}
                                            onMoveDown={() => handleMoveSemester(index, 'down')}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </div>
        </div>
    );
}
