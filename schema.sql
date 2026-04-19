-- CampusFlow Database Schema (MySQL Compatible)

-- Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'faculty', 'admin', 'librarian')) NOT NULL,
    department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Students Profile
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    roll_number TEXT UNIQUE NOT NULL,
    semester INTEGER NOT NULL,
    cgpa REAL DEFAULT 0.0,
    backlogs INTEGER DEFAULT 0,
    markscard_url TEXT,
    fee_status TEXT CHECK(fee_status IN ('paid', 'pending', 'partial')) DEFAULT 'pending',
    mentor_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (mentor_id) REFERENCES users(id)
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    semester INTEGER NOT NULL,
    department TEXT NOT NULL
);

-- Student-Subject Mapping (Many-to-Many)
CREATE TABLE IF NOT EXISTS student_subjects (
    student_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    PRIMARY KEY (student_id, subject_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    date DATE NOT NULL,
    status TEXT CHECK(status IN ('present', 'absent')) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Study Materials
CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT CHECK(type IN ('model_paper', 'pyq', 'syllabus', 'question_bank', 'textbook')) NOT NULL,
    subject_id INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    url TEXT NOT NULL,
    uploaded_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Library
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT UNIQUE,
    category TEXT,
    copies INTEGER DEFAULT 1,
    availability TEXT CHECK(availability IN ('available', 'not_available')) DEFAULT 'available',
    status TEXT CHECK(status IN ('available', 'issued')) DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS library_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT CHECK(status IN ('open', 'closed')) DEFAULT 'open'
);

-- Events
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date DATETIME NOT NULL,
    venue TEXT NOT NULL,
    category TEXT CHECK(category IN ('technical', 'cultural', 'sports', 'college_fest')) NOT NULL,
    organizer TEXT,
    department TEXT,
    created_by INTEGER NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Alumni Management
CREATE TABLE IF NOT EXISTS alumni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    batch_year INTEGER NOT NULL,
    contact_details TEXT,
    career_info TEXT,
    achievements TEXT,
    image_url TEXT,
    document_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Event Registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Event Resources
CREATE TABLE IF NOT EXISTS event_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    file_type TEXT CHECK(file_type IN ('image', 'pdf')) NOT NULL,
    file_url TEXT NOT NULL,
    title TEXT,
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Event Leaderboard
CREATE TABLE IF NOT EXISTS event_leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    student_name TEXT NOT NULL,
    position INTEGER NOT NULL, -- 1, 2, 3
    department TEXT,
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Lost & Found
CREATE TABLE IF NOT EXISTS lost_found (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    location TEXT NOT NULL,
    date_reported DATE NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('lost', 'found')) NOT NULL,
    status TEXT CHECK(status IN ('lost', 'found', 'claimed', 'returned')) DEFAULT 'lost',
    reported_by INTEGER NOT NULL,
    image_url TEXT,
    proof TEXT, -- For claims
    claimed_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reported_by) REFERENCES users(id),
    FOREIGN KEY (claimed_by) REFERENCES users(id)
);

-- Fees
CREATE TABLE IF NOT EXISTS fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    due_date DATE NOT NULL,
    status TEXT CHECK(status IN ('paid', 'pending', 'partial')) DEFAULT 'pending',
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_role TEXT, -- 'student', 'faculty', 'all'
    user_id INTEGER, -- Specific user if needed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Results
CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    marks INTEGER NOT NULL,
    grade TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Event Attendance (for roll number entry in events dashboard)
CREATE TABLE IF NOT EXISTS event_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    student_roll_number TEXT NOT NULL,
    marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- IA Schedules
CREATE TABLE IF NOT EXISTS ia_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    ia_number INTEGER NOT NULL, -- 1, 2, 3
    date DATE NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);
