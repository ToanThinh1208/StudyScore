import type { Course, CourseComponent } from '../types';

export const calculateCourseAverage = (course: Course & { components?: CourseComponent[] }): number => {
    const components = course.components || [];
    if (components.length === 0) return 0;

    const weightedSum = components.reduce((sum, c) => {
        return sum + (c.score * c.weight / 100);
    }, 0);

    // Add bonus if exists, cap at 10
    const bonus = course.bonus || 0;
    let averageScore = Math.min(weightedSum + bonus, 10);
    averageScore = Math.round(averageScore * 10) / 10;

    return averageScore;
};

export const convert10to4 = (score: number): number => {
    if (score >= 8.5) return 4.0; // A
    if (score >= 8.0) return 3.5; // B+
    if (score >= 7.0) return 3.0; // B
    if (score >= 6.5) return 2.5; // C+
    if (score >= 5.5) return 2.0; // C
    if (score >= 5.0) return 1.5; // D+
    if (score >= 4.0) return 1.0; // D
    return 0; // F
};

export const convert4to10 = (score: number): string => {
    if (score >= 4.0) return "8.5 - 10.0";
    if (score >= 3.5) return "8.0 - 8.4";
    if (score >= 3.0) return "7.0 - 7.9";
    if (score >= 2.5) return "6.5 - 6.9";
    if (score >= 2.0) return "5.5 - 6.4";
    if (score >= 1.5) return "5.0 - 5.4";
    if (score >= 1.0) return "4.0 - 4.9";
    if (score >= 0.0) return "0.0 - 3.9";
    return "Unknown";
};

export const convert10to4Linear = (score: number): number => {
    return (score / 10) * 4;
};

export const convert4to10Linear = (score: number): number => {
    return (score / 4) * 10;
};

export const calculateSemesterGPA = (courses: (Course & { components?: CourseComponent[], averageScore?: number })[]) => {
    let totalWeightedScore = 0;
    let totalCredits = 0;

    const processedCourses = courses.map(course => {
        const averageScore = calculateCourseAverage(course);

        if (course.is_gpa !== false) {
            totalWeightedScore += averageScore * course.credit;
            totalCredits += course.credit;
        }

        return {
            ...course,
            averageScore
        };
    });

    const semesterGPA10 = totalCredits > 0 ? Math.round((totalWeightedScore / totalCredits) * 100) / 100 : 0;
    const semesterGPA4 = convert10to4(semesterGPA10);

    return {
        semesterGPA10,
        semesterGPA4,
        processedCourses
    };
};
