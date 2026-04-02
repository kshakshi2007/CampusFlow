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
    
    // Create 200 Students if count is low
    const studentCount = db.prepare("SELECT count(*) as count FROM users WHERE role = 'student'").get() as { count: number };
    if (studentCount.count < 10) {
        const insertUser = db.prepare("INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)");
        const insertStudent = db.prepare("INSERT INTO students (user_id, roll_number, semester, cgpa, fee_status) VALUES (?, ?, ?, ?, ?)");
        
        for (let i = 1; i <= 200; i++) {
            const name = `Student ${i}`;
            const email = `student${i}@college.edu`;
            const dept = i % 2 === 0 ? "Computer Science" : "Information Technology";
            const result = insertUser.run(name, email, hashedPassword, "student", dept);
            const userId = result.lastInsertRowid;
            
            const roll = `CS2026${String(i).padStart(3, '0')}`;
            const semester = (i % 8) + 1;
            const cgpa = (Math.random() * 4 + 6).toFixed(2); // CGPA between 6.0 and 10.0
            const feeStatus = i % 5 === 0 ? 'pending' : 'paid';
            
            insertStudent.run(userId, roll, semester, cgpa, feeStatus);

            // Seed Fees
            db.prepare("INSERT INTO fees (student_id, amount, due_date, status) VALUES (?, ?, ?, ?)").run(
                userId, 45000, "2026-06-30", feeStatus
            );
        }
    }

    // Seed some subjects if empty
    const subjectCount = db.prepare("SELECT count(*) as count FROM subjects").get() as { count: number };
    if (subjectCount.count === 0) {
        db.prepare("INSERT INTO subjects (code, name, semester, department) VALUES (?, ?, ?, ?)").run(
            "CS401", "Database Management Systems", 4, "Computer Science"
        );
        db.prepare("INSERT INTO subjects (code, name, semester, department) VALUES (?, ?, ?, ?)").run(
            "CS402", "Operating Systems", 4, "Computer Science"
        );
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

        const attendance = db.prepare(`
            SELECT sub.name, 
                   COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*) as percentage
            FROM attendance a
            JOIN subjects sub ON a.subject_id = sub.id
            WHERE a.student_id = ?
            GROUP BY sub.id
        `).all(student.id);

        const fees = db.prepare("SELECT * FROM fees WHERE student_id = ?").all(student.id);
        const notifications = db.prepare("SELECT * FROM notifications WHERE target_role IN ('student', 'all') ORDER BY created_at DESC LIMIT 5").all();

        res.json({ student, attendance, fees, notifications });
    });

    // Materials
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

        res.json({ stats, topStudents });
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
        const { title, description, date, venue, category } = req.body;
        db.prepare("INSERT INTO events (title, description, date, venue, category, created_by) VALUES (?, ?, ?, ?, ?, ?)").run(
            title, description, date, venue, category, req.user.id
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

    // Vite middleware for development
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

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
