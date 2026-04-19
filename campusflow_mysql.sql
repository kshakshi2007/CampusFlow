-- =====================================================
-- CampusFlow Database Schema - MySQL (MariaDB) Compatible
-- For use with XAMPP phpMyAdmin
-- =====================================================

-- Create the database
CREATE DATABASE IF NOT EXISTS campusflow;
USE campusflow;

-- =====================================================
-- TABLES
-- =====================================================

-- Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'faculty', 'admin', 'librarian') NOT NULL,
    department VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students Profile
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    roll_number VARCHAR(100) NOT NULL UNIQUE,
    semester INT NOT NULL,
    cgpa FLOAT DEFAULT 0.0,
    backlogs INT DEFAULT 0,
    markscard_url TEXT,
    fee_status ENUM('paid', 'pending', 'partial') DEFAULT 'pending',
    mentor_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    semester INT NOT NULL,
    department VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student-Subject Mapping (Many-to-Many)
CREATE TABLE IF NOT EXISTS student_subjects (
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    PRIMARY KEY (student_id, subject_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent') NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Study Materials
CREATE TABLE IF NOT EXISTS materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type ENUM('model_paper', 'pyq', 'syllabus', 'question_bank', 'textbook') NOT NULL,
    subject_id INT NOT NULL,
    semester INT NOT NULL,
    url TEXT NOT NULL,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Library Books
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(50) UNIQUE,
    category VARCHAR(255),
    copies INT DEFAULT 1,
    availability ENUM('available', 'not_available') DEFAULT 'available',
    status ENUM('available', 'issued') DEFAULT 'available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Library Status
CREATE TABLE IF NOT EXISTS library_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status ENUM('open', 'closed') DEFAULT 'open'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATETIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    category ENUM('club', 'hackathon', 'cultural', 'workshop') NOT NULL,
    created_by INT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event Registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    student_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lost & Found
CREATE TABLE IF NOT EXISTS lost_found (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    date_reported DATE NOT NULL,
    description TEXT,
    type ENUM('lost', 'found') NOT NULL,
    status ENUM('lost', 'found', 'claimed', 'returned') DEFAULT 'lost',
    reported_by INT NOT NULL,
    image_url TEXT,
    proof TEXT,
    claimed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (claimed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fees
CREATE TABLE IF NOT EXISTS fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    amount FLOAT NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('paid', 'pending', 'partial') DEFAULT 'pending',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_role VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Note: Users will be created by the server's initializeDatabase function
-- with properly hashed passwords using bcrypt

-- Insert sample subjects
INSERT INTO subjects (code, name, semester, department) VALUES
('CS101', 'Introduction to Programming', 1, 'Computer Science'),
('CS102', 'Data Structures', 2, 'Computer Science'),
('CS201', 'Database Management Systems', 3, 'Computer Science'),
('CS202', 'Operating Systems', 4, 'Computer Science'),
('CS301', 'Computer Networks', 5, 'Computer Science'),
('CS302', 'Software Engineering', 6, 'Computer Science'),
('EC101', 'Basic Electronics', 1, 'Electronics'),
('EC201', 'Digital Electronics', 3, 'Electronics'),
('MA101', 'Engineering Mathematics', 1, 'Mathematics'),
('MA201', 'Probability and Statistics', 3, 'Mathematics')
ON DUPLICATE KEY UPDATE name=name;

-- Insert sample books
INSERT INTO books (title, author, isbn, category, copies, availability, status) VALUES
('Introduction to Algorithms', 'Thomas H. Cormen', '978-0262033848', 'Computer Science', 5, 'available', 'available'),
('Database System Concepts', 'Abraham Silberschatz', '978-0078022159', 'Computer Science', 3, 'available', 'available'),
('Operating System Concepts', 'Abraham Silberschatz', '978-1119800361', 'Computer Science', 4, 'available', 'available'),
('Computer Networks', 'Andrew S. Tanenbaum', '978-0132126953', 'Computer Science', 3, 'available', 'available'),
('Clean Code', 'Robert C. Martin', '978-0132350884', 'Software Engineering', 2, 'available', 'available'),
('The Pragmatic Programmer', 'David Thomas', '978-0135957059', 'Software Engineering', 2, 'available', 'available')
ON DUPLICATE KEY UPDATE title=title;

-- Initialize library status
INSERT INTO library_status (status) VALUES ('open');

-- Note: Sample students will be created by the server's initializeDatabase function
-- with properly hashed passwords using bcrypt

-- Insert sample notifications
INSERT INTO notifications (title, message, target_role) VALUES
('Welcome to CampusFlow', 'Welcome to the CampusFlow college management system!', 'all'),
('Fee Payment Reminder', 'Please pay your semester fees before the due date.', 'student'),
('Library Timing Update', 'Library will be open from 8 AM to 8 PM on weekdays.', 'all'),
('Faculty Meeting', 'Faculty meeting scheduled for next Monday at 10 AM.', 'faculty');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify data insertion
SELECT 'Users by Role:' AS '';
SELECT role, COUNT(*) as count FROM users GROUP BY role;

SELECT '' AS '';
SELECT 'Total Students:' AS '';
SELECT COUNT(*) as count FROM students;

SELECT '' AS '';
SELECT 'Total Subjects:' AS '';
SELECT COUNT(*) as count FROM subjects;

SELECT '' AS '';
SELECT 'Total Books:' AS '';
SELECT COUNT(*) as count FROM books;

-- =====================================================
-- END OF SCRIPT
-- =====================================================