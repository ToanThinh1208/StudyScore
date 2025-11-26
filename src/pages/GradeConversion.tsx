import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GradeConversion() {
    const navigate = useNavigate();
    const [score10, setScore10] = useState<string>('');
    const [score4, setScore4] = useState<string>('');

    const convert10to4 = (score: number): number => {
        if (score >= 9.0) return 4.0; // A+
        if (score >= 8.5) return 3.7; // A
        if (score >= 8.0) return 3.5; // B+
        if (score >= 7.0) return 3.0; // B
        if (score >= 6.5) return 2.5; // C+
        if (score >= 5.5) return 2.0; // C
        if (score >= 5.0) return 1.5; // D+
        if (score >= 4.0) return 1.0; // D
        return 0; // F
    };

    const handleConvert = () => {
        const s10 = parseFloat(score10);
        if (!isNaN(s10)) {
            setScore4(convert10to4(s10).toFixed(1));
        }
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <Button variant="ghost" className="mb-8" onClick={() => navigate('/')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>

                <h1 className="text-3xl font-bold text-foreground mb-8">Grade Conversion</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Converter */}
                    <div className="bg-card p-6 rounded-xl border border-border shadow-sm h-fit">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <ArrowRightLeft className="w-5 h-5 mr-2" /> Quick Converter
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Score (10-point scale)</label>
                                <Input
                                    type="number"
                                    value={score10}
                                    onChange={(e) => setScore10(e.target.value)}
                                    placeholder="Enter score (0-10)"
                                    max={10}
                                    min={0}
                                />
                            </div>

                            <Button className="w-full" onClick={handleConvert}>Convert</Button>

                            <div className="text-center p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Result (4-point scale)</p>
                                <p className="text-3xl font-bold text-primary">{score4 || '--'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Reference Table */}
                    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                        <h2 className="text-xl font-bold mb-6">Reference Table</h2>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="p-3 text-left">Score (10)</th>
                                        <th className="p-3 text-left">Score (4)</th>
                                        <th className="p-3 text-left">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    <tr><td className="p-3">9.0 - 10.0</td><td className="p-3">4.0</td><td className="p-3">A+</td></tr>
                                    <tr><td className="p-3">8.5 - 8.9</td><td className="p-3">3.7</td><td className="p-3">A</td></tr>
                                    <tr><td className="p-3">8.0 - 8.4</td><td className="p-3">3.5</td><td className="p-3">B+</td></tr>
                                    <tr><td className="p-3">7.0 - 7.9</td><td className="p-3">3.0</td><td className="p-3">B</td></tr>
                                    <tr><td className="p-3">6.5 - 6.9</td><td className="p-3">2.5</td><td className="p-3">C+</td></tr>
                                    <tr><td className="p-3">5.5 - 6.4</td><td className="p-3">2.0</td><td className="p-3">C</td></tr>
                                    <tr><td className="p-3">5.0 - 5.4</td><td className="p-3">1.5</td><td className="p-3">D+</td></tr>
                                    <tr><td className="p-3">4.0 - 4.9</td><td className="p-3">1.0</td><td className="p-3">D</td></tr>
                                    <tr><td className="p-3">0.0 - 3.9</td><td className="p-3">0.0</td><td className="p-3">F</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
