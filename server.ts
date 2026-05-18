import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import fs from "fs";
import { createServer } from "http";
import { Server } from "socket.io";

const __dirname = path.resolve();
const db = new Database("campusflow.db");
const JWT_SECRET = process.env.JWT_SECRET || "campusflow-secret-key";

// VTU Scheme Subjects Data (Refined and Expanded for all branches)
const vtuScheme: any = {
    common: {
        "1": [
            { code: "BMAT101", name: "Mathematics-I (Calculus)", credits: 4, typeId: "theory" },
            { code: "BPS102", name: "Engineering Physics", credits: 4, typeId: "theory" },
            { code: "BEEE103", name: "Elements of Electrical Eng.", credits: 3, typeId: "theory" },
            { code: "BPRO104", name: "Programming in C", credits: 3, typeId: "theory" },
            { code: "BENG105", name: "Engineering Graphics", credits: 2, typeId: "theory" },
            { code: "BPL106", name: "Physics Lab", credits: 1, typeId: "lab" },
            { code: "BCL107", name: "C Programming Lab", credits: 1, typeId: "lab" }
        ],
        "2": [
            { code: "BMAT201", name: "Mathematics-II (Diff Eq)", credits: 4, typeId: "theory" },
            { code: "BCH202", name: "Engineering Chemistry", credits: 4, typeId: "theory" },
            { code: "BCS203", name: "Computer Aided Design", credits: 3, typeId: "theory" },
            { code: "BEV204", name: "Environmental Science", credits: 2, typeId: "theory" },
            { code: "BEM205", name: "Elements of Civil Eng.", credits: 3, typeId: "theory" },
            { code: "CHL206", name: "Chemistry Lab", credits: 1, typeId: "lab" },
            { code: "CPL207", name: "CAD Lab", credits: 1, typeId: "lab" }
        ]
    },
    "CSE": {
        "3": [
            { code: "BCS301", name: "Digital Design", credits: 4, typeId: "theory" },
            { code: "BCS302", name: "Data Structures", credits: 4, typeId: "theory" },
            { code: "BCS303", name: "Computer Org & Arch", credits: 3, typeId: "theory" },
            { code: "BCS304", name: "Discrete Math", credits: 3, typeId: "theory" },
            { code: "BCSL305", name: "DS Lab", credits: 2, typeId: "lab" }
        ],
        "4": [
            { code: "BCS401", name: "DB Management Systems", credits: 4, typeId: "theory" },
            { code: "BCS402", name: "Analysis of Algorithms", credits: 4, typeId: "theory" },
            { code: "BCS403", name: "Operating Systems", credits: 3, typeId: "theory" },
            { code: "BCSL404", name: "DBMS Lab", credits: 2, typeId: "lab" }
        ],
        "5": [
            { code: "BCS501", name: "Computer Networks", credits: 4, typeId: "theory" },
            { code: "BCS502", name: "Automata Theory", credits: 3, typeId: "theory" },
            { code: "BCS503", name: "Software Engineering", credits: 3, typeId: "theory" },
            { code: "BCSL504", name: "Networks Lab", credits: 2, typeId: "lab" }
        ],
        "6": [
            { code: "BCS601", name: "Machine Learning", credits: 4, typeId: "theory" },
            { code: "BCS602", name: "Cloud Computing", credits: 3, typeId: "theory" },
            { code: "BCS603", name: "Cryptography", credits: 3, typeId: "theory" },
            { code: "BCSL604", name: "ML Lab", credits: 2, typeId: "lab" }
        ],
        "7": [
            { code: "BCS701", name: "Big Data Analytics", credits: 4, typeId: "theory" },
            { code: "BCS702", name: "IoT & Wireless Nets", credits: 3, typeId: "theory" },
            { code: "BCS703", name: "Project Phase 1", credits: 2, typeId: "theory" }
        ],
        "8": [
            { code: "BCS801", name: "Professional Ethics", credits: 3, typeId: "theory" },
            { code: "BCS802", name: "Project Phase 2", credits: 8, typeId: "theory" }
        ]
    },
    "ISE": {
        "3": [
            { code: "BIS301", name: "Logic Design", credits: 4, typeId: "theory" },
            { code: "BIS302", name: "Data Structures", credits: 4, typeId: "theory" },
            { code: "BIS303", name: "UNIX Programming", credits: 3, typeId: "theory" },
            { code: "BISL304", name: "DS Lab", credits: 2, typeId: "lab" }
        ],
        "4": [
            { code: "BIS401", name: "Object Oriented Java", credits: 4, typeId: "theory" },
            { code: "BIS402", name: "Software Eng", credits: 4, typeId: "theory" },
            { code: "BIS403", name: "Graph Theory", credits: 3, typeId: "theory" },
            { code: "BISL404", name: "Java Lab", credits: 2, typeId: "lab" }
        ],
        "5": [
            { code: "BIS501", name: "Management & Entrepreneurship", credits: 4, typeId: "theory" },
            { code: "BIS502", name: "Python for Data Science", credits: 3, typeId: "theory" },
            { code: "BISL503", name: "Python Lab", credits: 2, typeId: "lab" }
        ],
        "6": [
            { code: "BIS601", name: "Software Testing", credits: 3, typeId: "theory" },
            { code: "BIS602", name: "File Structures", credits: 4, typeId: "theory" },
            { code: "BISL603", name: "FS Lab", credits: 2, typeId: "lab" }
        ],
        "7": [
            { code: "BIS701", name: "Web Programming", credits: 4, typeId: "theory" },
            { code: "BIS702", name: "Data Mining", credits: 3, typeId: "theory" }
        ],
        "8": [
            { code: "BIS801", name: "Internet of Things", credits: 3, typeId: "theory" },
            { code: "BIS802", name: "Major Project", credits: 8, typeId: "theory" }
        ]
    },
    "ECE": {
        "3": [
            { code: "BEC301", name: "Analog Electronics", credits: 4, typeId: "theory" },
            { code: "BEC302", name: "Network Analysis", credits: 4, typeId: "theory" },
            { code: "BEC303", name: "Digital Electronics", credits: 3, typeId: "theory" },
            { code: "BECL304", name: "Analog Lab", credits: 2, typeId: "lab" }
        ],
        "4": [
            { code: "BEC401", name: "Microcontrollers", credits: 4, typeId: "theory" },
            { code: "BEC402", name: "Control Systems", credits: 4, typeId: "theory" },
            { code: "BEC403", name: "Signals & Systems", credits: 3, typeId: "theory" },
            { code: "BECL404", name: "Micro Lab", credits: 2, typeId: "lab" }
        ],
        "5": [
            { code: "BEC501", name: "Digital Signal Processing", credits: 4, typeId: "theory" },
            { code: "BEC502", name: "Verilog HDL", credits: 3, typeId: "theory" },
            { code: "BECL503", name: "DSP Lab", credits: 2, typeId: "lab" }
        ],
        "6": [
            { code: "BEC601", name: "Embedded Systems", credits: 3, typeId: "theory" },
            { code: "BEC602", name: "Antennas & Propagation", credits: 4, typeId: "theory" },
            { code: "BECL603", name: "Embedded Lab", credits: 2, typeId: "lab" }
        ],
        "7": [
            { code: "BEC701", name: "Microwaves & Radar", credits: 4, typeId: "theory" },
            { code: "BEC702", name: "Optical Fiber Comm.", credits: 3, typeId: "theory" }
        ],
        "8": [
            { code: "BEC801", name: "Wireless Comm.", credits: 3, typeId: "theory" },
            { code: "BEC802", name: "Project", credits: 8, typeId: "theory" }
        ]
    },
    "MECH": {
        "3": [
            { code: "BME301", name: "Thermodynamics", credits: 4, typeId: "theory" },
            { code: "BME302", name: "Metal Casting", credits: 4, typeId: "theory" },
            { code: "BMEL303", name: "MT Lab", credits: 2, typeId: "lab" }
        ],
        "4": [
            { code: "BME401", name: "Kinematics of Machines", credits: 4, typeId: "theory" },
            { code: "BME402", name: "Fluid Mechanics", credits: 4, typeId: "theory" },
            { code: "BMEL403", name: "FM Lab", credits: 2, typeId: "lab" }
        ],
        "5": [
             { code: "BME501", name: "Design of Machine Elements I", credits: 4, typeId: "theory" },
             { code: "BME502", name: "Turbo Machines", credits: 4, typeId: "theory" }
        ],
        "6": [
             { code: "BME601", name: "Finite Element Method", credits: 3, typeId: "theory" },
             { code: "BME602", name: "Heat Transfer", credits: 4, typeId: "theory" }
        ],
        "7": [
             { code: "BME701", name: "Control Engineering", credits: 4, typeId: "theory" },
             { code: "BME702", name: "Mechatronics", credits: 3, typeId: "theory" }
        ],
        "8": [
             { code: "BME801", name: "Product Life Cycle", credits: 3, typeId: "theory" },
             { code: "BME802", name: "Project", credits: 8, typeId: "theory" }
        ]
    },
    "CIVIL": {
        "3": [
            { code: "BCV301", name: "Strength of Materials", credits: 4, typeId: "theory" },
            { code: "BCV302", name: "Surveying", credits: 4, typeId: "theory" },
            { code: "BCVL303", name: "Survey Lab", credits: 2, typeId: "lab" }
        ],
        "4": [
            { code: "BCV401", name: "Analysis of Structures I", credits: 4, typeId: "theory" },
            { code: "BCV402", name: "Geotechnical Eng I", credits: 4, typeId: "theory" },
            { code: "BCVL403", name: "Soil Lab", credits: 2, typeId: "lab" }
        ],
        "5": [
             { code: "BCV501", name: "Concrete Technology", credits: 4, typeId: "theory" },
             { code: "BCV502", name: "Hydraulics", credits: 4, typeId: "theory" }
        ],
        "6": [
             { code: "BCV601", name: "Environmental Eng I", credits: 3, typeId: "theory" },
             { code: "BCV602", name: "Highway Eng", credits: 4, typeId: "theory" }
        ],
        "7": [
             { code: "BCV701", name: "Municipal Wastewater", credits: 4, typeId: "theory" },
             { code: "BCV702", name: "Estimation & Costing", credits: 3, typeId: "theory" }
        ],
        "8": [
             { code: "BCV801", name: "Design of Bridges", credits: 3, typeId: "theory" },
             { code: "BCV802", name: "Project", credits: 8, typeId: "theory" }
        ]
    },
    "DS": {
        "3": [
            { code: "BDS301", name: "Stat for Data Science", credits: 4, typeId: "theory" },
            { code: "BDS302", name: "Data Structures (DS)", credits: 4, typeId: "theory" },
            { code: "BDSL303", name: "Python for DS Lab", credits: 2, typeId: "lab" }
        ],
        "4": [
            { code: "BDS401", name: "Mathematical Foundations", credits: 4, typeId: "theory" },
            { code: "BDS402", name: "Linear Algebra for DS", credits: 4, typeId: "theory" },
            { code: "BDSL403", name: "SQL Lab", credits: 2, typeId: "lab" }
        ],
        "5": [
             { code: "BDS501", name: "Deep Learning Foundations", credits: 4, typeId: "theory" },
             { code: "BDS502", name: "Data Visualization", credits: 3, typeId: "theory" }
        ],
        "6": [
             { code: "BDS601", name: "Natural Language Proc", credits: 3, typeId: "theory" },
             { code: "BDS602", name: "Reinforcement Learning", credits: 4, typeId: "theory" }
        ],
        "7": [
             { code: "BDS701", name: "Advanced DS Algorithms", credits: 4, typeId: "theory" },
             { code: "BDS702", name: "Capstone Project", credits: 3, typeId: "theory" }
        ],
        "8": [
             { code: "BDS801", name: "AI Policy & Law", credits: 3, typeId: "theory" },
             { code: "BDS802", name: "Internship Project", credits: 8, typeId: "theory" }
        ]
    },
    "AI": {
        "3": [
            { code: "BAI301", name: "Intro to AI", credits: 4, typeId: "theory" },
            { code: "BAI302", name: "Neural Networks", credits: 4, typeId: "theory" },
            { code: "BAIL303", name: "AI Lab", credits: 2, typeId: "lab" }
        ],
        "4": [
            { code: "BAI401", name: "Fuzzy Logic", credits: 4, typeId: "theory" },
            { code: "BAI402", name: "Expert Systems", credits: 4, typeId: "theory" },
            { code: "BAIL403", name: "Robotics Lab", credits: 2, typeId: "lab" }
        ],
        "5": [
             { code: "BAI501", name: "AI in HealthCare", credits: 4, typeId: "theory" },
             { code: "BAI502", name: "Knowledge Rep", credits: 3, typeId: "theory" }
        ],
        "6": [
             { code: "BAI601", name: "Genetic Algorithms", credits: 3, typeId: "theory" },
             { code: "BAI602", name: "Cognitive Computing", credits: 4, typeId: "theory" }
        ],
        "7": [
             { code: "BAI701", name: "AI for Ethics", credits: 4, typeId: "theory" },
             { code: "BAI702", name: "Applied AI Project", credits: 3, typeId: "theory" }
        ],
        "8": [
             { code: "BAI801", name: "Human AI Interaction", credits: 3, typeId: "theory" },
             { code: "BAI802", name: "AI Thesis", credits: 8, typeId: "theory" }
        ]
    },
    "EEE": {
        "3": [
            { code: "BEE301", name: "Electric Circuits", credits: 4, typeId: "theory" },
            { code: "BEE302", name: "Transformer & Generator", credits: 4, typeId: "theory" },
            { code: "BEEL303", name: "Machines Lab", credits: 2, typeId: "lab" }
        ],
        "4": [
            { code: "BEE401", name: "Power Systems I", credits: 4, typeId: "theory" },
            { code: "BEE402", name: "DC Machines", credits: 4, typeId: "theory" },
            { code: "BEEL403", name: "DC Lab", credits: 2, typeId: "lab" }
        ],
        "5": [
             { code: "BEE501", name: "Control Systems", credits: 4, typeId: "theory" },
             { code: "BEE502", name: "Microprocessors", credits: 3, typeId: "theory" }
        ],
        "6": [
             { code: "BEE601", name: "Power Electronics", credits: 4, typeId: "theory" },
             { code: "BEE602", name: "Electrical Machines II", credits: 4, typeId: "theory" }
        ],
        "7": [
             { code: "BEE701", name: "Power System Analysis", credits: 4, typeId: "theory" },
             { code: "BEE702", name: "High Voltage Eng", credits: 3, typeId: "theory" }
        ],
        "8": [
             { code: "BEE801", name: "Smart Grid", credits: 3, typeId: "theory" },
             { code: "BEE802", name: "Project", credits: 8, typeId: "theory" }
        ]
    }
};


const gradePoints: any = { "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "F": 0 };

// Initialize Database
const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
db.exec(schema);

// Ensure avatar_url exists
try {
    db.prepare("ALTER TABLE users ADD COLUMN avatar_url TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE users ADD COLUMN can_edit_profile INTEGER DEFAULT 1").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN has_updated_profile INTEGER DEFAULT 0").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN can_edit_profile INTEGER DEFAULT 1").run();
} catch (e) {}

// Ensure markscard_url exists
try {
    db.prepare("ALTER TABLE students ADD COLUMN markscard_url TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN contact TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN achievements TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN address TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN dob TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN gender TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN blood_group TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN father_name TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN mother_name TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN guardian_contact TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN enrollment_year INTEGER").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE notifications ADD COLUMN user_id INTEGER").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE events ADD COLUMN organizer TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE events ADD COLUMN department TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE events ADD COLUMN created_by INTEGER").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE events ADD COLUMN registration_deadline DATETIME").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE events ADD COLUMN coordinator_id INTEGER").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE events ADD COLUMN is_reported INTEGER DEFAULT 0").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE event_registrations ADD COLUMN student_name TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE event_registrations ADD COLUMN student_usn TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE books ADD COLUMN cover_image TEXT").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN sgpa REAL DEFAULT 0.0").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN has_updated_profile INTEGER DEFAULT 0").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE students ADD COLUMN can_edit_profile INTEGER DEFAULT 0").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE books ADD COLUMN description TEXT").run();
} catch (e) {}

// Attendance Lifecycle Extensions
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS attendance_locks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            locked_by INTEGER NOT NULL,
            FOREIGN KEY(subject_id) REFERENCES subjects(id)
        );
        CREATE TABLE IF NOT EXISTS attendance_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attendance_id INTEGER,
            student_id INTEGER NOT NULL,
            subject_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            old_status TEXT,
            new_status TEXT NOT NULL,
            changed_by INTEGER NOT NULL,
            reason TEXT,
            changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS attendance_qr (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            faculty_id INTEGER NOT NULL,
            qr_token TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            latitude REAL,
            longitude REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
} catch (e) {}

// Migrations for results management
try {
    db.prepare("ALTER TABLE subjects ADD COLUMN credits INTEGER DEFAULT 3").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE results ADD COLUMN internal_marks INTEGER DEFAULT 0").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE results ADD COLUMN external_marks INTEGER DEFAULT 0").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE results ADD COLUMN credits_obtained INTEGER DEFAULT 0").run();
} catch (e) {}

// Seed initial data if empty or missing librarian
const librarianExists = db.prepare("SELECT count(*) as count FROM users WHERE role = 'librarian'").get() as { count: number };
const adminExists = db.prepare("SELECT count(*) as count FROM users WHERE role = 'admin'").get() as { count: number };

const hashedPasswordDefault = bcrypt.hashSync("password123", 10);

// Seed initial data
if (adminExists.count === 0) {
    db.prepare("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
        "Admin User", "admin@college.edu", hashedPasswordDefault, "admin"
    );
}

if (librarianExists.count === 0) {
    db.prepare("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
        "Mr. Librarian", "librarian@college.edu", hashedPasswordDefault, "librarian"
    );
}

// Create Faculty if not exists
const facultyCountActual = db.prepare("SELECT count(*) as count FROM users WHERE role = 'faculty'").get() as { count: number };
if (facultyCountActual.count < 5) {
    const sampleFaculty = [
        { name: "Dr. Anil Kumar", email: "anil.kumar@college.edu", department: "Computer Science" },
        { name: "Prof. Sneha Reddy", email: "sneha.reddy@college.edu", department: "Information Science" },
        { name: "Dr. Rajesh Sharma", email: "rajesh.sharma@college.edu", department: "Mechanical Engineering" },
        { name: "Prof. Kavya Nair", email: "kavya.nair@college.edu", department: "Electrical Engineering" },
        { name: "Dr. Vivek Singh", email: "vivek.singh@college.edu", department: "Civil Engineering" },
        { name: "Prof. Priya Iyer", email: "priya.iyer@college.edu", department: "Electronics and Communication" },
        { name: "Dr. Arjun Mehta", email: "arjun.mehta@college.edu", department: "Artificial Intelligence" },
        { name: "Prof. Neha Gupta", email: "neha.gupta@college.edu", department: "Data Science" },
        { name: "Dr. Rohit Verma", email: "rohit.verma@college.edu", department: "Physics" },
        { name: "Prof. Shalini Das", email: "shalini.das@college.edu", department: "Mathematics" }
    ];

    for (const f of sampleFaculty) {
        db.prepare("INSERT OR IGNORE INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)").run(
            f.name, f.email, hashedPasswordDefault, "faculty", f.department
        );
    }
    
    // Add Sample Events if few exist
    const eventsCount = db.prepare("SELECT count(*) as count FROM events").get() as { count: number };
    if (eventsCount.count < 5) {
        const sampleEvents = [
            { title: "Hack-A-Thon 2026", description: "24-hour hackathon focused on solving real-world problems using AI and web technologies.", date: "2026-09-15 09:00:00", registration_deadline: "2026-09-10 23:59:59", category: "technical", coordinator: "Dr. Anil Kumar", venue: "Main Auditorium", organizer: "Coding Club", department: "Computer Science" },
            { title: "ML Fundamentals Workshop", description: "Workshop on Machine Learning fundamentals and hands-on model building.", date: "2026-10-05 10:00:00", registration_deadline: "2026-10-01 23:59:59", category: "technical", coordinator: "Prof. Neha Gupta", venue: "Lab 204", organizer: "AI Society", department: "Artificial Intelligence" },
            { title: "Algo-Challenge", description: "Coding contest with algorithmic challenges and real-time leaderboard.", date: "2026-08-25 14:00:00", registration_deadline: "2026-08-20 23:59:59", category: "technical", coordinator: "Prof. Sneha Reddy", venue: "Computer Lab 1", organizer: "Tech Club", department: "Information Science" },
            { title: "Groove & Move", description: "Dance competition featuring solo and group performances.", date: "2026-09-20 17:00:00", registration_deadline: "2026-09-15 23:59:59", category: "cultural", coordinator: "Prof. Shalini Das", venue: "Open Stage", organizer: "Cultural Committee", department: "Arts" },
            { title: "Melody Night", description: "Music night with band performances and singing competition.", date: "2026-10-12 18:30:00", registration_deadline: "2026-10-08 23:59:59", category: "cultural", coordinator: "Prof. Priya Iyer", venue: "Auditorium", organizer: "Music Club", department: "Electronics and Communication" },
            { title: "Stage Craft", description: "Drama and skit competition based on social themes.", date: "2026-11-02 16:00:00", registration_deadline: "2026-10-28 23:59:59", category: "cultural", coordinator: "Dr. Vivek Singh", venue: "Seminar Hall", organizer: "Drama Club", department: "Civil Engineering" },
            { title: "Campus Fest 2026", description: "Annual college fest featuring technical, cultural, and sports activities.", date: "2026-12-05 09:00:00", registration_deadline: "2026-11-25 23:59:59", category: "college_fest", coordinator: "Dr. Rajesh Sharma", venue: "College Ground", organizer: "Fest Committee", department: "Mechanical Engineering" },
            { title: "Food Carnival", description: "Food fest with stalls, competitions, and live entertainment.", date: "2026-12-06 11:00:00", registration_deadline: "2026-11-28 23:59:59", category: "college_fest", coordinator: "Prof. Kavya Nair", venue: "Campus Lawn", organizer: "Hospitality Team", department: "Electrical Engineering" },
            { title: "Celebrity Night", description: "DJ night and celebrity performance as part of annual fest.", date: "2026-12-07 19:00:00", registration_deadline: "2026-11-30 23:59:59", category: "college_fest", coordinator: "Dr. Arjun Mehta", venue: "Main Stage", organizer: "Event Management Team", department: "Data Science" },
            { title: "Inter-Dept Cricket", description: "Inter-department cricket tournament with knockout format.", date: "2026-09-18 08:30:00", registration_deadline: "2026-09-12 23:59:59", category: "sports", coordinator: "Dr. Rohit Verma", venue: "College Cricket Ground", organizer: "Sports Committee", department: "Physical Education" },
            { title: "Football League", description: "Football tournament with league and finals.", date: "2026-10-10 15:00:00", registration_deadline: "2026-10-05 23:59:59", category: "sports", coordinator: "Dr. Rajesh Sharma", venue: "Football Field", organizer: "Football Club", department: "Mechanical Engineering" },
            { title: "Athletics Meet", description: "Athletics meet including 100m, 200m, relay, and long jump events.", date: "2026-11-15 07:30:00", registration_deadline: "2026-11-08 23:59:59", category: "sports", coordinator: "Prof. Kavya Nair", venue: "Athletics Track", organizer: "Sports Council", department: "Electrical Engineering" },
            { title: "Badminton Open", description: "Badminton singles and doubles competition.", date: "2026-08-28 10:00:00", registration_deadline: "2026-08-22 23:59:59", category: "sports", coordinator: "Prof. Sneha Reddy", venue: "Indoor Stadium", organizer: "Badminton Club", department: "Information Science" },
            { title: "Basketball Invitational", description: "Basketball tournament with inter-college participation.", date: "2026-12-01 16:00:00", registration_deadline: "2026-11-20 23:59:59", category: "sports", coordinator: "Dr. Anil Kumar", venue: "Basketball Court", organizer: "Sports Committee", department: "Computer Science" }
        ];

        const adminUser = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
        const adminId = adminUser ? adminUser.id : 1;

        for (const e of sampleEvents) {
            const coordinator = db.prepare("SELECT id FROM users WHERE name = ?").get(e.coordinator) as any;
            const coordId = coordinator ? coordinator.id : adminId;

            db.prepare(`
                INSERT INTO events (title, description, date, registration_deadline, category, coordinator_id, venue, organizer, department, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                e.title, e.description, e.date, e.registration_deadline, e.category, coordId, e.venue, e.organizer, e.department, adminId
            );
        }
    }
    
    db.prepare("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
        "Dr. Smith", "faculty@college.edu", hashedPasswordDefault, "faculty"
    );
}
    
    // Create 10 Requested Students if they don't exist
// Seed specified subjects if empty
    const subjectsToSeed = [
        { code: "CS401", name: "DBMS", sem: 4 },
        { code: "MA401", name: "Linear Algebra", sem: 4 },
        { code: "CS402", name: "Design Algorithm and Analysis", sem: 4 },
        { code: "CS403", name: "Java", sem: 4 },
        { code: "CS404", name: "Python", sem: 4 }
    ];
    
    // Clear and re-seed to ensure correct subjects for the task
    db.prepare("PRAGMA foreign_keys = OFF").run();
    db.prepare("DROP TABLE IF EXISTS subjects").run();
    db.prepare(`
        CREATE TABLE subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            semester INTEGER NOT NULL,
            department TEXT NOT NULL,
            credits INTEGER DEFAULT 3,
            teacher_id INTEGER,
            UNIQUE(code, department)
        )
    `).run();
    
    const insertSub = db.prepare("INSERT OR IGNORE INTO subjects (code, name, semester, department, credits) VALUES (?, ?, ?, ?, ?)");
    
    // Seed branch subjects
    Object.keys(vtuScheme).forEach(dept => {
        if (dept === "common") return;
        
        // Seed common subjects for each dept in Sem 1 & 2
        Object.keys(vtuScheme.common).forEach(sem => {
            vtuScheme.common[sem].forEach((s: any) => {
                insertSub.run(s.code, s.name, parseInt(sem), dept, s.credits);
            });
        });
        
        // Seed dept specific subjects
        Object.keys(vtuScheme[dept] || {}).forEach(sem => {
            vtuScheme[dept][sem].forEach((s: any) => {
                insertSub.run(s.code, s.name, parseInt(sem), dept, s.credits);
            });
        });
    });
    db.prepare("PRAGMA foreign_keys = ON").run();

const requestedStudents = [
    { name: "Aarav Mehta", email: "student1@college.edu", roll: "CS2026001", sem: 4, dept: "CSE" },
    { name: "Diya Kapoor", email: "student2@college.edu", roll: "IS2026001", sem: 4, dept: "ISE" },
    { name: "Rohan Iyer", email: "student3@college.edu", roll: "EC2026001", sem: 4, dept: "ECE" },
    { name: "Meera Joshi", email: "student4@college.edu", roll: "ME2026001", sem: 4, dept: "MECH" },
    { name: "Kunal Singh", email: "student5@college.edu", roll: "CV2026001", sem: 4, dept: "CIVIL" },
    { name: "Ananya Shetty", email: "student6@college.edu", roll: "DS2026001", sem: 4, dept: "DS" },
    { name: "Vivaan Sharma", email: "student7@college.edu", roll: "AI2026001", sem: 4, dept: "AI" },
    { name: "Siya Gupta", email: "student8@college.edu", roll: "EE2026001", sem: 4, dept: "EEE" },
];

    for (const s of requestedStudents) {
        let user = db.prepare("SELECT id FROM users WHERE email = ?").get(s.email) as { id: number };
        if (!user) {
            const pass = bcrypt.hashSync("pass123", 10);
            const userResult = db.prepare("INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)").run(
                s.name, s.email, pass, "student", s.dept
            );
            user = { id: Number(userResult.lastInsertRowid) };
            console.log(`[Seeding] Created user: ${s.name} (${s.email})`);
        } else {
            db.prepare("UPDATE users SET department = ? WHERE id = ?").run(s.dept, user.id);
        }
        
        let studentRecord = db.prepare("SELECT id FROM students WHERE user_id = ?").get(user.id) as any;
        if (!studentRecord) {
            const res = db.prepare("INSERT INTO students (user_id, roll_number, semester, cgpa, fee_status) VALUES (?, ?, ?, ?, ?)").run(
                user.id, s.roll, s.sem, 0, "paid"
            );
            studentRecord = { id: Number(res.lastInsertRowid) };
            console.log(`[Seeding] Created student record for: ${s.name} (Roll: ${s.roll})`);
        } else {
            db.prepare("UPDATE students SET roll_number = ?, semester = ? WHERE id = ?").run(s.roll, s.sem, studentRecord.id);
        }

        // Clear and re-seed results history for the demo
        db.prepare("DELETE FROM results WHERE student_id = ?").run(studentRecord.id);
        
        const currentSem = s.sem;
        let totalOverallWeightedSum = 0;
        let totalOverallCredits = 0;
        let currentSemWeightedSum = 0;
        let currentSemCredits = 0;

        for (let sem = 1; sem <= currentSem; sem++) {
            const branch = ["1", "2"].includes(sem.toString()) ? "common" : s.dept;
            const subs = vtuScheme[branch]?.[sem.toString()] || [];
            
            for (const sub of subs) {
                const dbSub = db.prepare("SELECT id, credits FROM subjects WHERE code = ? AND department = ?").get(sub.code, s.dept) as any;
                if (dbSub) {
                    const internal = 35 + Math.floor(Math.random() * 15);
                    const external = 25 + Math.floor(Math.random() * 25);
                    const total = internal + external;
                    
                    let grade = "F";
                    if (total >= 90) grade = "O";
                    else if (total >= 80) grade = "A+";
                    else if (total >= 70) grade = "A";
                    else if (total >= 60) grade = "B+";
                    else if (total >= 55) grade = "B";
                    else if (total >= 50) grade = "C";
                    
                    const credsObtained = grade === "F" ? 0 : dbSub.credits;
                    const points = gradePoints[grade] || 0;
                    const subCredits = dbSub.credits || 3;

                    totalOverallWeightedSum += (subCredits * points);
                    totalOverallCredits += subCredits;

                    if (sem === currentSem) {
                        currentSemWeightedSum += (subCredits * points);
                        currentSemCredits += subCredits;
                    }
                    
                    db.prepare(`
                        INSERT INTO results (student_id, semester, subject_id, internal_marks, external_marks, marks, grade, credits_obtained)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `).run(studentRecord.id, sem, dbSub.id, internal, external, total, grade, credsObtained);
                }
            }
        }
        const finalCgpa = totalOverallCredits > 0 ? (totalOverallWeightedSum / totalOverallCredits).toFixed(2) : "0.00";
        const finalSgpa = currentSemCredits > 0 ? (currentSemWeightedSum / currentSemCredits).toFixed(2) : "0.00";
        db.prepare("UPDATE students SET cgpa = ?, sgpa = ? WHERE id = ?").run(finalCgpa, finalSgpa, studentRecord.id);

        console.log(`[Seeding] Refreshed results history and GPA for: ${s.name} (CGPA: ${finalCgpa}, SGPA: ${finalSgpa})`);

        // Seed some fees if none exist for this student
        const feeCount = db.prepare("SELECT count(*) as count FROM fees WHERE student_id = ?").get(studentRecord.id) as { count: number };
        if (feeCount.count === 0) {
            db.prepare("INSERT INTO fees (student_id, amount, due_date, status) VALUES (?, ?, ?, ?)").run(
                studentRecord.id,
                45000 + (Math.random() * 20000),
                "2026-06-15",
                Math.random() > 0.5 ? "paid" : "pending"
            );
            console.log(`[Seeding] Created fee record for: ${s.name}`);
        }

        // Seed some attendance if none exists
        const attCount = db.prepare("SELECT count(*) as count FROM attendance WHERE student_id = ?").get(studentRecord.id) as { count: number };
        if (attCount.count === 0) {
            const subs = db.prepare("SELECT id FROM subjects WHERE department = ? AND semester = ?").all(s.dept, s.sem);
            for (const sub of subs) {
                // Add 10-15 attendance records
                const count = 10 + Math.floor(Math.random() * 5);
                for (let i = 0; i < count; i++) {
                    const status = Math.random() > 0.2 ? 'present' : 'absent';
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    db.prepare("INSERT INTO attendance (student_id, subject_id, date, status) VALUES (?, ?, ?, ?)").run(
                        studentRecord.id, (sub as any).id, date.toISOString().split('T')[0], status
                    );
                }
            }
            console.log(`[Seeding] Created attendance records for: ${s.name}`);
        }
    }

    // Seed Study Materials
    const materialCount = db.prepare("SELECT count(*) as count FROM materials").get() as { count: number };
    if (materialCount.count === 0) {
        const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
        if (admin) {
            const sampleMaterials = [
                { title: 'Data Structures Model Question Paper 2024', type: 'model_paper', dept: 'CSE', sem: 3, subject: 'DS', url: 'https://vtu.ac.in/pdf/asyllabus/physics_cycle_2022.pdf' },
                { title: 'Operating Systems Previous Year solved paper', type: 'pyq', dept: 'CSE', sem: 4, subject: 'OS', url: 'https://vtu.ac.in/pdf/asyllabus/chem_cycle_2022.pdf' },
                { title: 'DSATM Discrete Mathematics Question Bank', type: 'question_bank', dept: 'CSE', sem: 3, subject: 'Discrete Mathematics', url: 'https://vtu.ac.in/pdf/asyllabus/2022/bme.pdf' },
                { title: 'Computer Networks Standard Textbook', type: 'textbook', dept: 'ISE', sem: 5, subject: 'CN', url: 'https://vtu.ac.in/pdf/asyllabus/2022/phy.pdf' }
            ];

            for (const sm of sampleMaterials) {
                const sub = db.prepare("SELECT id FROM subjects WHERE department = ? AND semester = ? AND (name LIKE ? OR code LIKE ?) LIMIT 1")
                    .get(sm.dept, sm.sem, `%${sm.subject}%`, `%${sm.subject}%`) as any;
                
                db.prepare(`
                    INSERT INTO materials (title, type, subject_id, semester, url, uploaded_by)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(sm.title, sm.type, sub ? sub.id : 1, sm.sem, sm.url, admin.id);
            }
            console.log("[Seeding] Created 4 sample study materials.");
        }
    }

    // Seed Time Slots if empty
    const timeSlotsCount = db.prepare("SELECT count(*) as count FROM time_slots").get() as { count: number };
    if (timeSlotsCount.count === 0) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const slots = [
            { period: 1, start: '09:00', end: '10:00' },
            { period: 2, start: '10:00', end: '11:00' },
            { period: 3, start: '11:15', end: '12:15' },
            { period: 4, start: '12:15', end: '13:15' },
            { period: 5, start: '14:00', end: '15:00' },
            { period: 6, start: '15:00', end: '16:00' },
        ];
        
        const insertSlot = db.prepare("INSERT INTO time_slots (day, start_time, end_time, period_number) VALUES (?, ?, ?, ?)");
        days.forEach(day => {
            slots.forEach(slot => {
                insertSlot.run(day, slot.start, slot.end, slot.period);
            });
        });
        console.log("[Seeding] Created 36 time slots.");
    }

    // Seed Rooms if empty
    const roomsCount = db.prepare("SELECT count(*) as count FROM rooms").get() as { count: number };
    if (roomsCount.count === 0) {
        const rooms = [
            { name: 'LH-101', type: 'classroom' }, { name: 'LH-102', type: 'classroom' },
            { name: 'LH-201', type: 'classroom' }, { name: 'LH-202', type: 'classroom' },
            { name: 'CS-LAB-1', type: 'lab' }, { name: 'CS-LAB-2', type: 'lab' },
            { name: 'EC-LAB-1', type: 'lab' }, { name: 'ME-WORKSHOP', type: 'lab' }
        ];
        const insertRoom = db.prepare("INSERT INTO rooms (room_name, type) VALUES (?, ?)");
        rooms.forEach(r => insertRoom.run(r.name, r.type));
        console.log("[Seeding] Created 8 rooms.");
    }

    // Seed Timetable Entries for Demo Students (Smart Population)
    const entryCount = db.prepare("SELECT count(*) as count FROM timetable_entries").get() as { count: number };
    if (entryCount.count === 0) {
        const departments = Object.keys(vtuScheme).filter(d => d !== 'common');
        const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
        const faculty = db.prepare("SELECT id FROM users WHERE role = 'faculty'").all() as any[];
        const rooms = db.prepare("SELECT id FROM rooms").all() as any[];
        const slots = db.prepare("SELECT id FROM time_slots").all() as any[];
        
        if (faculty.length > 0 && rooms.length > 0 && slots.length > 0) {
            departments.forEach(dept => {
                semesters.forEach(sem => {
                    // Create a timetable record
                    const res = db.prepare("INSERT INTO timetables (department, semester, academic_year) VALUES (?, ?, ?)").run(
                        dept, sem, "2025-26"
                    );
                    const ttId = Number(res.lastInsertRowid);
                    
                    // Get subjects for this dept/sem
                    const subs = db.prepare("SELECT id FROM subjects WHERE department = ? AND semester = ?").all(dept, sem) as any[];
                    
                    if (subs.length > 0) {
                        // Seed specific entries for Monday and Tuesday to show "Current Class"
                        // Pick first 4 slots for each day
                        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(day => {
                            const daySlots = db.prepare("SELECT id FROM time_slots WHERE day = ? ORDER BY period_number").all(day) as any[];
                            for (let i = 0; i < Math.min(subs.length, daySlots.length); i++) {
                                // Simple mapping: one subject per slot
                                db.prepare(`
                                    INSERT INTO timetable_entries (timetable_id, subject_id, faculty_id, room_id, time_slot_id)
                                    VALUES (?, ?, ?, ?, ?)
                                `).run(
                                    ttId,
                                    subs[i].id,
                                    faculty[i % faculty.length].id,
                                    rooms[i % rooms.length].id,
                                    daySlots[i].id
                                );
                            }
                        });
                    }
                });
            });
            console.log("[Seeding] Automatically populated timetables for all departments and semesters.");
        }
    }
console.log("[Seeding] Completed requested students check.");

// Background Deadline Worker (Simulates email/reports)
setInterval(() => {
    try {
        const now = new Date().toISOString();
        const pendingEvents = db.prepare(`
            SELECT e.id, e.title, e.coordinator_id, e.created_by, u.name as coordinator_name, u.email as coordinator_email
            FROM events e
            LEFT JOIN users u ON e.coordinator_id = u.id
            WHERE e.registration_deadline < ? AND e.is_reported = 0
        `).all(now) as any[];

        for (const event of pendingEvents) {
            const registrations = db.prepare(`
                SELECT student_name, student_usn 
                FROM event_registrations 
                WHERE event_id = ?
            `).all(event.id) as any[];

            const recipientId = event.coordinator_id || event.created_by;
            if (recipientId) {
                const count = registrations.length;
                const studentList = registrations.map(r => `${r.student_name} (${r.student_usn})`).join(", ");
                const message = `Registration report for "${event.title}": Total ${count} students registered. Students: ${studentList}`;
                
                // Add to internal notifications
                db.prepare("INSERT INTO notifications (title, message, type, user_id) VALUES (?, ?, ?, ?)")
                    .run("Registration Deadline Reached", message, "event", recipientId);
                
                console.log(`[Deadline Worker] Notified ${event.coordinator_name || 'Creator'} about event ${event.title}`);
            }

            db.prepare("UPDATE events SET is_reported = 1 WHERE id = ?").run(event.id);
        }
    } catch (err) {
        console.error("Error in Deadline Worker:", err);
    }
}, 60000); // Check every minute
// Library Status
const statusCount = db.prepare("SELECT count(*) as count FROM library_status").get() as { count: number };
if (statusCount.count === 0) {
    db.prepare("INSERT INTO library_status (status) VALUES (?)").run("open");
}
    // Seed some books if empty
    const bookCount = db.prepare("SELECT count(*) as count FROM books").get() as { count: number };
    if (bookCount.count === 0) {
        db.prepare("INSERT INTO books (title, author, category) VALUES (?, ?, ?)").run(
            "Clean Code", "Robert C. Martin", "Software Engineering"
        );
        db.prepare("INSERT INTO books (title, author, category) VALUES (?, ?, ?)").run(
            "The Pragmatic Programmer", "Andrew Hunt", "Software Engineering"
        );
    }

    // Seed some alumni if empty
    const alumniCount = db.prepare("SELECT count(*) as count FROM alumni").get() as { count: number };
    if (alumniCount.count === 0) {
        const alumniData = [
            { name: "John Doe", batch: 2022, contact: "john@example.com", career: "Software Engineer at Google", achievements: "Lead Developer of CampusFlow v1", img: "https://api.dicebear.com/7.x/initials/svg?seed=JD" },
            { name: "Jane Smith", batch: 2021, contact: "jane@example.com", career: "Product Manager at Microsoft", achievements: "Top Rank in University", img: "https://api.dicebear.com/7.x/initials/svg?seed=JS" },
            { name: "Robert Wilson", batch: 2020, contact: "robert@example.com", career: "CTO at StartupX", achievements: "Founded the Coding Club", img: "https://api.dicebear.com/7.x/initials/svg?seed=RW" }
        ];
        const insertAlumni = db.prepare("INSERT INTO alumni (name, batch_year, contact_details, career_info, achievements, image_url) VALUES (?, ?, ?, ?, ?, ?)");
        for (const a of alumniData) {
            insertAlumni.run(a.name, a.batch, a.contact, a.career, a.achievements, a.img);
        }
    }

    // Seed some IA schedules if empty
    const iaCount = db.prepare("SELECT count(*) as count FROM ia_schedules").get() as { count: number };
    if (iaCount.count === 0) {
        const subjects = db.prepare("SELECT id FROM subjects").all() as any[];
        if (subjects.length > 0) {
            const today = new Date();
            
            // IA 1: Exactly 1 week from now (triggers notification)
            const futureDate1 = new Date();
            futureDate1.setDate(today.getDate() + 7);
            const dateStr1 = futureDate1.toISOString().split('T')[0];
            
            db.prepare("INSERT INTO ia_schedules (subject_id, ia_number, date) VALUES (?, ?, ?)").run(
                subjects[0].id, 1, dateStr1
            );

            // IA 2: In 2 weeks
            if (subjects.length > 1) {
                const futureDate2 = new Date();
                futureDate2.setDate(today.getDate() + 14);
                const dateStr2 = futureDate2.toISOString().split('T')[0];
                db.prepare("INSERT INTO ia_schedules (subject_id, ia_number, date) VALUES (?, ?, ?)").run(
                    subjects[1].id, 2, dateStr2
                );
            }
        }
    }

    // Seed Rooms if empty
    const roomCount = db.prepare("SELECT count(*) as count FROM rooms").get() as { count: number };
    if (roomCount.count === 0) {
        const rooms = [
            { name: "LH-101", type: "classroom", capacity: 60 },
            { name: "LH-102", type: "classroom", capacity: 60 },
            { name: "LH-103", type: "classroom", capacity: 60 },
            { name: "LH-201", type: "classroom", capacity: 60 },
            { name: "LH-202", type: "classroom", capacity: 60 },
            { name: "DS-LAB-1", type: "lab", capacity: 30 },
            { name: "DS-LAB-2", type: "lab", capacity: 30 },
            { name: "EC-LAB-1", type: "lab", capacity: 30 },
            { name: "ME-LAB-1", type: "lab", capacity: 30 },
            { name: "Seminar-1", type: "classroom", capacity: 100 }
        ];
        const insertRoom = db.prepare("INSERT INTO rooms (room_name, type, capacity) VALUES (?, ?, ?)");
        for (const r of rooms) {
            insertRoom.run(r.name, r.type, r.capacity);
        }
    }

    // Seed Time Slots if empty
    const slotCount = db.prepare("SELECT count(*) as count FROM time_slots").get() as { count: number };
    if (slotCount.count === 0) {
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const slots = [
            { start: "09:00", end: "10:00", num: 1 },
            { start: "10:00", end: "11:00", num: 2 },
            { start: "11:15", end: "12:15", num: 3 },
            { start: "12:15", end: "01:15", num: 4 },
            { start: "02:00", end: "03:00", num: 5 },
            { start: "03:00", end: "04:00", num: 6 },
            { start: "04:00", end: "05:00", num: 7 }
        ];
        const insertSlot = db.prepare("INSERT INTO time_slots (day, start_time, end_time, period_number) VALUES (?, ?, ?, ?)");
        for (const day of days) {
            for (const slot of slots) {
                insertSlot.run(day, slot.start, slot.end, slot.num);
            }
        }
    }

    // Seed Study Materials if empty
    const materialsCount = db.prepare("SELECT count(*) as count FROM materials").get() as { count: number };
    if (materialsCount.count === 0) {
        const adminId = (db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as any)?.id || 1;
        const dbmsSub = db.prepare("SELECT id FROM subjects WHERE name = 'DBMS' LIMIT 1").get() as any;
        const algoSub = db.prepare("SELECT id FROM subjects WHERE name LIKE '%Algorithm%' LIMIT 1").get() as any;
        const javaSub = db.prepare("SELECT id FROM subjects WHERE name = 'Java' LIMIT 1").get() as any;
        const networksSub = db.prepare("SELECT id FROM subjects WHERE name LIKE '%Networks%' LIMIT 1").get() as any;

        const sampleMaterials = [
            { title: "DSATM DBMS Model Paper 2024", type: "model_paper", subjectId: dbmsSub?.id, semester: 4, url: "https://www.google.com/search?q=DSATM+DBMS+Model+Paper" },
            { title: "DSATM Analysis of Algorithms Model Paper", type: "model_paper", subjectId: algoSub?.id, semester: 4, url: "https://www.google.com/search?q=DSATM+Algorithms+Model+Paper" },
            { title: "Java Programming Question Bank DSATM", type: "question_bank", subjectId: javaSub?.id, semester: 4, url: "https://www.google.com/search?q=DSATM+Java+Question+Bank" },
            { title: "Computer Networks Previous Year Paper", type: "pyq", subjectId: networksSub?.id, semester: 5, url: "https://www.google.com/search?q=DSATM+CN+PYQ" }
        ];

        const insertMaterial = db.prepare("INSERT INTO materials (title, type, subject_id, semester, url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)");
        for (const m of sampleMaterials) {
            if (m.subjectId) {
                insertMaterial.run(m.title, m.type, m.subjectId, m.semester, m.url, adminId);
            }
        }
        console.log("[Seeding] Added sample DSATM study materials.");
    }

try {
    db.prepare("ALTER TABLE subjects ADD COLUMN capacity INTEGER DEFAULT 60").run();
} catch (e) {}

// IA Notification Logic for Faculty
function checkIANotifications() {
    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);
    const dateStr = oneWeekFromNow.toISOString().split('T')[0];

    // Find IAs that are exactly 1 week away
    const upcomingIAs = db.prepare(`
        SELECT ia.*, s.name as subject_name
        FROM ia_schedules ia
        JOIN subjects s ON ia.subject_id = s.id
        WHERE ia.date = ?
    `).all(dateStr) as any[];

    const facultyList = db.prepare("SELECT id FROM users WHERE role = 'faculty'").all() as any[];

    for (const ia of upcomingIAs) {
        const title = `Reminder: Upload Resources for ${ia.subject_name} IA ${ia.ia_number}`;
        const message = `Your IA is scheduled for ${ia.date} (in 1 week). Please upload model papers and question banks in the Study Materials section.`;
        
        for (const faculty of facultyList) {
            // Check if notification already exists for this specific IA reminder to avoid duplication
            const exists = db.prepare("SELECT id FROM notifications WHERE title = ? AND user_id = ?").get(title, faculty.id);
            if (!exists) {
                db.prepare("INSERT INTO notifications (title, message, target_role, user_id) VALUES (?, ?, ?, ?)").run(
                    title, message, 'faculty', faculty.id
                );
            }
        }
    }
}

async function startServer() {
    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        socket.on("join", (room) => {
            socket.join(room);
            console.log(`User ${socket.id} joined room: ${room}`);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    const PORT = 3000;

    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // Auth Middleware
    const authenticateToken = (req: any, res: any, next: any) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
            if (err) return res.status(403).json({ message: "Forbidden" });
            req.user = user;
            next();
        });
    };

    // --- API ROUTES ---

    // Users (for faculty selection)
    app.get("/api/users", authenticateToken, (req, res) => {
        const { role } = req.query;
        try {
            let query = "SELECT id, name, email, role, department FROM users";
            let params: any[] = [];
            
            if (role) {
                query += " WHERE role = ?";
                params.push(role);
            }
            
            const users = db.prepare(query).all(...params);
            res.json(users);
        } catch (e) {
            res.status(500).json({ message: "Failed to fetch users" });
        }
    });

    // Auth
    app.post("/api/auth/login", (req, res) => {
        const { email, password } = req.body;
        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
        
        if (user && bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
            res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    });

    // Student Dashboard Data
    app.get("/api/student/dashboard", authenticateToken, (req: any, res) => {
        if (req.user.role !== "student") return res.status(403).json({ message: "Forbidden" });
        
        const student = db.prepare(`
            SELECT s.*, u.name, u.email, u.department 
            FROM students s 
            JOIN users u ON s.user_id = u.id 
            WHERE u.id = ?
        `).get(req.user.id) as any;

        if (!student) {
            return res.json({ 
                student: { name: req.user.name, email: req.user.email, role: req.user.role },
                attendance: [],
                fees: [],
                notifications: db.prepare("SELECT * FROM notifications WHERE target_role IN ('student', 'all') ORDER BY created_at DESC LIMIT 5").all()
            });
        }

        const attendance = db.prepare(`
            SELECT sub.name, 
                   COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as percentage
            FROM subjects sub
            LEFT JOIN attendance a ON sub.id = a.subject_id AND a.student_id = ?
            WHERE sub.semester = ? AND sub.department = ?
            GROUP BY sub.id
        `).all(student.id, student.semester, student.department);

        const fees = db.prepare("SELECT * FROM fees WHERE student_id = ?").all(student.id);
        const notifications = db.prepare("SELECT * FROM notifications WHERE target_role IN ('student', 'all') ORDER BY created_at DESC LIMIT 5").all();

        res.json({ student, attendance, fees, notifications });
    });

    app.get("/api/student/results", authenticateToken, (req: any, res) => {
        const student = db.prepare(`
            SELECT s.id, s.semester, u.department 
            FROM students s 
            JOIN users u ON s.user_id = u.id 
            WHERE u.id = ?
        `).get(req.user.id) as any;

        if (!student) return res.status(404).json({ message: "Student record not found" });

        const results = db.prepare(`
            SELECT r.semester, r.marks, r.grade, r.internal_marks, r.external_marks, r.credits_obtained,
                   sub.name as subject_name, sub.code as subject_code, sub.credits as totalCredits
            FROM results r
            JOIN subjects sub ON r.subject_id = sub.id
            WHERE r.student_id = ?
        `).all(student.id) as any[];

        const semesterHistory: any = {};
        
        results.forEach(r => {
            if (!semesterHistory[r.semester]) {
                semesterHistory[r.semester] = { subjects: [], totalCredits: 0, weightedSum: 0 };
            }
            const credits = r.totalCredits || 3;
            const points = gradePoints[r.grade] || 0;
            
            semesterHistory[r.semester].subjects.push({
                name: r.subject_name,
                code: r.subject_code,
                grade: r.grade,
                internalMarks: r.internal_marks,
                externalMarks: r.external_marks,
                totalMarks: r.marks,
                creditsObtained: r.credits_obtained,
                points,
                totalCredits: credits
            });
            semesterHistory[r.semester].totalCredits += credits;
            semesterHistory[r.semester].weightedSum += (credits * points);
        });

        let totalOverallWeightedSum = 0;
        let totalOverallCredits = 0;
        
        const performance = Object.keys(semesterHistory).map(semKey => {
            const sem = semesterHistory[semKey];
            const sgpa = sem.totalCredits > 0 ? (sem.weightedSum / sem.totalCredits).toFixed(2) : "0.00";
            
            totalOverallWeightedSum += sem.weightedSum;
            totalOverallCredits += sem.totalCredits;
            
            return {
                semester: semKey,
                sgpa: parseFloat(sgpa),
                totalCredits: sem.totalCredits,
                subjects: sem.subjects
            };
        }).sort((a, b) => parseInt(a.semester) - parseInt(b.semester));

        const cgpa = totalOverallCredits > 0 ? (totalOverallWeightedSum / totalOverallCredits).toFixed(2) : "0.00";

        res.json({
            cgpa: parseFloat(cgpa),
            performance,
            department: student.department,
            currentSemester: student.semester
        });
    });

    app.get("/api/academic/courses", authenticateToken, (req: any, res) => {
        const student = db.prepare(`
            SELECT s.semester, u.department 
            FROM students s 
            JOIN users u ON s.user_id = u.id 
            WHERE u.id = ?
        `).get(req.user.id) as any;

        if (!student) return res.status(404).json({ message: "Student record not found" });

        const semester = student.semester;
        const department = student.department;

        // Fetch subjects for this semester and department OR department 'ALL'
        const courses = db.prepare(`
            SELECT * FROM subjects 
            WHERE semester = ? AND (department = ? OR department = 'ALL')
        `).all(semester, department);

        res.json({
            branch: department,
            semester: semester,
            courses
        });
    });

    // Student Profile
    app.get("/api/student/profile", authenticateToken, (req: any, res) => {
        const student = db.prepare(`
            SELECT s.*, u.name, u.email, u.department, u.role, u.avatar_url
            FROM users u
            LEFT JOIN students s ON s.user_id = u.id 
            WHERE u.id = ?
        `).get(req.user.id) as any;
        res.json(student);
    });

    app.post("/api/student/profile/avatar", authenticateToken, (req: any, res) => {
        const { avatarUrl } = req.body;
        db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(avatarUrl, req.user.id);
        res.json({ success: true, avatarUrl });
    });

    app.post("/api/student/profile/update", authenticateToken, (req: any, res) => {
        const { 
            contact, achievements, address, dob, gender, 
            blood_group, father_name, mother_name, 
            guardian_contact, enrollment_year 
        } = req.body;
        
        const user = db.prepare("SELECT role FROM users WHERE id = ?").get(req.user.id) as any;
        if (user.role === 'student') {
            const student = db.prepare("SELECT has_updated_profile, can_edit_profile FROM students WHERE user_id = ?").get(req.user.id) as any;
            
            if (student.has_updated_profile && !student.can_edit_profile) {
                return res.status(403).json({ message: "Profile is locked. Please contact administrator to make changes." });
            }

            db.prepare(`
                UPDATE students SET 
                    contact = ?, achievements = ?, address = ?, dob = ?, 
                    gender = ?, blood_group = ?, father_name = ?, 
                    mother_name = ?, guardian_contact = ?, enrollment_year = ?,
                    has_updated_profile = 1, can_edit_profile = 0
                WHERE user_id = ?
            `).run(
                contact, achievements, address, dob, gender, 
                blood_group, father_name, mother_name, 
                guardian_contact, enrollment_year, req.user.id
            );
            
            // Allow name update if not locked
            if (req.body.name) {
                db.prepare("UPDATE users SET name = ? WHERE id = ?").run(req.body.name, req.user.id);
            }
        }
        res.json({ success: true });
    });

    app.post("/api/admin/student/grant-edit", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { studentId } = req.body;
        db.prepare("UPDATE students SET can_edit_profile = 1 WHERE id = ?").run(studentId);
        res.json({ success: true });
    });

    app.get("/api/admin/students", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const students = db.prepare(`
            SELECT s.*, u.name, u.email, u.department
            FROM students s
            JOIN users u ON s.user_id = u.id
        `).all();
        res.json(students);
    });

    app.post("/api/faculty/attendance/qr/mark", authenticateToken, (req: any, res) => {
        if (req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        const { rollNumber, subjectId, date } = req.body;
        
        const student = db.prepare("SELECT id FROM students WHERE roll_number = ?").get(rollNumber) as any;
        if (!student) return res.status(404).json({ message: "Student with this Roll Number not found" });

        // Check for lock
        const locked = db.prepare("SELECT id FROM attendance_locks WHERE subject_id = ?").get(subjectId);
        if (locked && req.user.role !== 'admin') {
            return res.status(403).json({ message: "This subject is locked for attendance changes. Contact Admin." });
        }

        try {
            db.prepare("INSERT OR REPLACE INTO attendance (student_id, subject_id, date, status) VALUES (?, ?, ?, ?)").run(
                student.id, subjectId, date || new Date().toISOString().split('T')[0], 'present'
            );
            res.json({ success: true, studentName: student.name });
        } catch (e) {
            res.status(500).json({ message: "Failed to mark attendance" });
        }
    });

    // Subjects
    app.get("/api/subjects", authenticateToken, (req: any, res) => {
        const { semester, department } = req.query;
        try {
            let query = `
                SELECT s.*, u.name as teacher_name 
                FROM subjects s 
                LEFT JOIN users u ON s.teacher_id = u.id
            `;
            let params: any[] = [];
            let conditions: string[] = [];

            if (req.user.role === 'faculty') {
                conditions.push("s.teacher_id = ?");
                params.push(req.user.id);
            }
            
            let normalizedDept = department;
            if (department) {
                const deptStr = String(department).toLowerCase();
                if (deptStr.includes("computer") || deptStr.includes("cse")) normalizedDept = "CSE";
                else if (deptStr.includes("information") || deptStr.includes("ise")) normalizedDept = "ISE";
                else if (deptStr.includes("electronics") || deptStr.includes("ece")) normalizedDept = "ECE";
            }

            if (semester) {
                conditions.push("s.semester = ?");
                params.push(semester);
            }
            if (normalizedDept) {
                if (normalizedDept === 'ALL') {
                    conditions.push("s.department = 'ALL'");
                } else {
                    conditions.push("(s.department = ? OR s.department = 'ALL')");
                    params.push(normalizedDept);
                }
            }

            if (conditions.length > 0) {
                query += " WHERE " + conditions.join(" AND ");
            }
            
            const subjects = db.prepare(query).all(...params);
            res.json(subjects);
        } catch (e) {
            res.status(500).json({ message: "Failed to fetch subjects" });
        }
    });

    app.get("/api/results/student/:studentId/semester/:semester", authenticateToken, (req, res) => {
        const { studentId, semester } = req.params;
        try {
            const results = db.prepare(`
                SELECT r.*, s.name as subject_name, s.code as subject_code
                FROM results r
                JOIN subjects s ON r.subject_id = s.id
                WHERE r.student_id = ? AND r.semester = ?
            `).all(studentId, semester);
            res.json(results);
        } catch (e) {
            res.status(500).json({ message: "Failed to fetch results" });
        }
    });

    // Admin: Set Subject Teacher
    app.post("/api/admin/subjects/teacher", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { subjectId, teacherId } = req.body;
        db.prepare("UPDATE subjects SET teacher_id = ? WHERE id = ?").run(teacherId, subjectId);
        res.json({ success: true });
    });

    app.post("/api/admin/subjects", authenticateToken, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        const { code, name, semester, department, credits, capacity, teacher_id } = req.body;
        try {
            const result = db.prepare("INSERT INTO subjects (code, name, semester, department, credits, capacity, teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
                .run(code, name, semester, department, credits, capacity || 60, teacher_id || null);
            res.json({ id: result.lastInsertRowid });
        } catch (error) {
            res.status(400).json({ error: "Subject already exists or invalid data" });
        }
    });

    app.put("/api/admin/subjects/:id", authenticateToken, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        const { code, name, semester, department, credits, capacity, teacher_id } = req.body;
        const { id } = req.params;
        try {
            db.prepare("UPDATE subjects SET code = ?, name = ?, semester = ?, department = ?, credits = ?, capacity = ?, teacher_id = ? WHERE id = ?")
                .run(code, name, semester, department, credits, capacity || 60, teacher_id || null, id);
            res.json({ success: true });
        } catch (error) {
            res.status(400).json({ error: "Invalid data" });
        }
    });

    app.delete("/api/admin/subjects/:id", authenticateToken, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        const { id } = req.params;
        try {
            db.prepare("DELETE FROM subjects WHERE id = ?").run(id);
            res.json({ success: true });
        } catch (error) {
            res.status(400).json({ error: "Cannot delete subject" });
        }
    });

    app.get("/api/rooms", authenticateToken, (req, res) => {
        const rooms = db.prepare("SELECT * FROM rooms").all();
        res.json(rooms);
    });

    app.post("/api/admin/timetable-entries", authenticateToken, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        const { timetable_id, subject_id, faculty_id, room_id, time_slot_id } = req.body;
        
        // Conflict Check (Room & Faculty)
        const roomConflict = db.prepare("SELECT id FROM timetable_entries WHERE room_id = ? AND time_slot_id = ?").get(room_id, time_slot_id);
        if (roomConflict) return res.status(400).json({ error: "Room already occupied at this time" });
        
        const facultyConflict = db.prepare("SELECT id FROM timetable_entries WHERE faculty_id = ? AND time_slot_id = ?").get(faculty_id, time_slot_id);
        if (facultyConflict) return res.status(400).json({ error: "Faculty member already busy at this time" });

        try {
            const result = db.prepare(`
                INSERT INTO timetable_entries (timetable_id, subject_id, faculty_id, room_id, time_slot_id)
                VALUES (?, ?, ?, ?, ?)
            `).run(timetable_id, subject_id, faculty_id, room_id, time_slot_id);
            res.json({ id: result.lastInsertRowid });
        } catch (error) {
            res.status(400).json({ error: "Error creating entry" });
        }
    });

    app.delete("/api/admin/timetable-entries/:id", authenticateToken, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        db.prepare("DELETE FROM timetable_entries WHERE id = ?").run(req.params.id);
        res.json({ success: true });
    });

    // Attendance Stats for Graph
    app.get("/api/attendance/stats", authenticateToken, (req: any, res) => {
        const student = db.prepare("SELECT id FROM students WHERE user_id = ?").get(req.user.id) as any;
        if (!student) return res.status(400).json({ message: "Student not found" });

        const stats = db.prepare(`
            SELECT sub.name as subject,
                   date,
                   status
            FROM attendance a
            JOIN subjects sub ON a.subject_id = sub.id
            WHERE a.student_id = ?
            ORDER BY date ASC
        `).all(student.id);
        res.json(stats);
    });
    app.get("/api/materials", authenticateToken, (req, res) => {
        const materials = db.prepare(`
            SELECT m.*, s.name as subject_name, s.department, u.name as uploader_name
            FROM materials m 
            JOIN subjects s ON m.subject_id = s.id
            JOIN users u ON m.uploaded_by = u.id
        `).all();
        res.json(materials);
    });

    // Library
    app.get("/api/library/books", authenticateToken, (req, res) => {
        const { search } = req.query;
        let query = "SELECT * FROM books";
        let params = [];
        if (search) {
            query += " WHERE title LIKE ? OR author LIKE ?";
            params.push(`%${search}%`, `%${search}%`);
        }
        const books = db.prepare(query).all(...params);
        res.json(books);
    });

    // Events
    app.get("/api/events", authenticateToken, (req, res) => {
        const events = db.prepare(`
            SELECT e.*, u.name as coordinator_name 
            FROM events e 
            LEFT JOIN users u ON e.coordinator_id = u.id 
            ORDER BY date ASC
        `).all();
        res.json(events);
    });

    app.post("/api/events/register", authenticateToken, (req: any, res) => {
        const { eventId, name, usn } = req.body;
        
        // Check deadline
        const event = db.prepare("SELECT registration_deadline FROM events WHERE id = ?").get(eventId) as any;
        if (!event) return res.status(404).json({ message: "Event not found" });
        
        if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
            return res.status(400).json({ message: "Registration deadline has passed" });
        }

        const student = db.prepare("SELECT id FROM students WHERE user_id = ?").get(req.user.id) as any;
        if (!student) return res.status(400).json({ message: "Student record not found" });

        try {
            db.prepare("INSERT INTO event_registrations (event_id, student_id, student_name, student_usn) VALUES (?, ?, ?, ?)").run(
                eventId, student.id, name || req.user.name, usn
            );
            res.json({ success: true });
        } catch (e) {
            res.status(400).json({ message: "Already registered or error" });
        }
    });

    // Admin/Faculty: Get registered students for an event
    app.get("/api/events/:id/registrations", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin" && req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        
        const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id) as any;
        if (!event) return res.status(404).json({ message: "Event not found" });

        // If faculty, check if they are the coordinator or created it
        if (req.user.role === "faculty" && event.coordinator_id !== req.user.id && event.created_by !== req.user.id) {
            // Optional: return forbidden or allow viewing if it's in their department. 
            // For now, let's allow faculty to see all registrations in their department or where they are assigned.
            if (event.department !== req.user.department) {
                return res.status(403).json({ message: "Forbidden: Not your assigned event or department" });
            }
        }

        const registrations = db.prepare(`
            SELECT er.*, u.email, s.roll_number as db_usn, u.name as db_name
            FROM event_registrations er
            JOIN students s ON er.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE er.event_id = ?
        `).all(req.params.id);
        res.json(registrations);
    });

    // Lost & Found
    app.get("/api/lost-found", authenticateToken, (req, res) => {
        const items = db.prepare("SELECT lf.*, u.name as reporter_name FROM lost_found lf JOIN users u ON lf.reported_by = u.id ORDER BY created_at DESC").all();
        res.json(items);
    });

    app.post("/api/lost-found", authenticateToken, (req: any, res) => {
        const { itemName, description, type, imageUrl, location, dateReported } = req.body;
        const status = type === 'found' ? 'found' : 'lost';
        db.prepare("INSERT INTO lost_found (item_name, description, type, status, reported_by, image_url, location, date_reported) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
            itemName, description, type, status, req.user.id, imageUrl, location, dateReported
        );
        res.json({ success: true });
    });

    // Feedback
    app.post("/api/feedback", authenticateToken, (req: any, res) => {
        const { subject, message, isAnonymous } = req.body;
        const student = db.prepare("SELECT id FROM students WHERE user_id = ?").get(req.user.id) as any;
        db.prepare("INSERT INTO feedback (student_id, subject, message, is_anonymous) VALUES (?, ?, ?, ?)").run(
            isAnonymous ? null : student?.id, subject, message, isAnonymous ? 1 : 0
        );
        res.json({ success: true });
    });

    // --- Timetable Management ---

    // Get Rooms
    app.get("/api/timetable/rooms", authenticateToken, (req, res) => {
        try {
            const rooms = db.prepare("SELECT * FROM rooms").all();
            res.json(rooms);
        } catch (e) {
            res.status(500).json({ message: "Failed to fetch rooms" });
        }
    });

    // Get Time Slots
    app.get("/api/timetable/slots", authenticateToken, (req, res) => {
        try {
            const slots = db.prepare("SELECT * FROM time_slots ORDER BY period_number").all();
            res.json(slots);
        } catch (e) {
            res.status(500).json({ message: "Failed to fetch slots" });
        }
    });

    // Get Timetables list
    app.get("/api/admin/timetables", authenticateToken, (req, res) => {
        try {
            const timetables = db.prepare("SELECT * FROM timetables ORDER BY department, semester").all();
            res.json(timetables);
        } catch (e) {
            res.status(500).json({ message: "Failed to fetch timetables" });
        }
    });

    // Create Timetable Definition
    app.post("/api/admin/timetable", authenticateToken, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
        const { department, semester, section, academicYear } = req.body;
        try {
            // Check if already exists
            const existing = db.prepare("SELECT id FROM timetables WHERE department = ? AND semester = ? AND section = ?").get(department, semester, section) as any;
            if (existing) {
                return res.status(400).json({ message: "Timetable already exists for this class", id: existing.id });
            }

            const result = db.prepare(`
                INSERT INTO timetables (department, semester, section, academic_year)
                VALUES (?, ?, ?, ?)
            `).run(department, semester, section, academicYear);
            res.json({ id: result.lastInsertRowid });
        } catch (e) {
            res.status(500).json({ message: "Failed to create timetable" });
        }
    });

    // Get Timetable Entries
    app.get("/api/timetable", authenticateToken, (req: any, res) => {
        const { timetableId, department, semester, section, facultyId, studentId } = req.query;
        try {
            let query = `
                SELECT 
                    te.*, 
                    s.name as subject_name, s.code as subject_code,
                    r.room_name, r.type as room_type,
                    u.name as faculty_name,
                    ts.day, ts.start_time, ts.end_time, ts.period_number,
                    t.department, t.semester, t.section
                FROM timetable_entries te
                JOIN subjects s ON te.subject_id = s.id
                JOIN rooms r ON te.room_id = r.id
                JOIN users u ON te.faculty_id = u.id
                JOIN time_slots ts ON te.time_slot_id = ts.id
                JOIN timetables t ON te.timetable_id = t.id
            `;
            let params: any[] = [];
            let conditions = [];

            if (timetableId) {
                conditions.push("te.timetable_id = ?");
                params.push(timetableId);
            } else if (facultyId) {
                conditions.push("te.faculty_id = ?");
                params.push(facultyId);
            } else if (studentId) {
                const student = db.prepare("SELECT semester, department FROM students WHERE user_id = ?").get(studentId) as any;
                if (student) {
                    conditions.push("t.semester = ? AND t.department = ?");
                    params.push(student.semester, student.department);
                } else {
                    return res.json([]); // No student info found
                }
            } else {
                if (department) {
                    conditions.push("t.department = ?");
                    params.push(department);
                }
                if (semester) {
                    conditions.push("t.semester = ?");
                    params.push(semester);
                }
                if (section) {
                    conditions.push("t.section = ?");
                    params.push(section);
                }
            }

            if (conditions.length > 0) {
                query += " WHERE " + conditions.join(" AND ");
            }

            const entries = db.prepare(query).all(...params);
            res.json(entries);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: "Failed to fetch timetable" });
        }
    });

    // Create/Update Timetable Entry (Manual)
    app.post("/api/admin/timetable/entry", authenticateToken, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
        const { timetableId, subjectId, facultyId, roomId, timeSlotId } = req.body;

        if (!timetableId || !subjectId || !facultyId || !roomId || !timeSlotId) {
            return res.status(400).json({ message: "All fields are required" });
        }

        try {
            // Check for conflicts first
            const facultyConflict = db.prepare(`
                SELECT t.department, t.semester, ts.day, ts.period_number 
                FROM timetable_entries te
                JOIN time_slots ts ON te.time_slot_id = ts.id
                JOIN timetables t ON te.timetable_id = t.id
                WHERE te.faculty_id = ? AND te.time_slot_id = ? AND te.timetable_id != ?
            `).get(facultyId, timeSlotId, timetableId) as any;
            if (facultyConflict) return res.status(400).json({ message: `Faculty is already assigned to ${facultyConflict.department} Sem ${facultyConflict.semester} in this slot` });

            const roomConflict = db.prepare(`
                SELECT t.department, t.semester, ts.day, ts.period_number 
                FROM timetable_entries te
                JOIN time_slots ts ON te.time_slot_id = ts.id
                JOIN timetables t ON te.timetable_id = t.id
                WHERE te.room_id = ? AND te.time_slot_id = ? AND te.timetable_id != ?
            `).get(roomId, timeSlotId, timetableId) as any;
            if (roomConflict) return res.status(400).json({ message: "Room is already occupied in this slot" });

            db.prepare("DELETE FROM timetable_entries WHERE timetable_id = ? AND time_slot_id = ?").run(timetableId, timeSlotId);

            db.prepare(`
                INSERT INTO timetable_entries (timetable_id, subject_id, faculty_id, room_id, time_slot_id)
                VALUES (?, ?, ?, ?, ?)
            `).run(timetableId, subjectId, facultyId, roomId, timeSlotId);
            
            const tt = db.prepare("SELECT department, semester, section FROM timetables WHERE id = ?").get(timetableId) as any;
            if (tt) {
                io.emit("timetableChanged", { department: tt.department, semester: tt.semester, section: tt.section });
            }

            res.json({ message: "Entry updated successfully" });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: "Failed to update timetable entry" });
        }
    });

    // Delete Timetable
    app.delete("/api/admin/timetable/:id", authenticateToken, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
        const { id } = req.params;
        try {
            db.transaction(() => {
                db.prepare("DELETE FROM timetable_entries WHERE timetable_id = ?").run(id);
                db.prepare("DELETE FROM timetables WHERE id = ?").run(id);
            })();
            io.emit("timetableChanged", { all: true });
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ message: "Failed to delete timetable" });
        }
    });

    // Delete Timetable Entry
    app.delete("/api/admin/timetable/entry/:id", authenticateToken, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
        const { id } = req.params;
        try {
            const entry = db.prepare("SELECT t.department, t.semester, t.section FROM timetable_entries te JOIN timetables t ON te.timetable_id = t.id WHERE te.id = ?").get(id) as any;
            db.prepare("DELETE FROM timetable_entries WHERE id = ?").run(id);
            if (entry) {
                io.emit("timetableChanged", { department: entry.department, semester: entry.semester, section: entry.section });
            }
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ message: "Failed to delete entry" });
        }
    });

    // Auto-generate Timetable
    app.post("/api/admin/timetable/generate", authenticateToken, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
        const { timetableId } = req.body;

        try {
            const timetable = db.prepare("SELECT * FROM timetables WHERE id = ?").get(timetableId) as any;
            if (!timetable) return res.status(404).json({ message: "Timetable not found" });

            const subjects = db.prepare("SELECT * FROM subjects WHERE semester = ? AND department = ?").all(timetable.semester, timetable.department) as any[];
            if (subjects.length === 0) return res.status(400).json({ message: "No subjects found for this semester/department" });

            const slots = db.prepare("SELECT * FROM time_slots ORDER BY day, period_number").all() as any[];
            const rooms = db.prepare("SELECT * FROM rooms WHERE type = 'classroom'").all() as any[];

            db.prepare("DELETE FROM timetable_entries WHERE timetable_id = ?").run(timetableId);

            let slotIndex = 0;
            const insertEntry = db.prepare(`
                INSERT INTO timetable_entries (timetable_id, subject_id, faculty_id, room_id, time_slot_id)
                VALUES (?, ?, ?, ?, ?)
            `);

            for (const sub of subjects) {
                const targetHours = 3; 
                let assignedHours = 0;
                
                let facultyId = sub.teacher_id;
                if (!facultyId) {
                    const randomFaculty = db.prepare("SELECT id FROM users WHERE role = 'faculty' ORDER BY RANDOM() LIMIT 1").get() as any;
                    facultyId = randomFaculty ? randomFaculty.id : null;
                }
                if (!facultyId) continue;

                while (assignedHours < targetHours && slotIndex < slots.length) {
                    const slot = slots[slotIndex];
                    
                    const facultyBusy = db.prepare("SELECT id FROM timetable_entries WHERE faculty_id = ? AND time_slot_id = ?").get(facultyId, slot.id);
                    const roomBusy = db.prepare("SELECT id FROM timetable_entries WHERE room_id = ? AND time_slot_id = ?").get(rooms[0].id, slot.id);

                    if (!facultyBusy && !roomBusy) {
                        insertEntry.run(timetableId, sub.id, facultyId, rooms[0].id, slot.id);
                        assignedHours++;
                    }
                    slotIndex++;
                    if (slotIndex >= slots.length) break; 
                }
            }
            
            io.emit("timetableChanged", { department: timetable.department, semester: timetable.semester, section: timetable.section });

            res.json({ message: "Timetable generated with basic constraints" });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: "Failed to generate timetable" });
        }
    });

    // Substitution Management
    app.post("/api/admin/substitution", authenticateToken, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
        const { entryId, substituteFacultyId } = req.body;

        try {
            const entry = db.prepare("SELECT * FROM timetable_entries WHERE id = ?").get(entryId) as any;
            if (!entry) return res.status(404).json({ message: "Timetable entry not found" });

            db.prepare(`
                UPDATE timetable_entries 
                SET original_faculty_id = faculty_id, 
                    faculty_id = ?, 
                    is_substitution = 1 
                WHERE id = ?
            `).run(substituteFacultyId, entryId);

            db.prepare("INSERT INTO notifications (title, message, target_role, user_id) VALUES (?, ?, ?, ?)")
                .run("Timetable Substitution", "A substitute faculty has been assigned for your class.", "faculty", substituteFacultyId);
            
            const tt = db.prepare(`
                SELECT t.department, t.semester, t.section 
                FROM timetables t 
                JOIN timetable_entries te ON t.id = te.timetable_id 
                WHERE te.id = ?
            `).get(entryId) as any;
            if (tt) {
                io.emit("timetableChanged", { department: tt.department, semester: tt.semester, section: tt.section });
            }

            res.json({ message: "Substitution assigned successfully" });
        } catch (e) {
            res.status(500).json({ message: "Failed to assign substitution" });
        }
    });

    // Faculty: Request Substitution
    app.post("/api/faculty/substitution-request", authenticateToken, (req: any, res) => {
        if (req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        const { entryId, substituteFacultyId, reason } = req.body;

        try {
            db.prepare(`
                INSERT INTO substitution_requests (entry_id, faculty_id, substitute_faculty_id, reason)
                VALUES (?, ?, ?, ?)
            `).run(entryId, req.user.id, substituteFacultyId, reason);

            // Notify Admin
            db.prepare("INSERT INTO notifications (title, message, target_role) VALUES (?, ?, ?)")
                .run("New Substitution Request", `Faculty ${req.user.name} has requested a substitution for a class. Reason: ${reason}`, "admin");

            io.emit("substitutionRequested", { facultyId: req.user.id, facultyName: req.user.name });

            res.json({ message: "Request sent to admin" });
        } catch (e) {
            res.status(500).json({ message: "Failed to send request" });
        }
    });

    // Admin: Get Substitution Requests
    app.get("/api/admin/substitution-requests", authenticateToken, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
        try {
            const requests = db.prepare(`
                SELECT sr.*, u.name as faculty_name, sub.name as substitute_name, s.name as subject_name, ts.day, ts.period_number
                FROM substitution_requests sr
                JOIN users u ON sr.faculty_id = u.id
                LEFT JOIN users sub ON sr.substitute_faculty_id = sub.id
                JOIN timetable_entries te ON sr.entry_id = te.id
                JOIN subjects s ON te.subject_id = s.id
                JOIN time_slots ts ON te.time_slot_id = ts.id
                WHERE sr.status = 'pending'
            `).all();
            res.json(requests);
        } catch (e) {
            res.status(500).json({ message: "Failed to fetch requests" });
        }
    });

    // Admin: Approve/Reject Substitution Request
    app.post("/api/admin/substitution/approve", authenticateToken, (req: any, res) => {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
        const { requestId, status } = req.body;

        try {
            const request = db.prepare("SELECT * FROM substitution_requests WHERE id = ?").get(requestId) as any;
            if (!request) return res.status(404).json({ message: "Request not found" });

            db.prepare("UPDATE substitution_requests SET status = ? WHERE id = ?").run(status, requestId);

            if (status === 'approved') {
                db.prepare(`
                    UPDATE timetable_entries 
                    SET original_faculty_id = faculty_id, 
                        faculty_id = ?, 
                        is_substitution = 1 
                    WHERE id = ?
                `).run(request.substitute_faculty_id, request.entry_id);

                db.prepare("INSERT INTO notifications (title, message, target_role, user_id) VALUES (?, ?, ?, ?)")
                    .run("Timetable Updated", "Your substitution request has been approved.", "faculty", request.faculty_id);
                
                db.prepare("INSERT INTO notifications (title, message, target_role, user_id) VALUES (?, ?, ?, ?)")
                    .run("New Class Assigned", "You have been assigned as a substitute for a class.", "faculty", request.substitute_faculty_id);

                const tt = db.prepare(`
                    SELECT t.department, t.semester, t.section 
                    FROM timetables t 
                    JOIN timetable_entries te ON t.id = te.timetable_id 
                    WHERE te.id = ?
                `).get(request.entry_id) as any;
                if (tt) {
                    io.emit("timetableChanged", { department: tt.department, semester: tt.semester, section: tt.section });
                }
            } else {
                db.prepare("INSERT INTO notifications (title, message, target_role, user_id) VALUES (?, ?, ?, ?)")
                    .run("Substitution Rejected", "Your substitution request has been rejected.", "faculty", request.faculty_id);
            }

            res.json({ message: `Request ${status}` });
        } catch (e) {
            res.status(500).json({ message: "Action failed" });
        }
    });

    // Faculty Analysis
    app.get("/api/faculty/analysis", authenticateToken, (req: any, res) => {
        if (req.user.role !== "faculty" && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        
        checkIANotifications();

        let statsQuery = `
            SELECT 
                COUNT(CASE WHEN s.cgpa >= 9.0 THEN 1 END) as excelling,
                COUNT(CASE WHEN s.cgpa >= 7.5 AND s.cgpa < 9.0 THEN 1 END) as good,
                COUNT(CASE WHEN s.cgpa >= 6.0 AND s.cgpa < 7.5 THEN 1 END) as average,
                COUNT(CASE WHEN s.cgpa < 6.0 THEN 1 END) as weak
            FROM students s
            JOIN users u ON s.user_id = u.id
        `;
        let topStudentsQuery = `
            SELECT u.name, s.cgpa, u.department, s.semester
            FROM students s
            JOIN users u ON s.user_id = u.id
        `;
        let params: any[] = [];

        if (req.user.role === 'faculty') {
            const facultyFilter = `
                WHERE EXISTS (
                    SELECT 1 FROM subjects sub 
                    WHERE sub.teacher_id = ? 
                    AND sub.semester = s.semester 
                    AND sub.department = u.department
                )
            `;
            statsQuery += facultyFilter;
            topStudentsQuery += facultyFilter;
            params.push(req.user.id);
        }

        const stats = db.prepare(statsQuery).get(...params) as any;
        const topStudents = db.prepare(topStudentsQuery + " ORDER BY s.cgpa DESC LIMIT 5").all(...params);

        const notifications = db.prepare(`
            SELECT * FROM notifications 
            WHERE target_role IN (?, 'all') OR user_id = ?
            ORDER BY created_at DESC LIMIT 10
        `).all(req.user.role, req.user.id);

        res.json({ stats, topStudents, notifications, token: req.token });
    });

    // Faculty: Update Attendance
    // Admin: Get attendance summary for all students
    app.get("/api/admin/attendance/summary", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin" && req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        
        const summary = db.prepare(`
            SELECT 
                s.id as student_id,
                u.name as student_name,
                s.roll_number,
                u.department,
                s.semester,
                COUNT(a.id) as total_classes,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN attendance a ON s.id = a.student_id
            GROUP BY s.id
        `).all();
        
        res.json(summary.map((row: any) => ({
            ...row,
            percentage: row.total_classes > 0 ? Math.round((row.present_count / row.total_classes) * 100) : 0
        })));
    });

    app.get("/api/admin/attendance/subject-stats", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin" && req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        
        const stats = db.prepare(`
            SELECT 
                sub.id as subject_id,
                sub.code,
                sub.name,
                COUNT(a.id) as total_records,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count
            FROM subjects sub
            LEFT JOIN attendance a ON sub.id = a.subject_id
            GROUP BY sub.id
        `).all();
        
        res.json(stats.map((row: any) => ({
            ...row,
            average: row.total_records > 0 ? Math.round((row.present_count / row.total_records) * 100) : 0
        })));
    });

    app.post("/api/faculty/attendance", authenticateToken, (req: any, res) => {
        if (req.user.role !== "faculty" && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { studentId, subjectId, date, status } = req.body;
        
        // Security check for faculty
        if (req.user.role === 'faculty') {
            const subject = db.prepare("SELECT teacher_id FROM subjects WHERE id = ?").get(subjectId) as any;
            if (!subject || subject.teacher_id !== req.user.id) {
                return res.status(403).json({ message: "Forbidden: You are not the assigned teacher for this subject" });
            }
        }

        // Check for lock
        const locked = db.prepare("SELECT id FROM attendance_locks WHERE subject_id = ?").get(subjectId);
        if (locked && req.user.role !== 'admin') {
            return res.status(403).json({ message: "This subject is locked for attendance changes. Contact Admin." });
        }
        
        db.prepare("INSERT INTO attendance (student_id, subject_id, date, status) VALUES (?, ?, ?, ?)").run(
            studentId, subjectId, date, status
        );
        res.json({ success: true });
    });

    app.post("/api/faculty/attendance/bulk", authenticateToken, (req: any, res) => {
        if (req.user.role !== "faculty" && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { records } = req.body; // { studentId, subjectId, date, status }[]
        
        if (!records || records.length === 0) return res.json({ success: true });
        
        const subjectId = records[0].subjectId;
        
        // Check for lock
        const locked = db.prepare("SELECT id FROM attendance_locks WHERE subject_id = ?").get(subjectId);
        if (locked && req.user.role !== 'admin') {
            return res.status(403).json({ message: "This subject is locked for attendance changes. Contact Admin." });
        }

        const insert = db.prepare("INSERT INTO attendance (student_id, subject_id, date, status) VALUES (?, ?, ?, ?)");
        const deleteOld = db.prepare("DELETE FROM attendance WHERE student_id = ? AND subject_id = ? AND date = ?");
        
        const transaction = db.transaction((recs) => {
            for (const r of recs) {
                const dateOnly = r.date.split('T')[0];
                deleteOld.run(r.studentId, r.subjectId, dateOnly);
                insert.run(r.studentId, r.subjectId, dateOnly, r.status);
            }
        });
        
        transaction(records);
        res.json({ success: true });
    });

    app.get("/api/admin/attendance/locks", authenticateToken, (req: any, res) => {
        const locks = db.prepare("SELECT subject_id FROM attendance_locks").all();
        res.json(locks.map((l: any) => l.subject_id));
    });

    app.post("/api/admin/attendance/lock", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin" && req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        const { subjectId } = req.body;
        
        if (req.user.role === "faculty") {
            const sub = db.prepare("SELECT teacher_id FROM subjects WHERE id = ?").get(subjectId) as any;
            if (!sub || sub.teacher_id !== req.user.id) {
                return res.status(403).json({ message: "You can only lock your own subjects" });
            }
        }

        db.prepare("INSERT OR IGNORE INTO attendance_locks (subject_id, locked_by) VALUES (?, ?)").run(subjectId, req.user.id);
        res.json({ success: true });
    });

    app.post("/api/admin/attendance/unlock", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { subjectId } = req.body;
        db.prepare("DELETE FROM attendance_locks WHERE subject_id = ?").run(subjectId);
        res.json({ success: true });
    });

    app.get("/api/admin/attendance/defaulters", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin" && req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        const defaulters = db.prepare(`
            SELECT s.id as student_id, u.name, u.email, s.roll_number, u.department, s.semester,
                   sub.id as subject_id, sub.name as subject_name,
                   (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.id AND a.subject_id = sub.id) as total_classes,
                   (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.id AND a.subject_id = sub.id AND a.status = 'present') as present_classes
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN student_subjects ss ON s.id = ss.student_id
            JOIN subjects sub ON ss.subject_id = sub.id
        `).all();

        const filtered = defaulters.map((d: any) => ({
            ...d,
            percentage: d.total_classes > 0 ? Math.round((d.present_classes / d.total_classes) * 100) : 0
        })).filter((d: any) => d.percentage < 75);

        res.json(filtered);
    });

    app.get("/api/attendance/trends", authenticateToken, (req: any, res) => {
        // Mocking trend data for analytics
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = days.map(day => ({
            name: day,
            attendance: 70 + Math.floor(Math.random() * 25),
            expected: 85
        }));
        res.json(data);
    });

    app.post("/api/attendance/qr-generate", authenticateToken, (req: any, res) => {
        if (req.user.role !== "faculty" && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { subjectId, latitude, longitude } = req.body;
        const qrToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        
        db.prepare("DELETE FROM attendance_qr WHERE subject_id = ?").run(subjectId);
        db.prepare("INSERT INTO attendance_qr (subject_id, faculty_id, qr_token, expires_at, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)").run(
            subjectId, req.user.id, qrToken, expiresAt, latitude, longitude
        );
        res.json({ qrToken, expiresAt });
    });

    app.post("/api/attendance/qr-scan", authenticateToken, (req: any, res) => {
        if (req.user.role !== "student") return res.status(403).json({ message: "Forbidden" });
        const { qrToken, latitude, longitude } = req.body;
        
        const qr = db.prepare("SELECT * FROM attendance_qr WHERE qr_token = ?").get(qrToken) as any;
        if (!qr) return res.status(400).json({ message: "Invalid or expired QR code" });
        if (new Date(qr.expires_at) < new Date()) return res.status(400).json({ message: "QR code has expired" });

        // Geometric boundary check (simulated)
        if (qr.latitude && qr.longitude && latitude && longitude) {
            const diff = Math.abs(qr.latitude - latitude) + Math.abs(qr.longitude - longitude);
            if (diff > 0.005) return res.status(400).json({ message: "Location mismatch! You must be near the marked classroom." });
        }

        const student = db.prepare("SELECT id FROM students WHERE user_id = ?").get(req.user.id) as any;
        const today = new Date().toISOString().split('T')[0];
        
        try {
            db.prepare("INSERT INTO attendance (student_id, subject_id, date, status) VALUES (?, ?, ?, 'present')").run(
                student.id, qr.subject_id, today
            );
            res.json({ success: true });
        } catch (e) {
            res.status(400).json({ message: "Attendance already marked or error occurred" });
        }
    });

    // Admin: Add Student
    app.post("/api/admin/students", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { name, email, password, rollNumber, semester, department } = req.body;
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        try {
            const result = db.prepare("INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)").run(
                name, email, hashedPassword, "student", department
            );
            const userId = result.lastInsertRowid;
            db.prepare("INSERT INTO students (user_id, roll_number, semester) VALUES (?, ?, ?)").run(
                userId, rollNumber, semester
            );
            res.json({ success: true });
        } catch (e) {
            res.status(400).json({ message: "Email or Roll Number already exists" });
        }
    });

    // Admin: Add Faculty
    app.post("/api/admin/faculty", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { name, email, password, department } = req.body;
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        try {
            db.prepare("INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)").run(
                name, email, hashedPassword, "faculty", department
            );
            res.json({ success: true });
        } catch (e) {
            res.status(400).json({ message: "Email already exists" });
        }
    });

    // Librarian: Update Library Status
    app.post("/api/librarian/status", authenticateToken, (req: any, res) => {
        if (req.user.role !== "librarian" && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { status } = req.body;
        db.prepare("UPDATE library_status SET status = ? WHERE id = 1").run(status);
        res.json({ success: true });
    });

    app.get("/api/library/status", (req, res) => {
        const status = db.prepare("SELECT status FROM library_status WHERE id = 1").get() as any;
        res.json(status);
    });

    // Librarian: Add/Remove Books
    app.post("/api/librarian/books", authenticateToken, (req: any, res) => {
        if (req.user.role !== "librarian" && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { title, author, category, copies } = req.body;
        db.prepare("INSERT INTO books (title, author, category, copies) VALUES (?, ?, ?, ?)").run(title, author, category, copies || 1);
        res.json({ success: true });
    });

    app.delete("/api/librarian/books/:id", authenticateToken, (req: any, res) => {
        if (req.user.role !== "librarian" && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        db.prepare("DELETE FROM books WHERE id = ?").run(req.params.id);
        res.json({ success: true });
    });

    // Librarian: Update Book Availability
    app.post("/api/librarian/books/availability", authenticateToken, (req: any, res) => {
        if (req.user.role !== "librarian" && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { bookId, availability, copies } = req.body;
        db.prepare("UPDATE books SET availability = ?, copies = ? WHERE id = ?").run(availability, copies, bookId);
        res.json({ success: true });
    });

    // Lost & Found: Claim Item
    app.post("/api/lost-found/claim", authenticateToken, (req: any, res) => {
        const { itemId, proof } = req.body;
        db.prepare("UPDATE lost_found SET proof = ?, claimed_by = ?, status = 'claimed' WHERE id = ?").run(
            proof, req.user.id, itemId
        );
        
        // Notify Admin
        db.prepare("INSERT INTO notifications (title, message, target_role) VALUES (?, ?, ?)").run(
            "New Item Claim", `A claim has been filed for item ID ${itemId}`, "admin"
        );
        
        res.json({ success: true });
    });

    // Admin: Approve/Reject Claim
    app.post("/api/admin/lost-found/action", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin" && req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        const { itemId, action } = req.body; // 'approve', 'reject', 'returned', 'delete'
        
        const item = db.prepare("SELECT * FROM lost_found WHERE id = ?").get(itemId) as any;
        
        if (action === 'approve') {
            db.prepare("UPDATE lost_found SET status = 'returned' WHERE id = ?").run(itemId);
            db.prepare("INSERT INTO notifications (title, message, target_role) VALUES (?, ?, ?)").run(
                "Claim Approved", `Your claim for ${item.item_name} has been approved.`, "student"
            );
        } else if (action === 'reject') {
            db.prepare("UPDATE lost_found SET status = 'found', proof = NULL, claimed_by = NULL WHERE id = ?").run(itemId);
            db.prepare("INSERT INTO notifications (title, message, target_role) VALUES (?, ?, ?)").run(
                "Claim Rejected", `Your claim for ${item.item_name} was rejected.`, "student"
            );
        } else if (action === 'delete') {
            db.prepare("DELETE FROM lost_found WHERE id = ?").run(itemId);
        }
        
        res.json({ success: true });
    });

    // Faculty/Admin: Add Event
    app.post("/api/events", authenticateToken, (req: any, res) => {
        if (req.user.role !== "faculty" && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { title, description, date, venue, category, organizer, department, registrationDeadline, coordinatorId } = req.body;
        db.prepare("INSERT INTO events (title, description, date, venue, category, organizer, department, created_by, registration_deadline, coordinator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
            title, description, date, venue, category, organizer, department, req.user.id, registrationDeadline, coordinatorId || req.user.id
        );
        
        // Notify all students about new event
        db.prepare("INSERT INTO notifications (title, message, target_role) VALUES (?, ?, ?)").run(
            "New Event Added", `Register now for ${title} happening on ${date}! Deadline: ${registrationDeadline || 'N/A'}`, "student"
        );
        
        res.json({ success: true });
    });

    // Event Resources
    app.get("/api/events/:id/resources", authenticateToken, (req: any, res) => {
        const resources = db.prepare("SELECT * FROM event_resources WHERE event_id = ?").all(req.params.id);
        res.json(resources);
    });

    app.post("/api/events/:id/resources", authenticateToken, (req: any, res) => {
        if (req.user.role !== "faculty" && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { fileType, fileUrl, title } = req.body;
        db.prepare("INSERT INTO event_resources (event_id, file_type, file_url, title) VALUES (?, ?, ?, ?)").run(
            req.params.id, fileType, fileUrl, title
        );
        res.json({ success: true });
    });

    // Event Leaderboard
    app.get("/api/events/:id/leaderboard", authenticateToken, (req: any, res) => {
        const leaderboard = db.prepare("SELECT * FROM event_leaderboard WHERE event_id = ? ORDER BY position ASC").all(req.params.id);
        res.json(leaderboard);
    });

    app.post("/api/events/:id/leaderboard", authenticateToken, (req: any, res) => {
        if (req.user.role !== "faculty" && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { studentName, position, department } = req.body;
        db.prepare("INSERT INTO event_leaderboard (event_id, student_name, position, department) VALUES (?, ?, ?, ?)").run(
            req.params.id, studentName, position, department
        );
        
        // Notify students about results
        const event = db.prepare("SELECT title FROM events WHERE id = ?").get(req.params.id) as any;
        db.prepare("INSERT INTO notifications (title, message, target_role) VALUES (?, ?, ?)").run(
            "Event Results Announced", `The leaderboard for ${event.title} is now available!`, "student"
        );
        
        res.json({ success: true });
    });

    // Faculty/Admin: Add Notification
    app.post("/api/notifications", authenticateToken, (req: any, res) => {
        if (req.user.role !== "faculty" && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { title, message, targetRole } = req.body;
        db.prepare("INSERT INTO notifications (title, message, target_role) VALUES (?, ?, ?)").run(
            title, message, targetRole
        );
        res.json({ success: true });
    });

    // Faculty/Admin/Librarian: Upload Material
    app.post("/api/materials", authenticateToken, (req: any, res) => {
        if (req.user.role !== "faculty" && req.user.role !== "admin" && req.user.role !== "librarian") return res.status(403).json({ message: "Forbidden" });
        const { title, type, subjectId, semester, url } = req.body;
        db.prepare("INSERT INTO materials (title, type, subject_id, semester, url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)").run(
            title, type, subjectId, semester, url, req.user.id
        );
        res.json({ success: true });
    });

    // Search Students
    app.get("/api/students/search", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin" && req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        const { q, department, semester } = req.query;
        
        let sql = `
            SELECT s.*, u.name, u.email, u.department 
            FROM students s 
            JOIN users u ON s.user_id = u.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (req.user.role === 'faculty') {
            sql += `
                AND EXISTS (
                    SELECT 1 FROM subjects sub 
                    WHERE sub.teacher_id = ? 
                    AND sub.semester = s.semester 
                    AND sub.department = u.department
                )
            `;
            params.push(req.user.id);
        }

        if (q) {
            sql += ` AND (u.name LIKE ? OR s.roll_number LIKE ?)`;
            params.push(`%${q}%`, `%${q}%`);
        }
        if (department) {
            sql += ` AND u.department = ?`;
            params.push(department);
        }
        if (semester) {
            sql += ` AND s.semester = ?`;
            params.push(parseInt(semester as string));
        }

        sql += ` LIMIT 20`;
        
        const students = db.prepare(sql).all(...params);
        res.json(students);
    });

    // Admin: Get all student fees
    app.get("/api/admin/fees", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const fees = db.prepare(`
            SELECT f.*, u.name as student_name, s.roll_number 
            FROM fees f 
            JOIN students s ON f.student_id = s.id 
            JOIN users u ON s.user_id = u.id
        `).all();
        res.json(fees);
    });

    // Admin: Get overall stats
    app.get("/api/admin/stats", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin" && req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        
        const studentsCount = db.prepare("SELECT count(*) as count FROM students").get() as { count: number };
        const facultyCount = db.prepare("SELECT count(*) as count FROM users WHERE role = 'faculty'").get() as { count: number };
        
        // Count unique students present today (or most recent date)
        const today = new Date().toISOString().split('T')[0];
        const presentToday = db.prepare("SELECT count(DISTINCT student_id) as count FROM attendance WHERE status = 'present' AND date = ?").get(today) as { count: number };
        
        const revenue = db.prepare("SELECT SUM(amount) as total FROM fees WHERE status = 'paid'").get() as { total: number };
        
        res.json({
            students: studentsCount.count,
            faculty: facultyCount.count,
            attendance: presentToday.count,
            revenue: revenue.total || 0
        });
    });

    // Admin: Update Student CGPA and Markscard
    app.post("/api/admin/students/update", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { studentId, cgpa, markscardUrl } = req.body;
        db.prepare("UPDATE students SET cgpa = ?, markscard_url = ? WHERE id = ?").run(cgpa, markscardUrl, studentId);
        res.json({ success: true });
    });

    app.post("/api/admin/students/grant-edit", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { studentId } = req.body;
        db.prepare("UPDATE students SET can_edit_profile = 1 WHERE id = ?").run(studentId);
        res.json({ success: true });
    });

    // Admin: Get Students
    app.get("/api/admin/students", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin" && req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        
        let query = `
            SELECT s.*, u.name, u.email, u.department 
            FROM students s 
            JOIN users u ON s.user_id = u.id
        `;
        let params: any[] = [];

        if (req.user.role === 'faculty') {
            query += `
                WHERE EXISTS (
                    SELECT 1 FROM subjects sub 
                    WHERE sub.teacher_id = ? 
                    AND sub.semester = s.semester 
                    AND sub.department = u.department
                )
            `;
            params.push(req.user.id);
        }

        const students = db.prepare(query).all(...params);
        res.json(students);
    });

    // Admin: Get Faculty
    app.get("/api/admin/faculty", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const faculty = db.prepare("SELECT id, name, email, department FROM users WHERE role = 'faculty'").all();
        res.json(faculty);
    });

    // Public Faculty List (for Timetable/Substitution)
    app.get("/api/faculty", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin" && req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        try {
            const faculty = db.prepare("SELECT id, name, email, department FROM users WHERE role = 'faculty'").all();
            res.json(faculty);
        } catch (e) {
            res.status(500).json({ message: "Failed to fetch faculty list" });
        }
    });

    // Results
    app.post("/api/results", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin" && req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        const { studentId, semester, subjectId, internalMarks, externalMarks } = req.body;
        
        // Authorization check: Admin OR the teacher assigned to this subject
        if (req.user.role === "faculty") {
            const subject = db.prepare("SELECT teacher_id FROM subjects WHERE id = ?").get(subjectId) as any;
            if (!subject || subject.teacher_id !== req.user.id) {
                return res.status(403).json({ message: "Forbidden: You are not the assigned teacher for this subject" });
            }
        }

        const totalMarks = (parseInt(internalMarks) || 0) + (parseInt(externalMarks) || 0);
        
        const sub = db.prepare("SELECT code, credits FROM subjects WHERE id = ?").get(subjectId) as any;
        
        // Calculate Grade (VTU logic based on user table)
        let grade = "F";
        if (totalMarks >= 90) grade = "O";
        else if (totalMarks >= 80) grade = "A+";
        else if (totalMarks >= 70) grade = "A";
        else if (totalMarks >= 60) grade = "B+";
        else if (totalMarks >= 55) grade = "B";
        else if (totalMarks >= 50) grade = "C";
        
        const credits = sub.credits || 3;
        const creditsObtained = grade === "F" ? 0 : credits;

        const existingResult = db.prepare("SELECT id FROM results WHERE student_id = ? AND subject_id = ?").get(studentId, subjectId) as any;

        if (existingResult) {
            db.prepare(`
                UPDATE results 
                SET internal_marks = ?, external_marks = ?, marks = ?, grade = ?, credits_obtained = ? 
                WHERE id = ?
            `).run(internalMarks, externalMarks, totalMarks, grade, creditsObtained, existingResult.id);
        } else {
            db.prepare(`
                INSERT INTO results (student_id, semester, subject_id, internal_marks, external_marks, marks, grade, credits_obtained) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(studentId, semester, subjectId, internalMarks, externalMarks, totalMarks, grade, creditsObtained);
        }

        // Recalculate SGPA for the modified semester and total CGPA using data from database
        const student = db.prepare("SELECT semester FROM students WHERE id = ?").get(studentId) as any;
        const allRes = db.prepare(`
            SELECT r.grade, s.credits, r.semester
            FROM results r
            JOIN subjects s ON r.subject_id = s.id
            WHERE r.student_id = ?
        `).all(studentId) as any[];

        const semesterHistory: any = {};
        allRes.forEach(r => {
            if (!semesterHistory[r.semester]) semesterHistory[r.semester] = { totalCredits: 0, weightedSum: 0 };
            const points = gradePoints[r.grade] || 0;
            semesterHistory[r.semester].totalCredits += r.credits;
            semesterHistory[r.semester].weightedSum += (r.credits * points);
        });

        let totalOverallWeightedSum = 0;
        let totalOverallCredits = 0;
        let currentSemSgpa = 0;

        Object.keys(semesterHistory).forEach(sKey => {
            const sem = semesterHistory[sKey];
            const sgpaValue = sem.totalCredits > 0 ? (sem.weightedSum / sem.totalCredits) : 0;
            
            totalOverallWeightedSum += sem.weightedSum;
            totalOverallCredits += sem.totalCredits;
            
            if (parseInt(sKey) === student.semester) {
                currentSemSgpa = sgpaValue;
            }
        });

        const newCgpa = totalOverallCredits > 0 ? (totalOverallWeightedSum / totalOverallCredits).toFixed(2) : "0.00";
        db.prepare("UPDATE students SET cgpa = ?, sgpa = ? WHERE id = ?").run(newCgpa, currentSemSgpa.toFixed(2), studentId);

        res.json({ success: true, cgpa: parseFloat(newCgpa), sgpa: parseFloat(currentSemSgpa.toFixed(2)) });
    });

    // Event Attendance Alert
    app.post("/api/events/attendance", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { eventId, rollNumbers } = req.body; // rollNumbers is a string of comma separated values
        
        const rolls = rollNumbers.split(",").map((r: string) => r.trim());
        const event = db.prepare("SELECT title FROM events WHERE id = ?").get(eventId) as any;

        for (const roll of rolls) {
            db.prepare("INSERT INTO event_attendance (event_id, student_roll_number) VALUES (?, ?)").run(eventId, roll);
        }

        // Send alert to faculty
        db.prepare("INSERT INTO notifications (title, message, target_role) VALUES (?, ?, ?)").run(
            "Event Attendance Alert",
            `Students with roll numbers: ${rollNumbers} attended the event "${event.title}". Please mark their attendance accordingly.`,
            "faculty"
        );

        res.json({ success: true });
    });

    // Admin: Add Fees
    app.post("/api/admin/fees", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { studentId, amount, dueDate, status } = req.body;
        db.prepare("INSERT INTO fees (student_id, amount, due_date, status) VALUES (?, ?, ?, ?)").run(
            studentId, amount, dueDate, status || 'pending'
        );
        res.json({ success: true });
    });

    // Student: Get own fees
    app.get("/api/student/fees", authenticateToken, (req: any, res) => {
        if (req.user.role !== "student") return res.status(403).json({ message: "Forbidden" });
        const student = db.prepare("SELECT id FROM students WHERE user_id = ?").get(req.user.id) as any;
        const fees = db.prepare("SELECT * FROM fees WHERE student_id = ?").all(student.id);
        res.json(fees);
    });

    // Admin Profile
    app.get("/api/admin/profile", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const admin = db.prepare("SELECT id, name, email, role, avatar_url FROM users WHERE id = ?").get(req.user.id) as any;
        const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students").get() as any;
        res.json({ ...admin, totalStudents: totalStudents.count });
    });

    app.post("/api/admin/profile/update", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { name, email } = req.body;
        db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(name, email, req.user.id);
        res.json({ success: true });
    });

    // Admin: Mark Attendance
    app.post("/api/admin/attendance", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { studentId, subjectId, date, status } = req.body;
        db.prepare("INSERT INTO attendance (student_id, subject_id, date, status) VALUES (?, ?, ?, ?)").run(
            studentId, subjectId, date, status
        );
        res.json({ success: true });
    });

    // Alumni Management
    app.get("/api/alumni", authenticateToken, (req, res) => {
        const alumni = db.prepare("SELECT * FROM alumni ORDER BY batch_year DESC").all();
        res.json(alumni);
    });

    app.post("/api/alumni", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { name, batchYear, contactDetails, careerInfo, achievements, imageUrl, documentUrl } = req.body;
        
        try {
            db.prepare("INSERT INTO alumni (name, batch_year, contact_details, career_info, achievements, image_url, document_url) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
                name || "Unknown",
                parseInt(batchYear) || new Date().getFullYear(),
                contactDetails || null,
                careerInfo || null,
                achievements || null,
                imageUrl || null,
                documentUrl || null
            );
            res.json({ success: true });
        } catch (e) {
            console.error("Error adding alumni:", e);
            res.status(500).json({ message: "Error adding alumni record" });
        }
    });

    app.put("/api/alumni/:id", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { name, batchYear, contactDetails, careerInfo, achievements, imageUrl, documentUrl } = req.body;
        
        try {
            db.prepare("UPDATE alumni SET name = ?, batch_year = ?, contact_details = ?, career_info = ?, achievements = ?, image_url = ?, document_url = ? WHERE id = ?").run(
                name, 
                parseInt(batchYear) || new Date().getFullYear(), 
                contactDetails || null, 
                careerInfo || null, 
                achievements || null, 
                imageUrl || null, 
                documentUrl || null, 
                req.params.id
            );
            res.json({ success: true });
        } catch (e) {
            console.error("Error updating alumni:", e);
            res.status(500).json({ message: "Error updating alumni record" });
        }
    });

    app.delete("/api/alumni/:id", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        db.prepare("DELETE FROM alumni WHERE id = ?").run(req.params.id);
        res.json({ success: true });
    });

    // Book ISBN Lookup (Proxy to Google Books API)
    app.get("/api/books/isbn/:isbn", async (req, res) => {
        const { isbn } = req.params;
        const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
        try {
            // Try ISBN search first
            const baseUrl = "https://www.googleapis.com/books/v1/volumes";
            const response = await fetch(`${baseUrl}?q=isbn:${isbn}${apiKey ? `&key=${apiKey}` : ""}`);
            let data = await response.json();
            
            // If nothing found by ISBN, try general query with the same string in case it's a generic ID
            if (!data.items || data.totalItems === 0) {
                const altResponse = await fetch(`${baseUrl}?q=${isbn}${apiKey ? `&key=${apiKey}` : ""}`);
                data = await altResponse.json();
            }

            if (data.items && data.items.length > 0) {
                const book = data.items[0].volumeInfo;
                const identifiers = data.items[0].volumeInfo.industryIdentifiers || [];
                const actualIsbn = identifiers.find((id: any) => id.type.includes("ISBN"))?.identifier || isbn;

                res.json({
                    title: book.title,
                    author: book.authors ? book.authors.join(", ") : "Unknown",
                    coverImage: book.imageLinks ? book.imageLinks.thumbnail : null,
                    description: book.description || "No description available.",
                    category: book.categories ? book.categories[0] : "General",
                    isbn: actualIsbn,
                    status: 'available'
                });
            } else {
                res.status(404).json({ message: "Book not found" });
            }
        } catch (e) {
            console.error("Google Books Fetch Error:", e);
            res.status(500).json({ message: "Error fetching book details" });
        }
    });

    // Book Search by Title/Author
    app.get("/api/books/remote-search", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: "Query is required" });
        const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5${apiKey ? `&key=${apiKey}` : ""}`);
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                const results = data.items.map((item: any) => ({
                    title: item.volumeInfo.title,
                    author: item.volumeInfo.authors ? item.volumeInfo.authors.join(", ") : "Unknown",
                    coverImage: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : null,
                    isbn: item.volumeInfo.industryIdentifiers?.find((id: any) => id.type.includes("ISBN"))?.identifier || "",
                    category: item.volumeInfo.categories ? item.volumeInfo.categories[0] : "General",
                    description: item.volumeInfo.description || ""
                }));
                res.json(results);
            } else {
                res.json([]);
            }
        } catch (e) {
            console.error("Google Books Search Error:", e);
            res.status(500).json({ message: "Error searching books" });
        }
    });

    app.post("/api/books", authenticateToken, (req: any, res) => {
        if (req.user.role !== "librarian" && req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }
        const { title, author, isbn, category, coverImage, description } = req.body;
        try {
            db.prepare(`
                INSERT INTO books (title, author, isbn, category, cover_image, description)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(title, author, isbn, category, coverImage, description);
            res.json({ success: true });
        } catch (e: any) {
            if (e.message.includes("UNIQUE constraint failed")) {
                return res.status(400).json({ message: "Book already exists" });
            }
            res.status(500).json({ message: "Database error" });
        }
    });
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    // Global Error Handler
    app.use((err: any, req: any, res: any, next: any) => {
        console.error(err.stack);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    });

    httpServer.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
