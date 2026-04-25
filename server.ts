import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import fs from "fs";

const __dirname = path.resolve();
const db = new Database("campusflow.db");
const JWT_SECRET = process.env.JWT_SECRET || "campusflow-secret-key";

// Initialize Database
const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
db.exec(schema);

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

// Seed initial data if empty or missing librarian
const librarianExists = db.prepare("SELECT count(*) as count FROM users WHERE role = 'librarian'").get() as { count: number };
if (librarianExists.count === 0) {
    const hashedPassword = bcrypt.hashSync("password123", 10);
    
    // Create Admin if not exists
    db.prepare("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
        "Admin User", "admin@college.edu", hashedPassword, "admin"
    );
    
    // Create Faculty if not exists
    db.prepare("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
        "Dr. Smith", "faculty@college.edu", hashedPassword, "faculty"
    );

    // Create Librarian
    db.prepare("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
        "Mr. Librarian", "librarian@college.edu", hashedPassword, "librarian"
    );

    // Seed Library Status if empty
    const statusCount = db.prepare("SELECT count(*) as count FROM library_status").get() as { count: number };
    if (statusCount.count === 0) {
        db.prepare("INSERT INTO library_status (status) VALUES (?)").run("open");
    }
    
    // Create 2 Students if count is low
    const studentCount = db.prepare("SELECT count(*) as count FROM users WHERE role = 'student'").get() as { count: number };
    if (studentCount.count < 2) {
        const insertUser = db.prepare("INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)");
        const insertStudent = db.prepare("INSERT INTO students (user_id, roll_number, semester, cgpa, fee_status) VALUES (?, ?, ?, ?, ?)");
        
        for (let i = 1; i <= 2; i++) {
            const name = `Student ${i}`;
            const email = `student${i}@college.edu`;
            const dept = "Computer Science";
            const result = insertUser.run(name, email, hashedPassword, "student", dept);
            const userId = result.lastInsertRowid;
            
            const roll = `CS2026${String(i).padStart(3, '0')}`;
            const semester = 4;
            const cgpa = "0.00"; 
            const feeStatus = 'paid';
            
            insertStudent.run(userId, roll, semester, cgpa, feeStatus);

            // Seed Fees
            db.prepare("INSERT INTO fees (student_id, amount, due_date, status) VALUES (?, ?, ?, ?)").run(
                userId, 45000, "2026-06-30", feeStatus
            );
        }
    }

    // Seed specified subjects if empty
    const subjectsToSeed = [
        { code: "CS401", name: "DBMS", sem: 4 },
        { code: "MA401", name: "Linear Algebra", sem: 4 },
        { code: "CS402", name: "Design Algorithm and Analysis", sem: 4 },
        { code: "CS403", name: "Java", sem: 4 },
        { code: "CS404", name: "Python", sem: 4 }
    ];
    
    // Clear and re-seed to ensure correct subjects for the task
    db.prepare("DELETE FROM subjects").run();
    const insertSub = db.prepare("INSERT INTO subjects (code, name, semester, department) VALUES (?, ?, ?, ?)");
    for (const s of subjectsToSeed) {
        insertSub.run(s.code, s.name, s.sem, "Computer Science");
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
}

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
    const PORT = 3000;

    app.use(cors());
    app.use(express.json());

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

    // Student Profile
    app.get("/api/student/profile", authenticateToken, (req: any, res) => {
        const student = db.prepare(`
            SELECT s.*, u.name, u.email, u.department, u.role
            FROM users u
            LEFT JOIN students s ON s.user_id = u.id 
            WHERE u.id = ?
        `).get(req.user.id) as any;
        res.json(student);
    });

    app.post("/api/student/profile/update", authenticateToken, (req: any, res) => {
        const { 
            contact, achievements, address, dob, gender, 
            blood_group, father_name, mother_name, 
            guardian_contact, enrollment_year 
        } = req.body;
        
        const user = db.prepare("SELECT role FROM users WHERE id = ?").get(req.user.id) as any;
        if (user.role === 'student') {
            db.prepare(`
                UPDATE students SET 
                    contact = ?, achievements = ?, address = ?, dob = ?, 
                    gender = ?, blood_group = ?, father_name = ?, 
                    mother_name = ?, guardian_contact = ?, enrollment_year = ? 
                WHERE user_id = ?
            `).run(
                contact, achievements, address, dob, gender, 
                blood_group, father_name, mother_name, 
                guardian_contact, enrollment_year, req.user.id
            );
        }
        res.json({ success: true });
    });

    // Subjects
    app.get("/api/subjects", authenticateToken, (req, res) => {
        const subjects = db.prepare("SELECT * FROM subjects").all();
        res.json(subjects);
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
            SELECT m.*, s.name as subject_name, u.name as uploader_name
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
        const events = db.prepare("SELECT * FROM events ORDER BY date ASC").all();
        res.json(events);
    });

    app.post("/api/events/register", authenticateToken, (req: any, res) => {
        const { eventId } = req.body;
        const student = db.prepare("SELECT id FROM students WHERE user_id = ?").get(req.user.id) as any;
        if (!student) return res.status(400).json({ message: "Student record not found" });

        try {
            db.prepare("INSERT INTO event_registrations (event_id, student_id) VALUES (?, ?)").run(eventId, student.id);
            res.json({ success: true });
        } catch (e) {
            res.status(400).json({ message: "Already registered or error" });
        }
    });

    // Admin: Get registered students for an event
    app.get("/api/events/:id/registrations", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const registrations = db.prepare(`
            SELECT u.name, s.roll_number, u.email
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

    // Faculty Analysis
    app.get("/api/faculty/analysis", authenticateToken, (req: any, res) => {
        if (req.user.role !== "faculty" && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        
        // Trigger IA notification check
        checkIANotifications();

        const stats = db.prepare(`
            SELECT 
                COUNT(CASE WHEN cgpa >= 9.0 THEN 1 END) as excelling,
                COUNT(CASE WHEN cgpa >= 7.5 AND cgpa < 9.0 THEN 1 END) as good,
                COUNT(CASE WHEN cgpa >= 6.0 AND cgpa < 7.5 THEN 1 END) as average,
                COUNT(CASE WHEN cgpa < 6.0 THEN 1 END) as weak
            FROM students
        `).get() as any;

        const topStudents = db.prepare(`
            SELECT u.name, s.cgpa, u.department
            FROM students s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.cgpa DESC
            LIMIT 5
        `).all();

        const notifications = db.prepare(`
            SELECT * FROM notifications 
            WHERE target_role IN (?, 'all') OR user_id = ?
            ORDER BY created_at DESC LIMIT 10
        `).all(req.user.role, req.user.id);

        res.json({ stats, topStudents, notifications });
    });

    // Faculty: Update Attendance
    app.post("/api/faculty/attendance", authenticateToken, (req: any, res) => {
        if (req.user.role !== "faculty" && req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { studentId, subjectId, date, status } = req.body;
        
        db.prepare("INSERT INTO attendance (student_id, subject_id, date, status) VALUES (?, ?, ?, ?)").run(
            studentId, subjectId, date, status
        );
        res.json({ success: true });
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
        const { title, description, date, venue, category, organizer, department } = req.body;
        db.prepare("INSERT INTO events (title, description, date, venue, category, organizer, department, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
            title, description, date, venue, category, organizer, department, req.user.id
        );
        
        // Notify all students about new event
        db.prepare("INSERT INTO notifications (title, message, target_role) VALUES (?, ?, ?)").run(
            "New Event Added", `Register now for ${title} happening on ${date}!`, "student"
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
        const query = req.query.q;
        if (!query) return res.json([]);
        
        const students = db.prepare(`
            SELECT s.*, u.name, u.email, u.department 
            FROM students s 
            JOIN users u ON s.user_id = u.id
            WHERE u.name LIKE ? OR s.roll_number LIKE ?
            LIMIT 10
        `).all(`%${query}%`, `%${query}%`);
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

    // Admin: Update Student CGPA and Markscard
    app.post("/api/admin/students/update", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { studentId, cgpa, markscardUrl } = req.body;
        db.prepare("UPDATE students SET cgpa = ?, markscard_url = ? WHERE id = ?").run(cgpa, markscardUrl, studentId);
        res.json({ success: true });
    });

    // Admin: Get Students
    app.get("/api/admin/students", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin" && req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        const students = db.prepare(`
            SELECT s.*, u.name, u.email, u.department 
            FROM students s 
            JOIN users u ON s.user_id = u.id
        `).all();
        res.json(students);
    });

    // Results
    app.get("/api/results/student/:userId", authenticateToken, (req: any, res) => {
        const userId = req.params.userId;
        const student = db.prepare("SELECT id, semester, cgpa FROM students WHERE user_id = ?").get(userId) as any;
        if (!student) return res.status(404).json({ message: "Student not found" });

        const results = db.prepare(`
            SELECT r.*, sub.name as subject_name, sub.code as subject_code
            FROM results r
            JOIN subjects sub ON r.subject_id = sub.id
            WHERE r.student_id = ?
            ORDER BY r.semester DESC
        `).all(student.id);

        res.json({ results, cgpa: student.cgpa, semester: student.semester });
    });

    app.post("/api/results", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin" && req.user.role !== "faculty") return res.status(403).json({ message: "Forbidden" });
        const { studentId, semester, subjectId, marks, grade } = req.body;
        
        db.prepare("INSERT INTO results (student_id, semester, subject_id, marks, grade) VALUES (?, ?, ?, ?, ?)").run(
            studentId, semester, subjectId, marks, grade
        );

        // Recalculate CGPA (simplified)
        const allResults = db.prepare("SELECT marks FROM results WHERE student_id = ?").all(studentId) as any[];
        const avgMarks = allResults.reduce((acc, r) => acc + r.marks, 0) / allResults.length;
        const newCgpa = (avgMarks / 10).toFixed(2);
        db.prepare("UPDATE students SET cgpa = ? WHERE id = ?").run(newCgpa, studentId);

        res.json({ success: true });
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
        const admin = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(req.user.id) as any;
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
        db.prepare("INSERT INTO alumni (name, batch_year, contact_details, career_info, achievements, image_url, document_url) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
            name, batchYear, contactDetails, careerInfo, achievements, imageUrl, documentUrl
        );
        res.json({ success: true });
    });

    app.put("/api/alumni/:id", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        const { name, batchYear, contactDetails, careerInfo, achievements, imageUrl, documentUrl } = req.body;
        db.prepare("UPDATE alumni SET name = ?, batch_year = ?, contact_details = ?, career_info = ?, achievements = ?, image_url = ?, document_url = ? WHERE id = ?").run(
            name, batchYear, contactDetails, careerInfo, achievements, imageUrl, documentUrl, req.params.id
        );
        res.json({ success: true });
    });

    app.delete("/api/alumni/:id", authenticateToken, (req: any, res) => {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
        db.prepare("DELETE FROM alumni WHERE id = ?").run(req.params.id);
        res.json({ success: true });
    });

    // Book ISBN Lookup (Proxy to Google Books API)
    app.get("/api/books/isbn/:isbn", async (req, res) => {
        const { isbn } = req.params;
        try {
            // Try ISBN search first
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
            let data = await response.json();
            
            // If nothing found by ISBN, try general query with the same string in case it's a generic ID
            if (data.totalItems === 0) {
                const altResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${isbn}`);
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
            res.status(500).json({ message: "Error fetching book details" });
        }
    });

    // Book Search by Title/Author
    app.get("/api/books/remote-search", async (req, res) => {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: "Query is required" });
        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5`);
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                const results = data.items.map((item: any) => ({
                    title: item.volumeInfo.title,
                    author: item.volumeInfo.authors ? item.volumeInfo.authors.join(", ") : "Unknown",
                    coverImage: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : null,
                    isbn: item.volumeInfo.industryIdentifiers?.find((id: any) => id.type.includes("ISBN"))?.identifier || "",
                    category: item.volumeInfo.categories ? item.volumeInfo.categories[0] : "General"
                }));
                res.json(results);
            } else {
                res.json([]);
            }
        } catch (e) {
            res.status(500).json({ message: "Error searching books" });
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

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
