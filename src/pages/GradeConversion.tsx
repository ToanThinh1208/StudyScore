import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, ArrowRightLeft, ArrowUpDown, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { convert10to4, convert4to10, convert10to4Linear, convert4to10Linear } from '../lib/gpaUtils';

export default function GradeConversion() {
    const navigate = useNavigate();
    const [score, setScore] = useState<string>('');
    const [result, setResult] = useState<string>('');
    const [is10to4, setIs10to4] = useState(true);
    const [useLinear, setUseLinear] = useState(true);

    const handleConvert = () => {
        const s = parseFloat(score);
        if (isNaN(s)) return;

        if (useLinear) {
            if (is10to4) {
                setResult(convert10to4Linear(s).toFixed(2));
            } else {
                setResult(convert4to10Linear(s).toFixed(2));
            }
        } else {
            if (is10to4) {
                setResult(convert10to4(s).toFixed(1));
            } else {
                setResult(convert4to10(s));
            }
        }
    };

    const toggleDirection = () => {
        setIs10to4(!is10to4);
        setScore('');
        setResult('');
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
                        <div className="flex flex-col gap-4 mb-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center">
                                    <ArrowRightLeft className="w-5 h-5 mr-2" /> Quick Converter
                                </h2>
                                <Button variant="outline" size="sm" onClick={toggleDirection}>
                                    <ArrowUpDown className="w-4 h-4 mr-2" />
                                    {is10to4 ? "10 → 4" : "4 → 10"}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
                                <span className="text-sm font-medium flex items-center">
                                    <Settings2 className="w-4 h-4 mr-2" />
                                    Mode: {useLinear ? "Linear (Standard)" : "Table (FPT)"}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setUseLinear(!useLinear)}
                                    className="text-xs h-7"
                                >
                                    Switch to {useLinear ? "Table" : "Linear"}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {is10to4 ? "Score (10-point scale)" : "Score (4-point scale)"}
                                </label>
                                <Input
                                    type="number"
                                    value={score}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '') {
                                            setScore('');
                                            return;
                                        }
                                        const numVal = parseFloat(val);
                                        const max = is10to4 ? 10 : 4;
                                        if (!isNaN(numVal) && numVal >= 0 && numVal <= max) {
                                            setScore(val);
                                        }
                                    }}
                                    placeholder={is10to4 ? "Enter score (0-10)" : "Enter score (0-4)"}
                                    max={is10to4 ? 10 : 4}
                                    min={0}
                                />
                            </div>

                            <Button className="w-full" onClick={handleConvert}>Convert</Button>

                            <div className="text-center p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">
                                    {is10to4 ? "Result (4-point scale)" : "Result (10-point scale)"}
                                </p>
                                <p className="text-3xl font-bold text-primary">{result || '--'}</p>
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
                                    <tr><td className="p-3">8.5 - 10.0</td><td className="p-3">4.0</td><td className="p-3">A</td></tr>
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
