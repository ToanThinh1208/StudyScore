export interface Profile {
  id: string;
  full_name: string | null;
  fpt_student_code: string | null;
  updated_at: string;
}

export interface Semester {
  id: string;
  user_id: string;
  name: string;
  index_order: number;
  created_at: string;
}

export interface Course {
  id: string;
  semester_id: string;
  user_id: string;
  name: string;
  credit: number;
  bonus?: number; // Optional bonus points
  is_gpa?: boolean; // Whether to include in GPA calculation
  created_at: string;
}

export interface CourseComponent {
  id: string;
  course_id: string;
  name: string;
  weight: number;
  score: number;
  created_at: string;
}

export interface CourseWithComponents extends Course {
  components: CourseComponent[];
  averageScore?: number;
}

export interface SemesterWithCourses extends Semester {
  courses: CourseWithComponents[];
  semesterGPA10?: number;
  semesterGPA4?: number;
}
