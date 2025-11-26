import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateSemesterGPA } from '../lib/gpaUtils';

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
                        is_gpa,
                        components:course_components (
                            score,
                            weight
                        )
                    )
                `)
                .order('index_order', { ascending: true });

            if (error) throw error;

            const chartData = semesters.map((sem: any) => {
                const { semesterGPA10, semesterGPA4 } = calculateSemesterGPA(sem.courses);

                return {
                    name: sem.name,
                    gpa10: semesterGPA10,
                    gpa4: semesterGPA4
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
