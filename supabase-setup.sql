-- CampusFlow Supabase Setup SQL
-- Run this in your Supabase SQL Editor

-- Create users table (PostgreSQL/Supabase compatible)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'faculty', 'admin', 'librarian')) NOT NULL,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    roll_number TEXT UNIQUE NOT NULL,
    semester INTEGER NOT NULL,
    cgpa REAL DEFAULT 0.0,
    backlogs INTEGER DEFAULT 0,
    markscard_url TEXT,
    fee_status TEXT CHECK(fee_status IN ('paid', 'pending', 'partial')) DEFAULT 'pending',
    mentor_id BIGINT REFERENCES users(id)
);

-- Insert Admin user
INSERT INTO users (name, email, password, role, department) 
VALUES ('Admin User', 'admin@college.edu', 'password123', 'admin', 'Administration')
ON CONFLICT (email) DO NOTHING;

-- Insert Faculty user
INSERT INTO users (name, email, password, role, department) 
VALUES ('Faculty User', 'faculty@college.edu', 'password123', 'faculty', 'Computer Science')
ON CONFLICT (email) DO NOTHING;

-- Insert Librarian user
INSERT INTO users (name, email, password, role, department) 
VALUES ('Librarian User', 'librarian@college.edu', 'password123', 'librarian', 'Library')
ON CONFLICT (email) DO NOTHING;

-- Insert Student users (student1 to student200)
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..200 LOOP
        INSERT INTO users (name, email, password, role, department) 
        VALUES (
            'Student ' || i,
            'student' || i || '@college.edu',
            'password123',
            'student',
            'Computer Science'
        )
        ON CONFLICT (email) DO NOTHING;
        
        -- Insert corresponding student profile
        INSERT INTO students (user_id, roll_number, semester, cgpa, backlogs)
        SELECT 
            u.id,
            'CS2024' || LPAD(i::text, 3, '0'),
            (RANDOM() * 7 + 1)::integer,
            ROUND((RANDOM() * 4 + 6)::numeric, 2),
            (RANDOM() * 3)::integer
        FROM users u 
        WHERE u.email = 'student' || i || '@college.edu'
        ON CONFLICT (roll_number) DO NOTHING;
    END LOOP;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access on students" ON students FOR SELECT USING (true);

-- Verify the data
SELECT role, COUNT(*) as count FROM users GROUP BY role;