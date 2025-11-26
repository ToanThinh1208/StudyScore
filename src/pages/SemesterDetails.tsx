import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import type { Semester, CourseWithComponents, CourseComponent } from '../types';

export default function SemesterDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [semester, setSemester] = useState<Semester | null>(null);
    const [courses, setCourses] = useState<CourseWithComponents[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingCourse, setIsAddingCourse] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseCredit, setNewCourseCredit] = useState(3);

    // State for editing components
    const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
    const [tempComponents, setTempComponents] = useState<CourseComponent[]>([]);
    const [tempBonus, setTempBonus] = useState<number>(0);

    // State for editing course info
    const [editingCourseInfoId, setEditingCourseInfoId] = useState<string | null>(null);
    const [tempCourseName, setTempCourseName] = useState('');
    const [tempCourseCredit, setTempCourseCredit] = useState(3);

    useEffect(() => {
        if (id) {
            fetchSemesterData();
        }
    }, [id]);

    const fetchSemesterData = async () => {
        try {
            setLoading(true);
            // Fetch semester details
            const { data: semesterData, error: semesterError } = await supabase
                .from('semesters')
                .select('*')
                .eq('id', id)
                .single();

            if (semesterError) throw semesterError;
            setSemester(semesterData);

            // Fetch courses and their components
            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select(`
                    *,
                    components:course_components(*)
                `)
                .eq('semester_id', id);

            if (coursesError) throw coursesError;

            // Calculate average scores
            const processedCourses = coursesData.map((course: any) => {
                const components = course.components || [];
                let averageScore = 0;

                if (components.length > 0) {
                    const weightedSum = components.reduce((sum: number, c: any) => {
                        return sum + (c.score * c.weight / 100);
                    }, 0);
                    // Add bonus if exists, cap at 10
                    const bonus = course.bonus || 0;
                    averageScore = Math.min(weightedSum + bonus, 10);
                    averageScore = Math.round(averageScore * 10) / 10;
                }

                return {
                    ...course,
                    components,
                    averageScore
                };
            });

            setCourses(processedCourses);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCourse = async () => {
        if (!newCourseName.trim()) return;

        try {
            const { data, error } = await supabase
                .from('courses')
                .insert([
                    {
                        semester_id: id,
                        name: newCourseName,
                        credit: newCourseCredit,
                        user_id: (await supabase.auth.getUser()).data.user?.id
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            setCourses([...courses, { ...data, components: [], averageScore: 0 }]);
            setNewCourseName('');
            setNewCourseCredit(3);
            setIsAddingCourse(false);
        } catch (error) {
            console.error('Error adding course:', error);
        }
    };

    const handleDeleteCourse = async (courseId: string) => {
        if (!confirm('Are you sure you want to delete this course?')) return;

        try {
            const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', courseId);

            if (error) throw error;

            setCourses(courses.filter(c => c.id !== courseId));
        } catch (error) {
            console.error('Error deleting course:', error);
        }
    };

    const startEditingComponents = (course: CourseWithComponents) => {
        setEditingCourseId(course.id);
        setTempComponents([...course.components]);
        setTempBonus(course.bonus || 0);
    };

    const cancelEditing = () => {
        setEditingCourseId(null);
        setTempComponents([]);
        setTempBonus(0);
    };

    const handleUpdateComponent = (index: number, field: keyof CourseComponent, value: any) => {
        const newComponents = [...tempComponents];
        newComponents[index] = { ...newComponents[index], [field]: value };
        setTempComponents(newComponents);
    };

    const startEditingCourseInfo = (course: CourseWithComponents) => {
        setEditingCourseInfoId(course.id);
        setTempCourseName(course.name);
        setTempCourseCredit(course.credit);
    };

    const cancelEditingCourseInfo = () => {
        setEditingCourseInfoId(null);
        setTempCourseName('');
        setTempCourseCredit(3);
    };

    const saveCourseInfo = async () => {
        if (!editingCourseInfoId || !tempCourseName.trim()) return;

        try {
            const { error } = await supabase
                .from('courses')
                .update({
                    name: tempCourseName,
                    credit: tempCourseCredit
                })
                .eq('id', editingCourseInfoId);

            if (error) throw error;

            // Update local state
            setCourses(courses.map(c =>
                c.id === editingCourseInfoId
                    ? { ...c, name: tempCourseName, credit: tempCourseCredit }
                    : c
            ));
            setEditingCourseInfoId(null);
        } catch (error) {
            console.error('Error updating course info:', error);
        }
    };

    const handleAddComponent = () => {
        setTempComponents([
            ...tempComponents,
            {
                id: `temp-${Date.now()}`,
                course_id: editingCourseId!,
                name: 'New Component',
                weight: 0,
                score: 0,
                created_at: new Date().toISOString()
            }
        ]);
    };

    const handleRemoveComponent = (index: number) => {
        const newComponents = [...tempComponents];
        newComponents.splice(index, 1);
        setTempComponents(newComponents);
    };

    const saveComponents = async () => {
        if (!editingCourseId) return;

        try {
            // Update course bonus
            const { error: courseError } = await supabase
                .from('courses')
                .update({ bonus: tempBonus })
                .eq('id', editingCourseId);

            if (courseError) throw courseError;

            // Delete existing components (simple strategy: delete all and recreate)
            // A better strategy would be to diff, but for now this is easier
            // Actually, let's try to update existing and insert new

            // First, delete components that are not in tempComponents (if they have real IDs)
            const originalCourse = courses.find(c => c.id === editingCourseId);
            if (originalCourse) {
                const originalIds = originalCourse.components.map(c => c.id);
                const currentIds = tempComponents.filter(c => !c.id.startsWith('temp-')).map(c => c.id);
                const idsToDelete = originalIds.filter(id => !currentIds.includes(id));

                if (idsToDelete.length > 0) {
                    await supabase.from('course_components').delete().in('id', idsToDelete);
                }
            }

            // Upsert components
            const componentsToUpsert = tempComponents.map(c => {
                const { id, created_at, ...rest } = c;
                // If id starts with temp-, it's new, so we don't send id
                if (id.startsWith('temp-')) {
                    return {
                        ...rest,
                        course_id: editingCourseId
                    };
                }
                return { id, ...rest, course_id: editingCourseId };
            });

            if (componentsToUpsert.length > 0) {
                const { error } = await supabase
                    .from('course_components')
                    .upsert(componentsToUpsert);
                if (error) throw error;
            }

            await fetchSemesterData(); // Refresh data
            setEditingCourseId(null);
        } catch (error) {
            console.error('Error saving components:', error);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!semester) return <div className="p-8 text-center">Semester not found</div>;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-5xl mx-auto">
                <Button variant="ghost" className="mb-4" onClick={() => navigate('/')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground">{semester.name}</h1>
                    <Button onClick={() => setIsAddingCourse(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Course
                    </Button>
                </div>

                {isAddingCourse && (
                    <div className="bg-card p-6 rounded-xl border border-border shadow-sm mb-6">
                        <h3 className="text-lg font-medium mb-4">New Course</h3>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Course Name</label>
                                <Input
                                    value={newCourseName}
                                    onChange={(e) => setNewCourseName(e.target.value)}
                                    placeholder="e.g. Mathematics"
                                />
                            </div>
                            <div className="w-32">
                                <label className="block text-sm font-medium mb-1">Credits</label>
                                <Input
                                    type="number"
                                    value={newCourseCredit}
                                    onChange={(e) => setNewCourseCredit(Number(e.target.value))}
                                />
                            </div>
                            <Button onClick={handleAddCourse}>Add</Button>
                            <Button variant="ghost" onClick={() => setIsAddingCourse(false)}>Cancel</Button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {courses.map(course => (
                        <div key={course.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="p-6 flex justify-between items-center bg-card/50">
                                {editingCourseInfoId === course.id ? (
                                    <div className="flex gap-4 items-end flex-1">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium mb-1">Course Name</label>
                                            <Input
                                                value={tempCourseName}
                                                onChange={(e) => setTempCourseName(e.target.value)}
                                                placeholder="Course Name"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-sm font-medium mb-1">Credits</label>
                                            <Input
                                                type="number"
                                                value={tempCourseCredit}
                                                onChange={(e) => setTempCourseCredit(Number(e.target.value))}
                                            />
                                        </div>
                                        <Button size="sm" onClick={saveCourseInfo}>
                                            <Save className="w-4 h-4 mr-2" /> Save
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={cancelEditingCourseInfo}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground">{course.name}</h3>
                                            <p className="text-muted-foreground">{course.credit} Credits</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Average</p>
                                                <p className={`text-2xl font-bold ${(course.averageScore || 0) >= 5 ? 'text-green-500' : 'text-red-500'
                                                    }`}>
                                                    {course.averageScore}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => startEditingCourseInfo(course)}>
                                                    Edit Info
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => startEditingComponents(course)}>
                                                    Edit Grades
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteCourse(course.id)}>
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {editingCourseId === course.id && (
                                <div className="p-6 border-t border-border bg-muted/30">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-medium">Grade Components</h4>
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium">Bonus:</label>
                                            <Input
                                                type="number"
                                                value={tempBonus}
                                                onChange={(e) => setTempBonus(Number(e.target.value))}
                                                placeholder="0"
                                                className="w-20"
                                                step="0.1"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3 mb-4">
                                        {tempComponents.map((comp, idx) => (
                                            <div key={comp.id || idx} className="flex gap-4 items-center">
                                                <Input
                                                    className="flex-1"
                                                    value={comp.name}
                                                    onChange={(e) => handleUpdateComponent(idx, 'name', e.target.value)}
                                                    placeholder="Component Name"
                                                />
                                                <div className="w-24">
                                                    <Input
                                                        type="number"
                                                        value={comp.weight}
                                                        onChange={(e) => handleUpdateComponent(idx, 'weight', Number(e.target.value))}
                                                        placeholder="Weight %"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <Input
                                                        type="number"
                                                        value={comp.score}
                                                        onChange={(e) => handleUpdateComponent(idx, 'score', Number(e.target.value))}
                                                        placeholder="Score"
                                                    />
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => handleRemoveComponent(idx)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between">
                                        <Button variant="outline" size="sm" onClick={handleAddComponent}>
                                            <Plus className="w-4 h-4 mr-2" /> Add Component
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" onClick={cancelEditing}>Cancel</Button>
                                            <Button onClick={saveComponents}>
                                                <Save className="w-4 h-4 mr-2" /> Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {courses.length === 0 && !isAddingCourse && (
                        <div className="text-center py-12 text-muted-foreground">
                            No courses added yet. Click "Add Course" to get started.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
