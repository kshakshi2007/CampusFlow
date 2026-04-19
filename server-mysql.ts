import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import fs from "fs";

const __dirname = path.resolve();
const JWT_SECRET = process.env.JWT_SECRET || "campusflow-secret-key";

// MySQL Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "campusflow",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper function to execute queries
async function query(sql: string, params?: any[]) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}

async function queryOne(sql: string, params?: any[]) {
    const [rows] = await pool.execute(sql, params);
    return (rows as any[])[0];
}

async function insert(sql: string, params?: any[]) {
    const [result] = await pool.execute(sql, params);
    return (result as any).insertId;
}

// Initialize Database with seed data
async function initializeDatabase() {
    try {
        // Check if librarian exists
        const librarianResult = await queryOne(
            "SELECT COUNT(*) as count FROM users WHERE role = 'librarian'"
        ) as any;
        
        if (librarianResult.count === 0) {
            const hashedPassword = bcrypt.hashSync("password123", 10);
            
            // Create Admin if not exists
            await query(
                "INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                ["Admin User", "admin@college.edu", hashedPassword, "admin"]
            );
            
            // Create Faculty if not exists
            await query(
                "INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                ["Dr. Smith", "faculty@college.edu", hashedPassword, "faculty"]
            );

            // Create Librarian
            await query(
                "INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                ["Mr. Librarian", "librarian@college.edu", hashedPassword, "librarian"]
            );

            // Seed Library Status if empty
            const statusResult = await queryOne(
                "SELECT COUNT(*) as count FROM library_status"
            ) as any;
            
            if (statusResult.count === 0) {
                await query("INSERT INTO library_status (status) VALUES (?)", ["open"]);
            }
            
            // Create 200 Students if count is low
            const studentResult = await queryOne(
                "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
            ) as any;
            
            if (studentResult.count < 10) {
                for (let i = 1; i <= 200; i++) {
                    const name = `Student ${i}`;
                    const email = `student${i}@college.edu`;
                    const dept = i % 2 === 0 ? "Computer Science" : "Information Technology";
                    
                    const userId = await insert(
                        "INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)",
                        [name, email, hashedPassword, "student", dept]
                    );
                    
                    const roll = `CS2026${String(i).padStart(3, '0')}`;
                    const semester = (i % 8) + 1;
                    const cgpa = (Math.random() * 4 + 6).toFixed(2);
                    const feeStatus = i % 5 === 0 ? 'pending' : 'paid';
                    
                    const studentId = await insert(
                        "INSERT INTO students (user_id, roll_number, semester, cgpa, fee_status) VALUES (?, ?, ?, ?, ?)",
                        [userId, roll, semester, cgpa, feeStatus]
                    );

                    // Seed Fees
                    await query(
                        "INSERT INTO fees (student_id, amount, due_date, status) VALUES (?, ?, ?, ?)",
                        [studentId, 45000, "2026-06-30", feeStatus]
                    );
                }
            }

            // Seed some subjects if empty
            const subjectResult = await queryOne(
                "SELECT COUNT(*) as count FROM subjects"
            ) as any;
            
            if (subjectResult.count === 0) {
                await query(
                    "INSERT INTO subjects (code, name, semester, department) VALUES (?, ?, ?, ?)",
                    ["CS401", "Database Management Systems", 4, "Computer Science"]
                );
                await query(
                    "INSERT INTO subjects (code, name, semester, department) VALUES (?, ?, ?, ?)",
                    ["CS402", "Operating Systems", 4, "Computer Science"]
                );
            }

            // Seed some books if empty
            const bookResult = await queryOne(
                "SELECT COUNT(*) as count FROM books"
            ) as any;
            
            if (bookResult.count === 0) {
                await query(
                    "INSERT INTO books (title, author, category) VALUES (?, ?, ?)",
                    ["Clean Code", "Robert C. Martin", "Software Engineering"]
                );
                await query(
                    "INSERT INTO books (title, author, category) VALUES (?, ?, ?)",
                    ["The Pragmatic Programmer", "Andrew Hunt", "Software Engineering"]
                );
            }
        }
        console.log("Database initialized successfully");
    } catch (error) {
        console.error("Database initialization error:", error);
    }
}

async function startServer() {
    const app = express();
    const PORT = 3000;

    app.use(cors());
    app.use(express.json());

    // Initialize database
    await initializeDatabase();

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
    app.post("/api/auth/login", async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await queryOne("SELECT * FROM users WHERE email = ?", [email]) as any;
            
            if (user && bcrypt.compareSync(password, user.password)) {
                const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
                res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
            } else {
                res.status(401).json({ message: "Invalid credentials" });
            }
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Student Dashboard Data
    app.get("/api/student/dashboard", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "student") return res.status(403).json({ message: "Forbidden" });
            
            const student = await queryOne(`
                SELECT s.*, u.name, u.email, u.department 
                FROM students s 
                JOIN users u ON s.user_id = u.id 
                WHERE u.id = ?
            `, [req.user.id]) as any;

            const attendance = await query(`
                SELECT sub.name, 
                       COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*) as percentage
                FROM attendance a
                JOIN subjects sub ON a.subject_id = sub.id
                WHERE a.student_id = ?
                GROUP BY sub.id
            `, [student.id]);

            const fees = await query("SELECT * FROM fees WHERE student_id = ?", [student.id]);
            const notifications = await query(
                "SELECT * FROM notifications WHERE target_role IN ('student', 'all') ORDER BY created_at DESC LIMIT 5"
            );

            res.json({ student, attendance, fees, notifications });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });
    app.get("/api/students", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, name, email FROM users"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students" });
  }
});

    // Materials
    app.get("/api/materials", authenticateToken, async (req, res) => {
        try {
            const materials = await query(`
                SELECT m.*, s.name as subject_name, u.name as uploader_name
                FROM materials m 
                JOIN subjects s ON m.subject_id = s.id
                JOIN users u ON m.uploaded_by = u.id
            `);
            res.json(materials);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Library
    app.get("/api/library/books", authenticateToken, async (req, res) => {
        try {
            const { search } = req.query;
            let queryStr = "SELECT * FROM books";
            let params: any[] = [];
            
            if (search) {
                queryStr += " WHERE title LIKE ? OR author LIKE ?";
                params = [`%${search}%`, `%${search}%`];
            }
            
            const books = await query(queryStr, params);
            res.json(books);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Events
    app.get("/api/events", authenticateToken, async (req, res) => {
        try {
            const events = await query("SELECT * FROM events ORDER BY date ASC");
            res.json(events);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    app.post("/api/events/register", authenticateToken, async (req: any, res) => {
        try {
            const { eventId } = req.body;
            const student = await queryOne("SELECT id FROM students WHERE user_id = ?", [req.user.id]) as any;
            
            if (!student) return res.status(400).json({ message: "Student record not found" });

            await query("INSERT INTO event_registrations (event_id, student_id) VALUES (?, ?)", [eventId, student.id]);
            res.json({ success: true });
        } catch (e) {
            res.status(400).json({ message: "Already registered or error" });
        }
    });

    // Lost & Found
    app.get("/api/lost-found", authenticateToken, async (req, res) => {
        try {
            const items = await query(
                "SELECT lf.*, u.name as reporter_name FROM lost_found lf JOIN users u ON lf.reported_by = u.id ORDER BY created_at DESC"
            );
            res.json(items);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    app.post("/api/lost-found", authenticateToken, async (req: any, res) => {
        try {
            const { itemName, description, type, imageUrl, location, dateReported } = req.body;
            const status = type === 'found' ? 'found' : 'lost';
            
            await query(
                "INSERT INTO lost_found (item_name, description, type, status, reported_by, image_url, location, date_reported) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [itemName, description, type, status, req.user.id, imageUrl, location, dateReported]
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Feedback
    app.post("/api/feedback", authenticateToken, async (req: any, res) => {
        try {
            const { subject, message, isAnonymous } = req.body;
            const student = await queryOne("SELECT id FROM students WHERE user_id = ?", [req.user.id]) as any;
            
            await query(
                "INSERT INTO feedback (student_id, subject, message, is_anonymous) VALUES (?, ?, ?, ?)",
                [isAnonymous ? null : student?.id, subject, message, isAnonymous ? 1 : 0]
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Faculty Analysis
    app.get("/api/faculty/analysis", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "faculty" && req.user.role !== "admin") {
                return res.status(403).json({ message: "Forbidden" });
            }
            
            const stats = await queryOne(`
                SELECT 
                    COUNT(CASE WHEN cgpa >= 9.0 THEN 1 END) as excelling,
                    COUNT(CASE WHEN cgpa >= 7.5 AND cgpa < 9.0 THEN 1 END) as good,
                    COUNT(CASE WHEN cgpa >= 6.0 AND cgpa < 7.5 THEN 1 END) as average,
                    COUNT(CASE WHEN cgpa < 6.0 THEN 1 END) as weak
                FROM students
            `);

            const topStudents = await query(`
                SELECT u.name, s.cgpa, u.department
                FROM students s
                JOIN users u ON s.user_id = u.id
                ORDER BY s.cgpa DESC
                LIMIT 5
            `);

            res.json({ stats, topStudents });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Faculty: Update Attendance
    app.post("/api/faculty/attendance", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "faculty" && req.user.role !== "admin") {
                return res.status(403).json({ message: "Forbidden" });
            }
            
            const { studentId, subjectId, date, status } = req.body;
            
            await query(
                "INSERT INTO attendance (student_id, subject_id, date, status) VALUES (?, ?, ?, ?)",
                [studentId, subjectId, date, status]
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Admin: Add Student
    app.post("/api/admin/students", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
            
            const { name, email, password, rollNumber, semester, department } = req.body;
            const hashedPassword = bcrypt.hashSync(password, 10);
            
            const userId = await insert(
                "INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)",
                [name, email, hashedPassword, "student", department]
            );
            
            await query(
                "INSERT INTO students (user_id, roll_number, semester) VALUES (?, ?, ?)",
                [userId, rollNumber, semester]
            );
            
            res.json({ success: true });
        } catch (e) {
            res.status(400).json({ message: "Email or Roll Number already exists" });
        }
    });

    // Librarian: Update Library Status
    app.post("/api/librarian/status", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "librarian" && req.user.role !== "admin") {
                return res.status(403).json({ message: "Forbidden" });
            }
            
            const { status } = req.body;
            await query("UPDATE library_status SET status = ? WHERE id = 1", [status]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    app.get("/api/library/status", async (req, res) => {
        try {
            const status = await queryOne("SELECT status FROM library_status WHERE id = 1");
            res.json(status);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Librarian: Add/Remove Books
    app.post("/api/librarian/books", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "librarian" && req.user.role !== "admin") {
                return res.status(403).json({ message: "Forbidden" });
            }
            
            const { title, author, category, copies } = req.body;
            await query(
                "INSERT INTO books (title, author, category, copies) VALUES (?, ?, ?, ?)",
                [title, author, category, copies || 1]
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    app.delete("/api/librarian/books/:id", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "librarian" && req.user.role !== "admin") {
                return res.status(403).json({ message: "Forbidden" });
            }
            
            await query("DELETE FROM books WHERE id = ?", [req.params.id]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Librarian: Update Book Availability
    app.post("/api/librarian/books/availability", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "librarian" && req.user.role !== "admin") {
                return res.status(403).json({ message: "Forbidden" });
            }
            
            const { bookId, availability, copies } = req.body;
            await query(
                "UPDATE books SET availability = ?, copies = ? WHERE id = ?",
                [availability, copies, bookId]
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Lost & Found: Claim Item
    app.post("/api/lost-found/claim", authenticateToken, async (req: any, res) => {
        try {
            const { itemId, proof } = req.body;
            
            await query(
                "UPDATE lost_found SET proof = ?, claimed_by = ?, status = 'claimed' WHERE id = ?",
                [proof, req.user.id, itemId]
            );
            
            // Notify Admin
            await query(
                "INSERT INTO notifications (title, message, target_role) VALUES (?, ?, ?)",
                ["New Item Claim", `A claim has been filed for item ID ${itemId}`, "admin"]
            );
            
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Admin: Approve/Reject Claim
    app.post("/api/admin/lost-found/action", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "admin" && req.user.role !== "faculty") {
                return res.status(403).json({ message: "Forbidden" });
            }
            
            const { itemId, action } = req.body;
            const item = await queryOne("SELECT * FROM lost_found WHERE id = ?", [itemId]) as any;
            
            if (action === 'approve') {
                await query("UPDATE lost_found SET status = 'returned' WHERE id = ?", [itemId]);
                await query(
                    "INSERT INTO notifications (title, message, target_role) VALUES (?, ?, ?)",
                    ["Claim Approved", `Your claim for ${item.item_name} has been approved.`, "student"]
                );
            } else if (action === 'reject') {
                await query(
                    "UPDATE lost_found SET status = 'found', proof = NULL, claimed_by = NULL WHERE id = ?",
                    [itemId]
                );
                await query(
                    "INSERT INTO notifications (title, message, target_role) VALUES (?, ?, ?)",
                    ["Claim Rejected", `Your claim for ${item.item_name} was rejected.`, "student"]
                );
            } else if (action === 'delete') {
                await query("DELETE FROM lost_found WHERE id = ?", [itemId]);
            }
            
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Faculty/Admin: Add Event
    app.post("/api/events", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "faculty" && req.user.role !== "admin") {
                return res.status(403).json({ message: "Forbidden" });
            }
            
            const { title, description, date, venue, category } = req.body;
            await query(
                "INSERT INTO events (title, description, date, venue, category, created_by) VALUES (?, ?, ?, ?, ?, ?)",
                [title, description, date, venue, category, req.user.id]
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Faculty/Admin: Add Notification
    app.post("/api/notifications", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "faculty" && req.user.role !== "admin") {
                return res.status(403).json({ message: "Forbidden" });
            }
            
            const { title, message, targetRole } = req.body;
            await query(
                "INSERT INTO notifications (title, message, target_role) VALUES (?, ?, ?)",
                [title, message, targetRole]
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Faculty/Admin/Librarian: Upload Material
    app.post("/api/materials", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "faculty" && req.user.role !== "admin" && req.user.role !== "librarian") {
                return res.status(403).json({ message: "Forbidden" });
            }
            
            const { title, type, subjectId, semester, url } = req.body;
            await query(
                "INSERT INTO materials (title, type, subject_id, semester, url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)",
                [title, type, subjectId, semester, url, req.user.id]
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Admin: Get all student fees
    app.get("/api/admin/fees", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
            
            const fees = await query(`
                SELECT f.*, u.name as student_name, s.roll_number 
                FROM fees f 
                JOIN students s ON f.student_id = s.id 
                JOIN users u ON s.user_id = u.id
            `);
            res.json(fees);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Admin: Update Student CGPA and Markscard
    app.post("/api/admin/students/update", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
            
            const { studentId, cgpa, markscardUrl } = req.body;
            await query(
                "UPDATE students SET cgpa = ?, markscard_url = ? WHERE id = ?",
                [cgpa, markscardUrl, studentId]
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Admin: Add Fees
    app.post("/api/admin/fees", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
            
            const { studentId, amount, dueDate, status } = req.body;
            await query(
                "INSERT INTO fees (student_id, amount, due_date, status) VALUES (?, ?, ?, ?)",
                [studentId, amount, dueDate, status || 'pending']
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });

    // Student: Get own fees
    app.get("/api/student/fees", authenticateToken, async (req: any, res) => {
        try {
            if (req.user.role !== "student") return res.status(403).json({ message: "Forbidden" });
            
            const student = await queryOne("SELECT id FROM students WHERE user_id = ?", [req.user.id]) as any;
            const fees = await query("SELECT * FROM fees WHERE student_id = ?", [student.id]);
            res.json(fees);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
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