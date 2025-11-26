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

    // Convert to GPA 4
    let semesterGPA4 = 0;
    if (semesterGPA10 >= 9.0) semesterGPA4 = 4.0;
    else if (semesterGPA10 >= 8.5) semesterGPA4 = 3.7;
    else if (semesterGPA10 >= 8.0) semesterGPA4 = 3.5;
    else if (semesterGPA10 >= 7.0) semesterGPA4 = 3.0;
    else if (semesterGPA10 >= 6.5) semesterGPA4 = 2.5;
    else if (semesterGPA10 >= 5.5) semesterGPA4 = 2.0;
    else if (semesterGPA10 >= 5.0) semesterGPA4 = 1.5;
    else if (semesterGPA10 >= 4.0) semesterGPA4 = 1.0;

    return {
        semesterGPA10,
        semesterGPA4,
        processedCourses
    };
};
