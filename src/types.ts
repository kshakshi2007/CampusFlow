export type UserRole = 'student' | 'faculty' | 'admin' | 'librarian';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    department?: string;
}

export interface Student extends User {
    studentId: number;
    rollNumber: string;
    semester: number;
    cgpa: number;
    backlogs: number;
    feeStatus: 'paid' | 'pending' | 'partial';
}

export interface Attendance {
    subject: string;
    percentage: number;
}

export interface Material {
    id: number;
    title: string;
    type: 'question_paper' | 'pyq' | 'syllabus' | 'textbook' | 'notes';
    subject_name: string;
    url: string;
    created_at: string;
}

export interface Event {
    id: number;
    title: string;
    description: string;
    date: string;
    venue: string;
    category: 'club' | 'hackathon' | 'cultural' | 'workshop';
}

export interface Book {
    id: number;
    title: string;
    author: string;
    status: 'available' | 'issued';
}

export interface LostFoundItem {
    id: number;
    item_name: string;
    description: string;
    type: 'lost' | 'found';
    status: string;
    reporter_name: string;
    image_url?: string;
    created_at: string;
}
