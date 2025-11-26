import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
    const navigate = useNavigate();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            // Fetch semesters with courses and components
            const { data: semesters, error } = await supabase
                .from('semesters')
                .select(`
                    *,
                    courses:courses (
                        credit,
                        bonus,
                        components:course_components (
                            score,
                            weight
                        )
                    )
                `)
                .order('index_order', { ascending: true });

            if (error) throw error;

            const chartData = semesters.map((sem: any) => {
                let totalWeightedScore = 0;
                let totalCredits = 0;

                sem.courses.forEach((course: any) => {
                    const components = course.components || [];
                    if (components.length > 0) {
                        const courseScore = components.reduce((sum: number, c: any) => {
                            return sum + (c.score * c.weight / 100);
                        }, 0);

                        // Add bonus if exists, cap at 10
                        const bonus = course.bonus || 0;
                        const finalScore = Math.min(courseScore + bonus, 10);
                        const roundedCourseScore = Math.round(finalScore * 10) / 10;

                        totalWeightedScore += roundedCourseScore * course.credit;
                        totalCredits += course.credit;
                    }
                });

                const gpa10 = totalCredits > 0 ? Math.round((totalWeightedScore / totalCredits) * 100) / 100 : 0;

                // Approximate GPA 4 conversion for the chart
                let gpa4 = 0;
                if (gpa10 >= 9.0) gpa4 = 4.0;
                else if (gpa10 >= 8.5) gpa4 = 3.7;
                else if (gpa10 >= 8.0) gpa4 = 3.5;
                else if (gpa10 >= 7.0) gpa4 = 3.0;
                else if (gpa10 >= 6.5) gpa4 = 2.5;
                else if (gpa10 >= 5.5) gpa4 = 2.0;
                else if (gpa10 >= 5.0) gpa4 = 1.5;
                else if (gpa10 >= 4.0) gpa4 = 1.0;

                return {
                    name: sem.name,
                    gpa10,
                    gpa4
                };
            });

            setData(chartData);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto">
                <Button variant="ghost" className="mb-8" onClick={() => navigate('/')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>

                <h1 className="text-3xl font-bold text-foreground mb-8">Analytics</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                        <h3 className="text-lg font-bold mb-6">GPA Trend (10-point Scale)</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="name" stroke="#888" />
                                    <YAxis domain={[0, 10]} stroke="#888" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="gpa10" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} name="GPA (10)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                        <h3 className="text-lg font-bold mb-6">GPA Trend (4-point Scale)</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="name" stroke="#888" />
                                    <YAxis domain={[0, 4]} stroke="#888" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="gpa4" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 8 }} name="GPA (4)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
