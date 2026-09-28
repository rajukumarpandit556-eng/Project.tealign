// server.ts
import path2 from "node:path";
import { fileURLToPath } from "node:url";
import express2 from "express";

// server/index.ts
import express from "express";

// server/api.ts
import { Router } from "express";

// server/db.ts
import initSqlJs from "sql.js";
import fs from "node:fs";
import path from "node:path";
var DB_DIR = path.resolve(process.cwd(), "data");
var DB_FILE = path.join(DB_DIR, "tealign.sqlite");
var dbInstance = null;
async function getDb() {
  if (dbInstance) return dbInstance;
  const SQL = await initSqlJs();
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
      dbInstance.run("PRAGMA foreign_keys = ON;");
      return dbInstance;
    } catch (err) {
      console.error("Error loading existing SQLite database, creating fresh one:", err);
    }
  }
  dbInstance = new SQL.Database();
  dbInstance.run("PRAGMA foreign_keys = ON;");
  initSchema(dbInstance);
  persistDb();
  return dbInstance;
}
function persistDb() {
  if (!dbInstance) return;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error("Failed to persist database to disk:", err);
  }
}
function initSchema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('teacher', 'student', 'institute', 'admin')),
      avatar_url TEXT,
      phone TEXT,
      location TEXT,
      is_verified INTEGER DEFAULT 0,
      is_suspended INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teacher_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      bio TEXT,
      qualification TEXT NOT NULL,
      experience_years INTEGER NOT NULL DEFAULT 0,
      hourly_rate INTEGER NOT NULL DEFAULT 500,
      monthly_rate INTEGER,
      service_radius_km INTEGER DEFAULT 10,
      teaching_modes TEXT NOT NULL, -- JSON array: ["home_student", "teacher_home", "coaching", "school", "online"]
      subjects TEXT NOT NULL, -- JSON array
      classes TEXT NOT NULL, -- JSON array
      languages TEXT NOT NULL, -- JSON array
      employment_types TEXT NOT NULL, -- JSON array: ["full_time", "part_time", "freelance_hourly"]
      verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK(verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
      verification_doc_name TEXT,
      verification_notes TEXT,
      rating_avg REAL DEFAULT 5.0,
      review_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS availability_slots (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      day_of_week TEXT NOT NULL CHECK(day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
      start_time TEXT NOT NULL, -- "HH:MM" 24h
      end_time TEXT NOT NULL,   -- "HH:MM" 24h
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS institute_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      institute_name TEXT NOT NULL,
      institute_type TEXT NOT NULL CHECK(institute_type IN ('school', 'coaching', 'academy')),
      website TEXT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      description TEXT,
      established_year INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      institute_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      class_grade TEXT NOT NULL,
      qualification_req TEXT NOT NULL,
      experience_req INTEGER NOT NULL DEFAULT 0,
      location TEXT NOT NULL,
      employment_type TEXT NOT NULL CHECK(employment_type IN ('full-time', 'part-time', 'hourly')),
      salary_min INTEGER NOT NULL,
      salary_max INTEGER NOT NULL,
      salary_type TEXT NOT NULL DEFAULT 'monthly' CHECK(salary_type IN ('monthly', 'hourly')),
      required_schedule TEXT NOT NULL, -- JSON array of {day: string, time: string}
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(institute_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      cover_letter TEXT,
      expected_salary INTEGER,
      status TEXT NOT NULL DEFAULT 'applied' CHECK(status IN ('applied', 'shortlisted', 'interview', 'hired', 'rejected')),
      interview_date TEXT,
      interview_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS teacher_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      class_grade TEXT NOT NULL,
      teaching_mode TEXT NOT NULL,
      preferred_days TEXT NOT NULL, -- JSON array
      preferred_time_slot TEXT NOT NULL,
      student_location TEXT NOT NULL,
      hourly_budget INTEGER,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'hired', 'completed', 'cancelled')),
      status_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      reviewer_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      subject TEXT NOT NULL,
      interaction_type TEXT NOT NULL CHECK(interaction_type IN ('parent_request', 'institute_job')),
      is_moderated INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY(reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK(item_type IN ('teacher', 'job')),
      item_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      context_type TEXT NOT NULL CHECK(context_type IN ('request', 'application')),
      context_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      reported_user_id TEXT,
      target_type TEXT NOT NULL CHECK(target_type IN ('user', 'job', 'review', 'message')),
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'investigating', 'resolved', 'dismissed')),
      action_taken TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(reporter_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user ON teacher_profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_availability_teacher ON availability_slots(teacher_id, day_of_week);
    CREATE INDEX IF NOT EXISTS idx_jobs_institute ON jobs(institute_id);
    CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
    CREATE INDEX IF NOT EXISTS idx_job_applications_teacher ON job_applications(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_teacher_requests_teacher ON teacher_requests(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_teacher_requests_student ON teacher_requests(student_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_teacher ON reviews(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_items(user_id, item_type);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_messages_context ON messages(context_type, context_id);
  `);
}
function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    return results;
  } finally {
    stmt.free();
  }
}
function queryOne(db, sql, params = []) {
  const results = queryAll(db, sql, params);
  return results.length > 0 ? results[0] : null;
}
function execute(db, sql, params = []) {
  db.run(sql, params);
  persistDb();
}

// server/auth.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "tealign_production_secret_key_2026_9831a";
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Authentication required. Please sign in." });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Session expired or invalid. Please sign in again." });
  }
  try {
    const db = await getDb();
    const user = queryOne(db, "SELECT id, email, role, full_name, is_suspended FROM users WHERE id = ?", [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }
    if (user.is_suspended) {
      return res.status(403).json({ error: "Your account has been suspended. Please contact support." });
    }
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    };
    next();
  } catch (err) {
    console.error("Auth verification error:", err);
    res.status(500).json({ error: "Internal authentication error" });
  }
}
function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access forbidden for ${req.user.role} role.` });
    }
    next();
  };
}

// server/api.ts
var apiRouter = Router();
apiRouter.post("/auth/register", async (req, res) => {
  try {
    const { email, password, full_name, role, phone, location } = req.body;
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: "Email, password, full name, and role are required." });
    }
    if (!["teacher", "student", "institute"].includes(role)) {
      return res.status(400).json({ error: "Role must be teacher, student, or institute." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }
    const db = await getDb();
    const existing = queryOne(db, "SELECT id FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = await hashPassword(password);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    execute(db, `
      INSERT INTO users (id, email, password_hash, full_name, role, avatar_url, phone, location, is_verified, is_suspended, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `, [
      userId,
      email.toLowerCase().trim(),
      passwordHash,
      full_name.trim(),
      role,
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}&backgroundColor=2563eb,1e3a8a,14b8a6`,
      phone || null,
      location || "Online",
      now,
      now
    ]);
    if (role === "teacher") {
      const profileId = `tp_${userId}`;
      execute(db, `
        INSERT INTO teacher_profiles (
          id, user_id, title, bio, qualification, experience_years, hourly_rate, monthly_rate,
          service_radius_km, teaching_modes, subjects, classes, languages, employment_types,
          verification_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 0, 800, 12000, 10, ?, ?, ?, ?, ?, 'unverified', ?, ?)
      `, [
        profileId,
        userId,
        "Educator & Subject Specialist",
        "Experienced educator passionate about student-centric learning.",
        "Bachelor Degree",
        JSON.stringify(["online", "home_student"]),
        JSON.stringify(["General Science", "Mathematics"]),
        JSON.stringify(["Grade 8", "Grade 9", "Grade 10"]),
        JSON.stringify(["English"]),
        JSON.stringify(["part_time", "freelance_hourly"]),
        now,
        now
      ]);
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
      for (const d of days) {
        execute(db, `
          INSERT INTO availability_slots (id, teacher_id, day_of_week, start_time, end_time, is_active)
          VALUES (?, ?, ?, '16:00', '19:00', 1)
        `, [`av_${userId}_${d}`, userId, d]);
      }
    } else if (role === "institute") {
      execute(db, `
        INSERT INTO institute_profiles (
          id, user_id, institute_name, institute_type, address, city, description, established_year, created_at, updated_at
        ) VALUES (?, ?, ?, 'school', ?, ?, ?, 2020, ?, ?)
      `, [
        `ip_${userId}`,
        userId,
        full_name,
        location || "City Campus",
        location || "Main Center",
        "Academic institution dedicated to excellence in education.",
        now,
        now
      ]);
    }
    const token = generateToken({
      id: userId,
      email: email.toLowerCase().trim(),
      role,
      full_name: full_name.trim()
    });
    res.status(201).json({
      token,
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        role,
        full_name: full_name.trim(),
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}&backgroundColor=2563eb`,
        phone,
        location,
        is_verified: 0
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message || "Internal server error during registration." });
  }
});
apiRouter.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const db = await getDb();
    const user = queryOne(db, "SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (user.is_suspended) {
      return res.status(403).json({ error: "This account has been suspended by administration." });
    }
    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        phone: user.phone,
        location: user.location,
        is_verified: user.is_verified
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal login error" });
  }
});
apiRouter.post("/auth/demo-login", async (req, res) => {
  try {
    const { role } = req.body;
    const db = await getDb();
    let email = "admin@tealign.com";
    if (role === "teacher") email = "teacher.ananya@tealign.com";
    else if (role === "student") email = "parent.priya@tealign.com";
    else if (role === "institute") email = "school.apex@tealign.com";
    const user = queryOne(db, "SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(404).json({ error: `Demo user for role ${role} not found.` });
    }
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        phone: user.phone,
        location: user.location,
        is_verified: user.is_verified
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Demo switch failed" });
  }
});
apiRouter.get("/auth/me", authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const user = queryOne(db, "SELECT id, email, role, full_name, avatar_url, phone, location, is_verified, is_suspended, created_at FROM users WHERE id = ?", [req.user.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    let profileData = null;
    if (user.role === "teacher") {
      profileData = queryOne(db, "SELECT * FROM teacher_profiles WHERE user_id = ?", [user.id]);
      if (profileData) {
        profileData.teaching_modes = JSON.parse(profileData.teaching_modes || "[]");
        profileData.subjects = JSON.parse(profileData.subjects || "[]");
        profileData.classes = JSON.parse(profileData.classes || "[]");
        profileData.languages = JSON.parse(profileData.languages || "[]");
        profileData.employment_types = JSON.parse(profileData.employment_types || "[]");
      }
    } else if (user.role === "institute") {
      profileData = queryOne(db, "SELECT * FROM institute_profiles WHERE user_id = ?", [user.id]);
    }
    res.json({ user, profile: profileData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/auth/profile", authenticateToken, async (req, res) => {
  try {
    const { full_name, phone, location, avatar_url } = req.body;
    const db = await getDb();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    execute(db, `
      UPDATE users
      SET full_name = COALESCE(?, full_name),
          phone = COALESCE(?, phone),
          location = COALESCE(?, location),
          avatar_url = COALESCE(?, avatar_url),
          updated_at = ?
      WHERE id = ?
    `, [full_name, phone, location, avatar_url, now, req.user.id]);
    const updatedUser = queryOne(db, "SELECT id, email, role, full_name, avatar_url, phone, location, is_verified FROM users WHERE id = ?", [req.user.id]);
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/teachers", optionalAuth, async (req, res) => {
  try {
    const {
      q,
      subject,
      class_grade,
      location,
      mode,
      max_fee,
      min_experience,
      verified_only,
      day_of_week,
      time_slot,
      // e.g. "17:00" or "16:00-19:00"
      sort_by
      // 'rating', 'experience', 'fee_asc', 'fee_desc'
    } = req.query;
    const db = await getDb();
    let sql = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        u.avatar_url,
        u.location,
        u.is_verified,
        tp.id as profile_id,
        tp.title,
        tp.bio,
        tp.qualification,
        tp.experience_years,
        tp.hourly_rate,
        tp.monthly_rate,
        tp.service_radius_km,
        tp.teaching_modes,
        tp.subjects,
        tp.classes,
        tp.languages,
        tp.employment_types,
        tp.verification_status,
        tp.rating_avg,
        tp.review_count
      FROM users u
      JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE u.role = 'teacher' AND u.is_suspended = 0
    `;
    const params = [];
    if (verified_only === "true") {
      sql += ` AND (u.is_verified = 1 OR tp.verification_status = 'verified')`;
    }
    if (max_fee) {
      sql += ` AND tp.hourly_rate <= ?`;
      params.push(Number(max_fee));
    }
    if (min_experience) {
      sql += ` AND tp.experience_years >= ?`;
      params.push(Number(min_experience));
    }
    let rows = queryAll(db, sql, params);
    let teachers = rows.map((r) => ({
      ...r,
      teaching_modes: JSON.parse(r.teaching_modes || "[]"),
      subjects: JSON.parse(r.subjects || "[]"),
      classes: JSON.parse(r.classes || "[]"),
      languages: JSON.parse(r.languages || "[]"),
      employment_types: JSON.parse(r.employment_types || "[]")
    }));
    if (q) {
      const searchTerm = String(q).toLowerCase();
      teachers = teachers.filter(
        (t) => t.full_name.toLowerCase().includes(searchTerm) || t.title.toLowerCase().includes(searchTerm) || t.qualification.toLowerCase().includes(searchTerm) || t.subjects.some((s) => s.toLowerCase().includes(searchTerm))
      );
    }
    if (subject) {
      const subjTerm = String(subject).toLowerCase();
      teachers = teachers.filter(
        (t) => t.subjects.some((s) => s.toLowerCase().includes(subjTerm))
      );
    }
    if (class_grade) {
      const gradeTerm = String(class_grade).toLowerCase();
      teachers = teachers.filter(
        (t) => t.classes.some((c) => c.toLowerCase().includes(gradeTerm))
      );
    }
    if (location) {
      const locTerm = String(location).toLowerCase();
      teachers = teachers.filter(
        (t) => (t.location || "").toLowerCase().includes(locTerm)
      );
    }
    if (mode) {
      teachers = teachers.filter(
        (t) => t.teaching_modes.includes(mode)
      );
    }
    if (day_of_week) {
      const day = String(day_of_week).toLowerCase();
      const slots = queryAll(db, `
        SELECT teacher_id, start_time, end_time 
        FROM availability_slots 
        WHERE day_of_week = ? AND is_active = 1
      `, [day]);
      const teacherAvailableIds = /* @__PURE__ */ new Set();
      for (const slot of slots) {
        if (!time_slot) {
          teacherAvailableIds.add(slot.teacher_id);
        } else {
          const [reqStart, reqEnd] = String(time_slot).includes("-") ? String(time_slot).split("-") : [String(time_slot), String(time_slot)];
          if (slot.start_time <= reqStart && slot.end_time >= reqEnd) {
            teacherAvailableIds.add(slot.teacher_id);
          }
        }
      }
      teachers = teachers.filter((t) => teacherAvailableIds.has(t.user_id));
    }
    if (sort_by === "experience") {
      teachers.sort((a, b) => b.experience_years - a.experience_years);
    } else if (sort_by === "fee_asc") {
      teachers.sort((a, b) => a.hourly_rate - b.hourly_rate);
    } else if (sort_by === "fee_desc") {
      teachers.sort((a, b) => b.hourly_rate - a.hourly_rate);
    } else {
      teachers.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
    }
    res.json({ teachers, total: teachers.length });
  } catch (err) {
    console.error("Teachers query error:", err);
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/teachers/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const user = queryOne(db, `
      SELECT id, full_name, email, avatar_url, phone, location, is_verified, created_at 
      FROM users 
      WHERE id = ? AND role = 'teacher'
    `, [id]);
    if (!user) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    const profile = queryOne(db, "SELECT * FROM teacher_profiles WHERE user_id = ?", [id]);
    if (!profile) {
      return res.status(404).json({ error: "Teacher profile not set up yet" });
    }
    profile.teaching_modes = JSON.parse(profile.teaching_modes || "[]");
    profile.subjects = JSON.parse(profile.subjects || "[]");
    profile.classes = JSON.parse(profile.classes || "[]");
    profile.languages = JSON.parse(profile.languages || "[]");
    profile.employment_types = JSON.parse(profile.employment_types || "[]");
    const availabilitySlots = queryAll(db, `
      SELECT id, day_of_week, start_time, end_time, is_active 
      FROM availability_slots 
      WHERE teacher_id = ? 
      ORDER BY 
        CASE day_of_week 
          WHEN 'monday' THEN 1 
          WHEN 'tuesday' THEN 2 
          WHEN 'wednesday' THEN 3 
          WHEN 'thursday' THEN 4 
          WHEN 'friday' THEN 5 
          WHEN 'saturday' THEN 6 
          WHEN 'sunday' THEN 7 
        END, start_time ASC
    `, [id]);
    const reviews = queryAll(db, `
      SELECT r.*, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.teacher_id = ? AND r.is_moderated = 1
      ORDER BY r.created_at DESC
    `, [id]);
    let isSaved = false;
    if (req.user) {
      const saved = queryOne(db, 'SELECT id FROM saved_items WHERE user_id = ? AND item_type = "teacher" AND item_id = ?', [req.user.id, id]);
      isSaved = !!saved;
    }
    res.json({
      teacher: {
        ...user,
        profile,
        availability: availabilitySlots,
        reviews,
        is_saved: isSaved
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/teachers/profile", authenticateToken, requireRole("teacher"), async (req, res) => {
  try {
    const {
      title,
      bio,
      qualification,
      experience_years,
      hourly_rate,
      monthly_rate,
      service_radius_km,
      teaching_modes,
      subjects,
      classes,
      languages,
      employment_types
    } = req.body;
    const db = await getDb();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    execute(db, `
      UPDATE teacher_profiles
      SET title = COALESCE(?, title),
          bio = COALESCE(?, bio),
          qualification = COALESCE(?, qualification),
          experience_years = COALESCE(?, experience_years),
          hourly_rate = COALESCE(?, hourly_rate),
          monthly_rate = COALESCE(?, monthly_rate),
          service_radius_km = COALESCE(?, service_radius_km),
          teaching_modes = COALESCE(?, teaching_modes),
          subjects = COALESCE(?, subjects),
          classes = COALESCE(?, classes),
          languages = COALESCE(?, languages),
          employment_types = COALESCE(?, employment_types),
          updated_at = ?
      WHERE user_id = ?
    `, [
      title,
      bio,
      qualification,
      experience_years !== void 0 ? Number(experience_years) : null,
      hourly_rate !== void 0 ? Number(hourly_rate) : null,
      monthly_rate !== void 0 ? Number(monthly_rate) : null,
      service_radius_km !== void 0 ? Number(service_radius_km) : null,
      teaching_modes ? JSON.stringify(teaching_modes) : null,
      subjects ? JSON.stringify(subjects) : null,
      classes ? JSON.stringify(classes) : null,
      languages ? JSON.stringify(languages) : null,
      employment_types ? JSON.stringify(employment_types) : null,
      now,
      req.user.id
    ]);
    res.json({ message: "Teacher profile updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/teachers/me/availability", authenticateToken, requireRole("teacher"), async (req, res) => {
  try {
    const db = await getDb();
    const slots = queryAll(db, `
      SELECT id, day_of_week, start_time, end_time, is_active
      FROM availability_slots
      WHERE teacher_id = ?
      ORDER BY 
        CASE day_of_week 
          WHEN 'monday' THEN 1 
          WHEN 'tuesday' THEN 2 
          WHEN 'wednesday' THEN 3 
          WHEN 'thursday' THEN 4 
          WHEN 'friday' THEN 5 
          WHEN 'saturday' THEN 6 
          WHEN 'sunday' THEN 7 
        END, start_time ASC
    `, [req.user.id]);
    res.json({ slots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/teachers/me/availability", authenticateToken, requireRole("teacher"), async (req, res) => {
  try {
    const { slots } = req.body;
    if (!Array.isArray(slots)) {
      return res.status(400).json({ error: "Slots must be an array of schedule objects." });
    }
    const db = await getDb();
    execute(db, "DELETE FROM availability_slots WHERE teacher_id = ?", [req.user.id]);
    for (const s of slots) {
      if (!s.day_of_week || !s.start_time || !s.end_time) continue;
      const slotId = `av_${req.user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      execute(db, `
        INSERT INTO availability_slots (id, teacher_id, day_of_week, start_time, end_time, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [slotId, req.user.id, s.day_of_week.toLowerCase(), s.start_time, s.end_time, s.is_active !== void 0 ? s.is_active ? 1 : 0 : 1]);
    }
    res.json({ message: "Weekly availability updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/teachers/me/verification", authenticateToken, requireRole("teacher"), async (req, res) => {
  try {
    const { document_name, notes } = req.body;
    if (!document_name) {
      return res.status(400).json({ error: "Document name or proof is required." });
    }
    const db = await getDb();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    execute(db, `
      UPDATE teacher_profiles
      SET verification_status = 'pending',
          verification_doc_name = ?,
          verification_notes = ?,
          updated_at = ?
      WHERE user_id = ?
    `, [document_name, notes || "Submitted for verification", now, req.user.id]);
    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, 'usr_admin', 'New Teacher Verification Request', ?, '/admin', 0, 'verification', ?)
    `, [`notif_${Date.now()}`, `${req.user.full_name} submitted credentials for verification.`, now]);
    res.json({ message: "Verification documents submitted. Our team will review within 24-48 hours." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/jobs", optionalAuth, async (req, res) => {
  try {
    const { q, subject, class_grade, location, employment_type, status } = req.query;
    const db = await getDb();
    let sql = `
      SELECT 
        j.*,
        ip.institute_name,
        ip.institute_type,
        ip.city as institute_city,
        u.avatar_url as institute_logo,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as applicant_count
      FROM jobs j
      JOIN institute_profiles ip ON j.institute_id = ip.user_id
      JOIN users u ON j.institute_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      sql += ` AND j.status = ?`;
      params.push(status);
    } else {
      sql += ` AND j.status = 'open'`;
    }
    if (subject) {
      sql += ` AND LOWER(j.subject) LIKE ?`;
      params.push(`%${String(subject).toLowerCase()}%`);
    }
    if (class_grade) {
      sql += ` AND LOWER(j.class_grade) LIKE ?`;
      params.push(`%${String(class_grade).toLowerCase()}%`);
    }
    if (location) {
      sql += ` AND LOWER(j.location) LIKE ?`;
      params.push(`%${String(location).toLowerCase()}%`);
    }
    if (employment_type) {
      sql += ` AND j.employment_type = ?`;
      params.push(employment_type);
    }
    sql += ` ORDER BY j.created_at DESC`;
    let jobs = queryAll(db, sql, params);
    jobs = jobs.map((job) => ({
      ...job,
      required_schedule: JSON.parse(job.required_schedule || "[]")
    }));
    if (q) {
      const term = String(q).toLowerCase();
      jobs = jobs.filter(
        (j) => j.title.toLowerCase().includes(term) || j.description.toLowerCase().includes(term) || j.institute_name.toLowerCase().includes(term) || j.subject.toLowerCase().includes(term)
      );
    }
    if (req.user) {
      const userApplications = queryAll(db, "SELECT job_id, status FROM job_applications WHERE teacher_id = ?", [req.user.id]);
      const appMap = new Map(userApplications.map((a) => [a.job_id, a.status]));
      const savedItems = new Set(queryAll(db, 'SELECT item_id FROM saved_items WHERE user_id = ? AND item_type = "job"', [req.user.id]).map((s) => s.item_id));
      jobs = jobs.map((j) => ({
        ...j,
        user_applied: appMap.has(j.id),
        user_application_status: appMap.get(j.id) || null,
        is_saved: savedItems.has(j.id)
      }));
    }
    res.json({ jobs, total: jobs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/jobs/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const job = queryOne(db, `
      SELECT 
        j.*,
        ip.institute_name,
        ip.institute_type,
        ip.website,
        ip.address,
        ip.city,
        ip.description as institute_about,
        u.avatar_url as institute_logo,
        u.email as institute_email,
        u.phone as institute_phone,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as applicant_count
      FROM jobs j
      JOIN institute_profiles ip ON j.institute_id = ip.user_id
      JOIN users u ON j.institute_id = u.id
      WHERE j.id = ?
    `, [id]);
    if (!job) {
      return res.status(404).json({ error: "Job opening not found" });
    }
    job.required_schedule = JSON.parse(job.required_schedule || "[]");
    let userApplication = null;
    let isSaved = false;
    if (req.user) {
      userApplication = queryOne(db, "SELECT * FROM job_applications WHERE job_id = ? AND teacher_id = ?", [id, req.user.id]);
      const saved = queryOne(db, 'SELECT id FROM saved_items WHERE user_id = ? AND item_type = "job" AND item_id = ?', [req.user.id, id]);
      isSaved = !!saved;
    }
    res.json({ job, user_application: userApplication, is_saved: isSaved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/jobs", authenticateToken, requireRole("institute"), async (req, res) => {
  try {
    const {
      title,
      subject,
      class_grade,
      qualification_req,
      experience_req,
      location,
      employment_type,
      salary_min,
      salary_max,
      salary_type,
      required_schedule,
      description
    } = req.body;
    if (!title || !subject || !class_grade || !salary_min || !description) {
      return res.status(400).json({ error: "Title, subject, class grade, salary, and description are required." });
    }
    const db = await getDb();
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    execute(db, `
      INSERT INTO jobs (
        id, institute_id, title, subject, class_grade, qualification_req, experience_req,
        location, employment_type, salary_min, salary_max, salary_type, required_schedule,
        description, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
    `, [
      jobId,
      req.user.id,
      title.trim(),
      subject.trim(),
      class_grade.trim(),
      qualification_req || "Bachelor or Master in relevant subject",
      Number(experience_req) || 0,
      location || "On-site campus",
      employment_type || "full-time",
      Number(salary_min),
      Number(salary_max || salary_min),
      salary_type || "monthly",
      JSON.stringify(required_schedule || []),
      description.trim(),
      now,
      now
    ]);
    res.status(201).json({ message: "Teaching job posted successfully", job_id: jobId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/jobs/:id", authenticateToken, requireRole("institute", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, description, salary_min, salary_max } = req.body;
    const db = await getDb();
    const job = queryOne(db, "SELECT institute_id FROM jobs WHERE id = ?", [id]);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (req.user.role !== "admin" && job.institute_id !== req.user.id) {
      return res.status(403).json({ error: "You are not authorized to update this job." });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    execute(db, `
      UPDATE jobs
      SET status = COALESCE(?, status),
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          salary_min = COALESCE(?, salary_min),
          salary_max = COALESCE(?, salary_max),
          updated_at = ?
      WHERE id = ?
    `, [status, title, description, salary_min, salary_max, now, id]);
    res.json({ message: "Job updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/institutes/me/jobs", authenticateToken, requireRole("institute"), async (req, res) => {
  try {
    const db = await getDb();
    const jobs = queryAll(db, `
      SELECT 
        j.*,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) as applicant_count,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'applied') as new_applicant_count,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'interview') as interview_count,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'hired') as hired_count
      FROM jobs j
      WHERE j.institute_id = ?
      ORDER BY j.created_at DESC
    `, [req.user.id]);
    const formatted = jobs.map((j) => ({
      ...j,
      required_schedule: JSON.parse(j.required_schedule || "[]")
    }));
    res.json({ jobs: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/jobs/:id/applications", authenticateToken, requireRole("institute", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const job = queryOne(db, "SELECT institute_id, title FROM jobs WHERE id = ?", [id]);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (req.user.role !== "admin" && job.institute_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to view applications for this job" });
    }
    const applications = queryAll(db, `
      SELECT 
        ja.*,
        u.full_name as teacher_name,
        u.email as teacher_email,
        u.phone as teacher_phone,
        u.avatar_url as teacher_avatar,
        u.location as teacher_location,
        u.is_verified,
        tp.title as teacher_title,
        tp.qualification,
        tp.experience_years,
        tp.hourly_rate,
        tp.rating_avg,
        tp.review_count,
        tp.subjects,
        tp.teaching_modes
      FROM job_applications ja
      JOIN users u ON ja.teacher_id = u.id
      JOIN teacher_profiles tp ON ja.teacher_id = tp.user_id
      WHERE ja.job_id = ?
      ORDER BY ja.created_at DESC
    `, [id]);
    const formatted = applications.map((a) => ({
      ...a,
      subjects: JSON.parse(a.subjects || "[]"),
      teaching_modes: JSON.parse(a.teaching_modes || "[]")
    }));
    res.json({ applications: formatted, job_title: job.title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/jobs/:id/apply", authenticateToken, requireRole("teacher"), async (req, res) => {
  try {
    const { id } = req.params;
    const { cover_letter, expected_salary } = req.body;
    const db = await getDb();
    const job = queryOne(db, "SELECT id, institute_id, title, status FROM jobs WHERE id = ?", [id]);
    if (!job) return res.status(404).json({ error: "Job opening not found" });
    if (job.status === "closed") {
      return res.status(400).json({ error: "This job posting is now closed." });
    }
    const existing = queryOne(db, "SELECT id FROM job_applications WHERE job_id = ? AND teacher_id = ?", [id, req.user.id]);
    if (existing) {
      return res.status(409).json({ error: "You have already submitted an application for this position." });
    }
    const appId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    execute(db, `
      INSERT INTO job_applications (id, job_id, teacher_id, cover_letter, expected_salary, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'applied', ?, ?)
    `, [appId, id, req.user.id, cover_letter || "", Number(expected_salary) || 0, now, now]);
    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, ?, 'New Job Application Received', ?, ?, 0, 'application', ?)
    `, [
      `notif_${Date.now()}`,
      job.institute_id,
      `${req.user.full_name} applied for "${job.title}".`,
      `/institute/jobs/${id}`,
      now
    ]);
    res.status(201).json({ message: "Application submitted successfully!", application_id: appId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/teachers/me/applications", authenticateToken, requireRole("teacher"), async (req, res) => {
  try {
    const db = await getDb();
    const apps = queryAll(db, `
      SELECT 
        ja.*,
        j.title as job_title,
        j.subject,
        j.class_grade,
        j.location as job_location,
        j.employment_type,
        j.salary_min,
        j.salary_max,
        j.salary_type,
        j.status as job_status,
        ip.institute_name,
        u.avatar_url as institute_logo
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN institute_profiles ip ON j.institute_id = ip.user_id
      JOIN users u ON j.institute_id = u.id
      WHERE ja.teacher_id = ?
      ORDER BY ja.created_at DESC
    `, [req.user.id]);
    res.json({ applications: apps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/applications/:id/status", authenticateToken, requireRole("institute", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, interview_date, interview_notes } = req.body;
    const validStatuses = ["applied", "shortlisted", "interview", "hired", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }
    const db = await getDb();
    const application = queryOne(db, `
      SELECT ja.*, j.title as job_title, j.institute_id, u.full_name as teacher_name
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN users u ON ja.teacher_id = u.id
      WHERE ja.id = ?
    `, [id]);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    if (req.user.role !== "admin" && application.institute_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to modify this application." });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    execute(db, `
      UPDATE job_applications
      SET status = ?,
          interview_date = COALESCE(?, interview_date),
          interview_notes = COALESCE(?, interview_notes),
          updated_at = ?
      WHERE id = ?
    `, [status, interview_date, interview_notes, now, id]);
    let messageText = `Your application for "${application.job_title}" status updated to: ${status.toUpperCase()}.`;
    if (status === "interview") {
      messageText = `Interview scheduled for "${application.job_title}"! Check your applications tab for timing and notes.`;
    } else if (status === "hired") {
      messageText = `Congratulations! You have been marked HIRED for "${application.job_title}".`;
    }
    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, ?, 'Job Application Update', ?, '/applications', 0, 'application', ?)
    `, [`notif_${Date.now()}`, application.teacher_id, messageText, now]);
    res.json({ message: `Application status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/requests", authenticateToken, requireRole("student"), async (req, res) => {
  try {
    const {
      teacher_id,
      subject,
      class_grade,
      teaching_mode,
      preferred_days,
      preferred_time_slot,
      student_location,
      hourly_budget,
      message
    } = req.body;
    if (!teacher_id || !subject || !class_grade || !message) {
      return res.status(400).json({ error: "Teacher ID, subject, class grade, and message are required." });
    }
    const db = await getDb();
    const teacher = queryOne(db, 'SELECT id, full_name FROM users WHERE id = ? AND role = "teacher"', [teacher_id]);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    execute(db, `
      INSERT INTO teacher_requests (
        id, student_id, teacher_id, subject, class_grade, teaching_mode,
        preferred_days, preferred_time_slot, student_location, hourly_budget,
        message, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `, [
      reqId,
      req.user.id,
      teacher_id,
      subject,
      class_grade,
      teaching_mode || "online",
      JSON.stringify(preferred_days || ["monday", "wednesday"]),
      preferred_time_slot || "Flexible",
      student_location || "Online",
      Number(hourly_budget) || 1e3,
      message.trim(),
      now,
      now
    ]);
    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, ?, 'New Tuition Request', ?, '/requests', 0, 'request', ?)
    `, [
      `notif_${Date.now()}`,
      teacher_id,
      `${req.user.full_name} sent you a request for ${subject} (${class_grade}).`,
      now
    ]);
    execute(db, `
      INSERT INTO messages (id, sender_id, receiver_id, context_type, context_id, content, is_read, created_at)
      VALUES (?, ?, ?, 'request', ?, ?, 0, ?)
    `, [`msg_${Date.now()}`, req.user.id, teacher_id, reqId, message.trim(), now]);
    res.status(201).json({ message: "Request sent successfully!", request_id: reqId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/requests/student", authenticateToken, requireRole("student"), async (req, res) => {
  try {
    const db = await getDb();
    const requests = queryAll(db, `
      SELECT 
        tr.*,
        u.full_name as teacher_name,
        u.email as teacher_email,
        u.phone as teacher_phone,
        u.avatar_url as teacher_avatar,
        u.is_verified as teacher_verified,
        tp.title as teacher_title,
        tp.hourly_rate as teacher_rate,
        tp.rating_avg,
        (SELECT COUNT(*) FROM reviews r WHERE r.reviewer_id = tr.student_id AND r.teacher_id = tr.teacher_id) as review_given
      FROM teacher_requests tr
      JOIN users u ON tr.teacher_id = u.id
      JOIN teacher_profiles tp ON tr.teacher_id = tp.user_id
      WHERE tr.student_id = ?
      ORDER BY tr.created_at DESC
    `, [req.user.id]);
    const formatted = requests.map((r) => ({
      ...r,
      preferred_days: JSON.parse(r.preferred_days || "[]")
    }));
    res.json({ requests: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/requests/teacher", authenticateToken, requireRole("teacher"), async (req, res) => {
  try {
    const db = await getDb();
    const requests = queryAll(db, `
      SELECT 
        tr.*,
        u.full_name as student_name,
        u.email as student_email,
        u.phone as student_phone,
        u.avatar_url as student_avatar,
        u.location as student_city
      FROM teacher_requests tr
      JOIN users u ON tr.student_id = u.id
      WHERE tr.teacher_id = ?
      ORDER BY tr.created_at DESC
    `, [req.user.id]);
    const formatted = requests.map((r) => ({
      ...r,
      preferred_days: JSON.parse(r.preferred_days || "[]")
    }));
    res.json({ requests: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/requests/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, status_notes } = req.body;
    const validStatuses = ["pending", "accepted", "declined", "hired", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }
    const db = await getDb();
    const request = queryOne(db, "SELECT * FROM teacher_requests WHERE id = ?", [id]);
    if (!request) return res.status(404).json({ error: "Request not found" });
    const isTeacher = req.user.id === request.teacher_id;
    const isStudent = req.user.id === request.student_id;
    const isAdmin = req.user.role === "admin";
    if (!isTeacher && !isStudent && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized to modify this request" });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    execute(db, `
      UPDATE teacher_requests
      SET status = ?,
          status_notes = COALESCE(?, status_notes),
          updated_at = ?
      WHERE id = ?
    `, [status, status_notes, now, id]);
    const recipientId = isTeacher ? request.student_id : request.teacher_id;
    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, ?, 'Tuition Request Updated', ?, '/requests', 0, 'request', ?)
    `, [
      `notif_${Date.now()}`,
      recipientId,
      `Request for ${request.subject} has been marked as ${status.toUpperCase()}.`,
      now
    ]);
    res.json({ message: `Request status changed to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/reviews", authenticateToken, async (req, res) => {
  try {
    const { teacher_id, rating, comment, subject, interaction_type } = req.body;
    if (!teacher_id || !rating || !comment) {
      return res.status(400).json({ error: "Teacher ID, rating (1-5), and written comment are required." });
    }
    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: "Rating must be an integer between 1 and 5." });
    }
    const db = await getDb();
    const validRequest = queryOne(db, `
      SELECT id FROM teacher_requests 
      WHERE student_id = ? AND teacher_id = ? AND status IN ('accepted', 'hired', 'completed')
    `, [req.user.id, teacher_id]);
    const validJob = queryOne(db, `
      SELECT ja.id FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE j.institute_id = ? AND ja.teacher_id = ? AND ja.status = 'hired'
    `, [req.user.id, teacher_id]);
    if (!validRequest && !validJob && req.user.role !== "admin") {
      return res.status(403).json({ error: "Reviews are only permitted after a verified hiring or accepted teaching interaction." });
    }
    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    execute(db, `
      INSERT INTO reviews (id, reviewer_id, teacher_id, rating, comment, subject, interaction_type, is_moderated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [reviewId, req.user.id, teacher_id, numRating, comment.trim(), subject || "Tuition", interaction_type || "parent_request", now]);
    const stats = queryOne(db, `
      SELECT AVG(rating) as avg_rating, COUNT(*) as count 
      FROM reviews 
      WHERE teacher_id = ? AND is_moderated = 1
    `, [teacher_id]);
    if (stats) {
      execute(db, `
        UPDATE teacher_profiles
        SET rating_avg = ROUND(?, 2), review_count = ?
        WHERE user_id = ?
      `, [stats.avg_rating, stats.count, teacher_id]);
    }
    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, ?, 'New Review Received', ?, ?, 0, 'review', ?)
    `, [
      `notif_${Date.now()}`,
      teacher_id,
      `${req.user.full_name} gave you a ${numRating}\u2605 review!`,
      `/teachers/${teacher_id}`,
      now
    ]);
    res.status(201).json({ message: "Review submitted successfully!", review_id: reviewId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/saved", authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const saved = queryAll(db, `
      SELECT * FROM saved_items WHERE user_id = ? ORDER BY created_at DESC
    `, [req.user.id]);
    const teacherIds = saved.filter((s) => s.item_type === "teacher").map((s) => s.item_id);
    const jobIds = saved.filter((s) => s.item_type === "job").map((s) => s.item_id);
    let teachers = [];
    if (teacherIds.length > 0) {
      const placeholders = teacherIds.map(() => "?").join(",");
      teachers = queryAll(db, `
        SELECT u.id, u.full_name, u.avatar_url, u.location, u.is_verified, tp.title, tp.hourly_rate, tp.rating_avg, tp.subjects
        FROM users u
        JOIN teacher_profiles tp ON u.id = tp.user_id
        WHERE u.id IN (${placeholders})
      `, teacherIds).map((t) => ({ ...t, subjects: JSON.parse(t.subjects || "[]") }));
    }
    let jobs = [];
    if (jobIds.length > 0) {
      const placeholders = jobIds.map(() => "?").join(",");
      jobs = queryAll(db, `
        SELECT j.*, ip.institute_name, u.avatar_url as institute_logo
        FROM jobs j
        JOIN institute_profiles ip ON j.institute_id = ip.user_id
        JOIN users u ON j.institute_id = u.id
        WHERE j.id IN (${placeholders})
      `, jobIds);
    }
    res.json({ teachers, jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/saved", authenticateToken, async (req, res) => {
  try {
    const { item_type, item_id } = req.body;
    if (!item_type || !item_id) {
      return res.status(400).json({ error: "Item type and ID are required" });
    }
    const db = await getDb();
    const existing = queryOne(db, "SELECT id FROM saved_items WHERE user_id = ? AND item_type = ? AND item_id = ?", [req.user.id, item_type, item_id]);
    if (existing) {
      execute(db, "DELETE FROM saved_items WHERE id = ?", [existing.id]);
      return res.json({ saved: false, message: "Removed from saved items" });
    } else {
      const id = `save_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      execute(db, "INSERT INTO saved_items (id, user_id, item_type, item_id, created_at) VALUES (?, ?, ?, ?, ?)", [
        id,
        req.user.id,
        item_type,
        item_id,
        (/* @__PURE__ */ new Date()).toISOString()
      ]);
      return res.json({ saved: true, message: "Saved successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const notifs = queryAll(db, `
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `, [req.user.id]);
    const unreadCount = notifs.filter((n) => !n.is_read).length;
    res.json({ notifications: notifs, unread_count: unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    execute(db, "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/notifications/read-all", authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    execute(db, "UPDATE notifications SET is_read = 1 WHERE user_id = ?", [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/messages/:contextType/:contextId", authenticateToken, async (req, res) => {
  try {
    const { contextType, contextId } = req.params;
    const db = await getDb();
    const messages = queryAll(db, `
      SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.context_type = ? AND m.context_id = ?
      ORDER BY m.created_at ASC
    `, [contextType, contextId]);
    execute(db, `
      UPDATE messages 
      SET is_read = 1 
      WHERE context_type = ? AND context_id = ? AND receiver_id = ?
    `, [contextType, contextId, req.user.id]);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/messages", authenticateToken, async (req, res) => {
  try {
    const { context_type, context_id, receiver_id, content } = req.body;
    if (!context_type || !context_id || !receiver_id || !content) {
      return res.status(400).json({ error: "Context, receiver, and message content are required." });
    }
    const db = await getDb();
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    execute(db, `
      INSERT INTO messages (id, sender_id, receiver_id, context_type, context_id, content, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `, [msgId, req.user.id, receiver_id, context_type, context_id, content.trim(), now]);
    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, ?, 'New Message', ?, ?, 0, 'message', ?)
    `, [
      `notif_${Date.now()}`,
      receiver_id,
      `${req.user.full_name}: "${content.substring(0, 45)}${content.length > 45 ? "..." : ""}"`,
      context_type === "request" ? "/requests" : "/applications",
      now
    ]);
    res.status(201).json({ message: "Message sent", message_id: msgId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/reports", authenticateToken, async (req, res) => {
  try {
    const { reported_user_id, target_type, target_id, reason, details } = req.body;
    if (!target_type || !target_id || !reason) {
      return res.status(400).json({ error: "Target type, target ID, and reason are required." });
    }
    const db = await getDb();
    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    execute(db, `
      INSERT INTO reports (id, reporter_id, reported_user_id, target_type, target_id, reason, details, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [reportId, req.user.id, reported_user_id || null, target_type, target_id, reason, details || "", now]);
    res.status(201).json({ message: "Report submitted. Our safety team will review promptly." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/admin/stats", authenticateToken, requireRole("admin"), async (_req, res) => {
  try {
    const db = await getDb();
    const totalUsers = queryOne(db, "SELECT COUNT(*) as count FROM users")?.count || 0;
    const teachersCount = queryOne(db, 'SELECT COUNT(*) as count FROM users WHERE role = "teacher"')?.count || 0;
    const studentsCount = queryOne(db, 'SELECT COUNT(*) as count FROM users WHERE role = "student"')?.count || 0;
    const institutesCount = queryOne(db, 'SELECT COUNT(*) as count FROM users WHERE role = "institute"')?.count || 0;
    const openJobsCount = queryOne(db, 'SELECT COUNT(*) as count FROM jobs WHERE status = "open"')?.count || 0;
    const totalApplications = queryOne(db, "SELECT COUNT(*) as count FROM job_applications")?.count || 0;
    const totalRequests = queryOne(db, "SELECT COUNT(*) as count FROM teacher_requests")?.count || 0;
    const pendingVerifications = queryOne(db, 'SELECT COUNT(*) as count FROM teacher_profiles WHERE verification_status = "pending"')?.count || 0;
    const pendingReports = queryOne(db, 'SELECT COUNT(*) as count FROM reports WHERE status = "pending"')?.count || 0;
    const recentUsers = queryAll(db, "SELECT id, full_name, role, email, created_at FROM users ORDER BY created_at DESC LIMIT 5");
    const recentRequests = queryAll(db, `
      SELECT tr.*, u1.full_name as student_name, u2.full_name as teacher_name
      FROM teacher_requests tr
      JOIN users u1 ON tr.student_id = u1.id
      JOIN users u2 ON tr.teacher_id = u2.id
      ORDER BY tr.created_at DESC LIMIT 5
    `);
    res.json({
      metrics: {
        total_users: totalUsers,
        teachers: teachersCount,
        students: studentsCount,
        institutes: institutesCount,
        open_jobs: openJobsCount,
        total_applications: totalApplications,
        total_requests: totalRequests,
        pending_verifications: pendingVerifications,
        pending_reports: pendingReports
      },
      recent_users: recentUsers,
      recent_requests: recentRequests
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/admin/users", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { role, search } = req.query;
    const db = await getDb();
    let sql = "SELECT id, email, full_name, role, avatar_url, phone, location, is_verified, is_suspended, created_at FROM users WHERE 1=1";
    const params = [];
    if (role) {
      sql += " AND role = ?";
      params.push(role);
    }
    if (search) {
      sql += " AND (LOWER(full_name) LIKE ? OR LOWER(email) LIKE ?)";
      params.push(`%${String(search).toLowerCase()}%`, `%${String(search).toLowerCase()}%`);
    }
    sql += " ORDER BY created_at DESC";
    const users = queryAll(db, sql, params);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/admin/users/:id/suspension", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_suspended } = req.body;
    const db = await getDb();
    execute(db, "UPDATE users SET is_suspended = ? WHERE id = ?", [is_suspended ? 1 : 0, id]);
    res.json({ message: `User ${is_suspended ? "suspended" : "reactivated"} successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/admin/verifications", authenticateToken, requireRole("admin"), async (_req, res) => {
  try {
    const db = await getDb();
    const verifications = queryAll(db, `
      SELECT 
        tp.id as profile_id,
        tp.user_id,
        tp.verification_status,
        tp.verification_doc_name,
        tp.verification_notes,
        tp.qualification,
        tp.experience_years,
        tp.created_at,
        u.full_name,
        u.email,
        u.avatar_url,
        u.location,
        u.phone
      FROM teacher_profiles tp
      JOIN users u ON tp.user_id = u.id
      ORDER BY 
        CASE tp.verification_status
          WHEN 'pending' THEN 1
          WHEN 'unverified' THEN 2
          WHEN 'rejected' THEN 3
          WHEN 'verified' THEN 4
        END, tp.updated_at DESC
    `);
    res.json({ verifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/admin/verifications/:userId", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, notes } = req.body;
    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be verified or rejected" });
    }
    const db = await getDb();
    const isVerified = status === "verified" ? 1 : 0;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    execute(db, `
      UPDATE teacher_profiles
      SET verification_status = ?,
          verification_notes = COALESCE(?, verification_notes),
          updated_at = ?
      WHERE user_id = ?
    `, [status, notes, now, userId]);
    execute(db, "UPDATE users SET is_verified = ? WHERE id = ?", [isVerified, userId]);
    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, ?, 'Verification Status Update', ?, '/verification', 0, 'verification', ?)
    `, [
      `notif_${Date.now()}`,
      userId,
      status === "verified" ? "Congratulations! Your teacher credentials have been verified. Your verified badge is now active." : `Your verification submission was reviewed: ${notes || "Please resubmit with valid documents."}`,
      now
    ]);
    res.json({ message: `Verification status set to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/admin/moderation", authenticateToken, requireRole("admin"), async (_req, res) => {
  try {
    const db = await getDb();
    const reports = queryAll(db, `
      SELECT r.*, u.full_name as reporter_name, u.email as reporter_email
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      ORDER BY r.created_at DESC
    `);
    const reviews = queryAll(db, `
      SELECT rev.*, u1.full_name as reviewer_name, u2.full_name as teacher_name
      FROM reviews rev
      JOIN users u1 ON rev.reviewer_id = u1.id
      JOIN users u2 ON rev.teacher_id = u2.id
      ORDER BY rev.created_at DESC
    `);
    res.json({ reports, reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/admin/reports/:id", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action_taken } = req.body;
    const db = await getDb();
    execute(db, `
      UPDATE reports
      SET status = ?,
          action_taken = ?
      WHERE id = ?
    `, [status || "resolved", action_taken || "Reviewed and addressed", id]);
    res.json({ message: "Report updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/admin/reviews/:id", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_moderated } = req.body;
    const db = await getDb();
    execute(db, "UPDATE reviews SET is_moderated = ? WHERE id = ?", [is_moderated ? 1 : 0, id]);
    res.json({ message: `Review ${is_moderated ? "approved" : "hidden"}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// server/seedData.ts
async function seedInitialData(db) {
  const existing = queryOne(db, "SELECT id FROM users WHERE email = 'admin@tealign.com'");
  if (existing) {
    return;
  }
  console.log("Seeding initial production marketplace data...");
  const defaultPasswordHash = await hashPassword("Tealign2026!");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const users = [
    {
      id: "usr_admin",
      email: "admin@tealign.com",
      full_name: "Eleanor Vance",
      role: "admin",
      avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
      phone: "+1 555-0199",
      location: "Central Admin Office",
      is_verified: 1
    },
    {
      id: "usr_teacher_ananya",
      email: "teacher.ananya@tealign.com",
      full_name: "Dr. Ananya Sharma",
      role: "teacher",
      avatar_url: "/src/assets/images/teacher_portrait_female_1790609487993.jpg",
      phone: "+91 98110 23456",
      location: "South Extension, New Delhi",
      is_verified: 1
    },
    {
      id: "usr_teacher_rohit",
      email: "teacher.rohit@tealign.com",
      full_name: "Rohit Verma",
      role: "teacher",
      avatar_url: "/src/assets/images/teacher_portrait_male_1790609502955.jpg",
      phone: "+91 98220 34567",
      location: "Koramangala, Bengaluru",
      is_verified: 1
    },
    {
      id: "usr_teacher_sarah",
      email: "teacher.sarah@tealign.com",
      full_name: "Sarah Jenkins",
      role: "teacher",
      avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
      phone: "+1 555-0142",
      location: "Bandra West, Mumbai",
      is_verified: 1
    },
    {
      id: "usr_teacher_karthik",
      email: "teacher.karthik@tealign.com",
      full_name: "Karthik Subramanian",
      role: "teacher",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      phone: "+91 98330 45678",
      location: "Indiranagar, Bengaluru",
      is_verified: 0
      // Pending verification
    },
    {
      id: "usr_student_priya",
      email: "parent.priya@tealign.com",
      full_name: "Priya Menon",
      role: "student",
      avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
      phone: "+91 98440 56789",
      location: "Greater Kailash, New Delhi",
      is_verified: 1
    },
    {
      id: "usr_student_arjun",
      email: "student.arjun@tealign.com",
      full_name: "Arjun Patel",
      role: "student",
      avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
      phone: "+91 98550 67890",
      location: "HSR Layout, Bengaluru",
      is_verified: 1
    },
    {
      id: "usr_inst_apex",
      email: "school.apex@tealign.com",
      full_name: "Rajesh Khurana (Director)",
      role: "institute",
      avatar_url: "/src/assets/images/institute_campus_building_1790609515143.jpg",
      phone: "+91 11 2689 0011",
      location: "Vasant Kunj, New Delhi",
      is_verified: 1
    },
    {
      id: "usr_inst_zenith",
      email: "coaching.zenith@tealign.com",
      full_name: "Neha Kapoor (Academic Dean)",
      role: "institute",
      avatar_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=400&q=80",
      phone: "+91 80 4123 9988",
      location: "Koramangala 4th Block, Bengaluru",
      is_verified: 1
    }
  ];
  for (const u of users) {
    execute(db, `
      INSERT INTO users (id, email, password_hash, full_name, role, avatar_url, phone, location, is_verified, is_suspended, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `, [u.id, u.email, defaultPasswordHash, u.full_name, u.role, u.avatar_url, u.phone, u.location, u.is_verified, now, now]);
  }
  const teacherProfiles = [
    {
      id: "tp_ananya",
      user_id: "usr_teacher_ananya",
      title: "Senior Mathematics & Statistics Specialist (CBSE, ICSE & IB DP)",
      bio: "Ph.D. in Applied Mathematics with over 8 years of dedicated pedagogical experience. Specializing in making higher-order calculus, algebraic reasoning, and coordinate geometry intuitive and scoring for high school and competitive board students.",
      qualification: "Ph.D. Applied Mathematics, M.Sc. Delhi University, B.Ed",
      experience_years: 8,
      hourly_rate: 1200,
      monthly_rate: 18e3,
      service_radius_km: 12,
      teaching_modes: JSON.stringify(["home_student", "teacher_home", "coaching", "online"]),
      subjects: JSON.stringify(["Mathematics", "Applied Mathematics", "Statistics", "Quantitative Reasoning"]),
      classes: JSON.stringify(["Grade 9", "Grade 10", "Grade 11", "Grade 12", "IB Diploma"]),
      languages: JSON.stringify(["English", "Hindi"]),
      employment_types: JSON.stringify(["part_time", "freelance_hourly"]),
      verification_status: "verified",
      verification_doc_name: "degree_phd_mathematics_du.pdf",
      verification_notes: "All university credentials, identity proof, and criminal background checks verified by Tealign Admin.",
      rating_avg: 4.95,
      review_count: 18
    },
    {
      id: "tp_rohit",
      user_id: "usr_teacher_rohit",
      title: "Physics Master Educator (IIT-JEE Main/Adv, NEET & Olympiads)",
      bio: "M.Tech from IIT Bombay with 6+ years mentoring top rankers in mechanics, electrodynamics, optics, and thermodynamics. Focuses on conceptual clarity and problem-solving velocity.",
      qualification: "M.Tech IIT Bombay, B.Tech Electrical Engineering",
      experience_years: 6,
      hourly_rate: 1500,
      monthly_rate: 22e3,
      service_radius_km: 15,
      teaching_modes: JSON.stringify(["home_student", "teacher_home", "coaching", "school", "online"]),
      subjects: JSON.stringify(["Physics", "Applied Physics", "Science (Grade 9-10)"]),
      classes: JSON.stringify(["Grade 10", "Grade 11", "Grade 12", "JEE Prep", "NEET Prep"]),
      languages: JSON.stringify(["English", "Hindi", "Kannada"]),
      employment_types: JSON.stringify(["full_time", "part_time", "freelance_hourly"]),
      verification_status: "verified",
      verification_doc_name: "iit_bombay_mtech_certificate.pdf",
      verification_notes: "Verified IIT degree and teaching credentials.",
      rating_avg: 4.88,
      review_count: 24
    },
    {
      id: "tp_sarah",
      user_id: "usr_teacher_sarah",
      title: "Certified English Literature, Creative Writing & IELTS/TOEFL Coach",
      bio: "CELTA-certified educator with master\u2019s degree in English Literature. Specializes in advanced essay composition, analytical reading, speech fluency, and standardized English exams.",
      qualification: "M.A. English Literature, Cambridge CELTA Certified",
      experience_years: 5,
      hourly_rate: 950,
      monthly_rate: 14e3,
      service_radius_km: 8,
      teaching_modes: JSON.stringify(["home_student", "online", "school"]),
      subjects: JSON.stringify(["English Literature", "English Language", "IELTS / TOEFL", "Creative Writing"]),
      classes: JSON.stringify(["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]),
      languages: JSON.stringify(["English", "French (Beginner)"]),
      employment_types: JSON.stringify(["part_time", "freelance_hourly"]),
      verification_status: "verified",
      verification_doc_name: "cambridge_celta_award.pdf",
      verification_notes: "CELTA license number verified via Cambridge portal.",
      rating_avg: 4.92,
      review_count: 14
    },
    {
      id: "tp_karthik",
      user_id: "usr_teacher_karthik",
      title: "Computer Science, Python & Artificial Intelligence Tutor",
      bio: "B.Tech in Computer Science and former software engineer passionately teaching Python, Data Structures, Web Development, and CBSE CS curriculum to secondary students.",
      qualification: "B.Tech Computer Science & Engineering",
      experience_years: 4,
      hourly_rate: 850,
      monthly_rate: 12500,
      service_radius_km: 10,
      teaching_modes: JSON.stringify(["home_student", "online", "coaching"]),
      subjects: JSON.stringify(["Computer Science", "Python Programming", "Information Technology", "Data Structures"]),
      classes: JSON.stringify(["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "College Undergrad"]),
      languages: JSON.stringify(["English", "Tamil"]),
      employment_types: JSON.stringify(["part_time", "freelance_hourly"]),
      verification_status: "pending",
      verification_doc_name: "btech_transcripts_anna_univ.pdf",
      verification_notes: "Document submitted on March 26. Pending admin verification review.",
      rating_avg: 4.75,
      review_count: 6
    }
  ];
  for (const tp of teacherProfiles) {
    execute(db, `
      INSERT INTO teacher_profiles (
        id, user_id, title, bio, qualification, experience_years, hourly_rate, monthly_rate,
        service_radius_km, teaching_modes, subjects, classes, languages, employment_types,
        verification_status, verification_doc_name, verification_notes, rating_avg, review_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tp.id,
      tp.user_id,
      tp.title,
      tp.bio,
      tp.qualification,
      tp.experience_years,
      tp.hourly_rate,
      tp.monthly_rate,
      tp.service_radius_km,
      tp.teaching_modes,
      tp.subjects,
      tp.classes,
      tp.languages,
      tp.employment_types,
      tp.verification_status,
      tp.verification_doc_name,
      tp.verification_notes,
      tp.rating_avg,
      tp.review_count,
      now,
      now
    ]);
  }
  const availability = [
    // Dr. Ananya Sharma (usr_teacher_ananya)
    { id: "av_1", teacher_id: "usr_teacher_ananya", day: "monday", start: "06:30", end: "08:30" },
    { id: "av_2", teacher_id: "usr_teacher_ananya", day: "monday", start: "16:00", end: "20:30" },
    { id: "av_3", teacher_id: "usr_teacher_ananya", day: "tuesday", start: "16:00", end: "20:30" },
    { id: "av_4", teacher_id: "usr_teacher_ananya", day: "wednesday", start: "06:30", end: "08:30" },
    { id: "av_5", teacher_id: "usr_teacher_ananya", day: "wednesday", start: "16:00", end: "20:30" },
    { id: "av_6", teacher_id: "usr_teacher_ananya", day: "thursday", start: "16:00", end: "20:30" },
    { id: "av_7", teacher_id: "usr_teacher_ananya", day: "friday", start: "15:00", end: "19:30" },
    { id: "av_8", teacher_id: "usr_teacher_ananya", day: "saturday", start: "09:00", end: "14:00" },
    // Rohit Verma (usr_teacher_rohit)
    { id: "av_9", teacher_id: "usr_teacher_rohit", day: "monday", start: "17:00", end: "21:00" },
    { id: "av_10", teacher_id: "usr_teacher_rohit", day: "tuesday", start: "17:00", end: "21:00" },
    { id: "av_11", teacher_id: "usr_teacher_rohit", day: "thursday", start: "17:00", end: "21:00" },
    { id: "av_12", teacher_id: "usr_teacher_rohit", day: "friday", start: "17:00", end: "21:00" },
    { id: "av_13", teacher_id: "usr_teacher_rohit", day: "saturday", start: "09:00", end: "16:00" },
    { id: "av_14", teacher_id: "usr_teacher_rohit", day: "sunday", start: "10:00", end: "14:00" },
    // Sarah Jenkins (usr_teacher_sarah)
    { id: "av_15", teacher_id: "usr_teacher_sarah", day: "monday", start: "14:00", end: "19:00" },
    { id: "av_16", teacher_id: "usr_teacher_sarah", day: "tuesday", start: "14:00", end: "19:00" },
    { id: "av_17", teacher_id: "usr_teacher_sarah", day: "wednesday", start: "14:00", end: "19:00" },
    { id: "av_18", teacher_id: "usr_teacher_sarah", day: "thursday", start: "14:00", end: "19:00" },
    { id: "av_19", teacher_id: "usr_teacher_sarah", day: "saturday", start: "10:00", end: "13:00" },
    // Karthik Subramanian (usr_teacher_karthik)
    { id: "av_20", teacher_id: "usr_teacher_karthik", day: "monday", start: "18:00", end: "21:30" },
    { id: "av_21", teacher_id: "usr_teacher_karthik", day: "wednesday", start: "18:00", end: "21:30" },
    { id: "av_22", teacher_id: "usr_teacher_karthik", day: "saturday", start: "11:00", end: "18:00" },
    { id: "av_23", teacher_id: "usr_teacher_karthik", day: "sunday", start: "11:00", end: "18:00" }
  ];
  for (const slot of availability) {
    execute(db, `
      INSERT INTO availability_slots (id, teacher_id, day_of_week, start_time, end_time, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [slot.id, slot.teacher_id, slot.day, slot.start, slot.end]);
  }
  execute(db, `
    INSERT INTO institute_profiles (id, user_id, institute_name, institute_type, website, address, city, description, established_year, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    "ip_apex",
    "usr_inst_apex",
    "Apex Senior Secondary & Cambridge International School",
    "school",
    "https://apexschool.edu.example",
    "Plot 14, Sector C, Vasant Kunj",
    "New Delhi",
    "Leading K-12 educational institution committed to scholastic rigor, critical thinking, STEM innovation, and global citizenship.",
    2004,
    now,
    now
  ]);
  execute(db, `
    INSERT INTO institute_profiles (id, user_id, institute_name, institute_type, website, address, city, description, established_year, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    "ip_zenith",
    "usr_inst_zenith",
    "Zenith IIT & Medical Olympiad Academy",
    "coaching",
    "https://zenithacademy.edu.example",
    "84 Koramangala 4th Block, 80 Feet Road",
    "Bengaluru",
    "Premier entrance coaching institute known for consistent Top-100 AIRs in JEE Advanced and NEET-UG with dedicated mentor-led small cohorts.",
    2012,
    now,
    now
  ]);
  const jobs = [
    {
      id: "job_math_apex",
      institute_id: "usr_inst_apex",
      title: "Senior Secondary Mathematics Teacher (Grades 11 & 12 CBSE)",
      subject: "Mathematics",
      class_grade: "Grade 11-12",
      qualification_req: "M.Sc. Mathematics, B.Ed mandatory with prior CBSE experience",
      experience_req: 4,
      location: "Vasant Kunj, New Delhi (On-campus)",
      employment_type: "full-time",
      salary_min: 65e3,
      salary_max: 85e3,
      salary_type: "monthly",
      required_schedule: JSON.stringify([
        { day: "Monday - Friday", time: "08:00 - 14:30" },
        { day: "Alternate Saturdays", time: "08:30 - 12:30" }
      ]),
      description: "We are seeking an energetic educator to instruct Grade 11 and 12 mathematics cohorts. Responsibilities include syllabus delivery, diagnostic weekly testing, board preparation modules, and organizing inter-school math olympiads.",
      status: "open"
    },
    {
      id: "job_physics_zenith",
      institute_id: "usr_inst_zenith",
      title: "Master Faculty - Advanced Physics (JEE Advanced Cohort)",
      subject: "Physics",
      class_grade: "JEE Advanced / Olympiad",
      qualification_req: "B.Tech/M.Tech from IIT/NIT or M.Sc Physics with top rank track record",
      experience_req: 5,
      location: "Koramangala, Bengaluru (Hybrid / Classroom)",
      employment_type: "full-time",
      salary_min: 12e4,
      salary_max: 18e4,
      salary_type: "monthly",
      required_schedule: JSON.stringify([
        { day: "Monday, Wednesday, Friday", time: "16:30 - 20:30" },
        { day: "Saturday & Sunday", time: "10:00 - 15:00" }
      ]),
      description: "Lead high-achieving student batches targeting Top 500 in JEE Advanced. You will curate challenging problem sets, conduct doubt-clearing workshops, and mentor students in analytical mechanics and electromagnetism.",
      status: "open"
    },
    {
      id: "job_cs_zenith",
      institute_id: "usr_inst_zenith",
      title: "Coding & Algorithmic Problem Solving Instructor (High School)",
      subject: "Computer Science",
      class_grade: "Grade 9-12",
      qualification_req: "Degree in Computer Science or Software Engineering",
      experience_req: 2,
      location: "Koramangala, Bengaluru",
      employment_type: "part-time",
      salary_min: 4e4,
      salary_max: 55e3,
      salary_type: "monthly",
      required_schedule: JSON.stringify([
        { day: "Tuesday & Thursday", time: "17:00 - 19:30" },
        { day: "Saturday", time: "14:00 - 17:00" }
      ]),
      description: "Train budding programmers in Python, logic building, algorithmic complexity, and preparation for ZIO (Zonal Informatics Olympiad).",
      status: "open"
    }
  ];
  for (const j of jobs) {
    execute(db, `
      INSERT INTO jobs (
        id, institute_id, title, subject, class_grade, qualification_req, experience_req,
        location, employment_type, salary_min, salary_max, salary_type, required_schedule,
        description, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      j.id,
      j.institute_id,
      j.title,
      j.subject,
      j.class_grade,
      j.qualification_req,
      j.experience_req,
      j.location,
      j.employment_type,
      j.salary_min,
      j.salary_max,
      j.salary_type,
      j.required_schedule,
      j.description,
      j.status,
      now,
      now
    ]);
  }
  execute(db, `
    INSERT INTO job_applications (id, job_id, teacher_id, cover_letter, expected_salary, status, interview_date, interview_notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    "app_rohit_zenith",
    "job_physics_zenith",
    "usr_teacher_rohit",
    "I have 6 years of experience mentoring IIT-JEE candidates with 14 students qualifying in the top 500 rank bracket. My pedagogical approach focuses on breaking down multi-concept physics problems into first principles.",
    16e4,
    "interview",
    "2026-10-04T15:00:00Z",
    "Round 1 technical screening cleared. Scheduled for demo lecture on Rotational Dynamics on Saturday.",
    now,
    now
  ]);
  execute(db, `
    INSERT INTO job_applications (id, job_id, teacher_id, cover_letter, expected_salary, status, interview_date, interview_notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    "app_ananya_apex",
    "job_math_apex",
    "usr_teacher_ananya",
    "As a Ph.D. holder with 8 years of school board teaching experience, I have developed structured revision modules that have helped over 90% of my students score above 90% in CBSE Board exams.",
    8e4,
    "shortlisted",
    null,
    "Profile and credentials reviewed. Shortlisted for panel review.",
    now,
    now
  ]);
  execute(db, `
    INSERT INTO teacher_requests (
      id, student_id, teacher_id, subject, class_grade, teaching_mode, preferred_days,
      preferred_time_slot, student_location, hourly_budget, message, status, status_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    "req_priya_ananya",
    "usr_student_priya",
    "usr_teacher_ananya",
    "Mathematics",
    "Grade 10",
    "home_student",
    JSON.stringify(["monday", "wednesday", "friday"]),
    "17:00 - 18:30",
    "Greater Kailash, New Delhi",
    1200,
    "Hello Dr. Ananya, my daughter is in 10th grade CBSE and needs focused guidance in Quadratic Equations, Trigonometry, and Surface Areas. We live within 4 km of South Extension.",
    "accepted",
    "Teacher accepted the request. First trial session scheduled for Wednesday 5 PM.",
    now,
    now
  ]);
  execute(db, `
    INSERT INTO teacher_requests (
      id, student_id, teacher_id, subject, class_grade, teaching_mode, preferred_days,
      preferred_time_slot, student_location, hourly_budget, message, status, status_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    "req_arjun_rohit",
    "usr_student_arjun",
    "usr_teacher_rohit",
    "Physics",
    "Grade 12",
    "online",
    JSON.stringify(["tuesday", "thursday", "saturday"]),
    "18:00 - 19:30",
    "HSR Layout, Bengaluru",
    1500,
    "Hi Sir, I am preparing for JEE Advanced 2027 and need intensive 1-on-1 problem solving sessions for Modern Physics and Electrodynamics.",
    "hired",
    "Regular weekly tuition active. 12 classes completed successfully.",
    now,
    now
  ]);
  execute(db, `
    INSERT INTO reviews (id, reviewer_id, teacher_id, rating, comment, subject, interaction_type, is_moderated, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `, [
    "rev_1",
    "usr_student_priya",
    "usr_teacher_ananya",
    5,
    "Dr. Ananya is phenomenal! Her patience and methodical approach made math my daughter\u2019s favorite subject. Her scores went from 68% to 92% in the pre-boards.",
    "Grade 10 Mathematics",
    "parent_request",
    now
  ]);
  execute(db, `
    INSERT INTO reviews (id, reviewer_id, teacher_id, rating, comment, subject, interaction_type, is_moderated, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `, [
    "rev_2",
    "usr_student_arjun",
    "usr_teacher_rohit",
    5,
    "Rohit sir makes the toughest JEE questions feel approachable. His visual diagrams and problem breakdowns are world-class.",
    "Physics (JEE Advanced)",
    "parent_request",
    now
  ]);
  execute(db, `
    INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
    VALUES (?, ?, ?, ?, ?, 0, 'request', ?)
  `, [
    "notif_1",
    "usr_teacher_ananya",
    "New Parent Request Accepted",
    "Priya Menon confirmed your upcoming tuition session for Grade 10 Mathematics.",
    "/requests",
    now
  ]);
  execute(db, `
    INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
    VALUES (?, ?, ?, ?, ?, 0, 'application', ?)
  `, [
    "notif_2",
    "usr_teacher_rohit",
    "Interview Scheduled at Zenith Academy",
    "Zenith IIT Academy scheduled your demo lecture interview for Saturday.",
    "/applications",
    now
  ]);
  execute(db, `
    INSERT INTO messages (id, sender_id, receiver_id, context_type, context_id, content, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `, [
    "msg_1",
    "usr_student_priya",
    "usr_teacher_ananya",
    "request",
    "req_priya_ananya",
    "Hello Dr. Ananya, thank you so much for accepting! Can we begin this Wednesday at 5:00 PM?",
    now
  ]);
  execute(db, `
    INSERT INTO messages (id, sender_id, receiver_id, context_type, context_id, content, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `, [
    "msg_2",
    "usr_teacher_ananya",
    "usr_student_priya",
    "request",
    "req_priya_ananya",
    "Hello Priya! Yes, Wednesday at 5:00 PM works perfectly. I will bring initial diagnostic assessment sheets.",
    now
  ]);
  execute(db, `
    INSERT INTO reports (id, reporter_id, reported_user_id, target_type, target_id, reason, details, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `, [
    "rep_1",
    "usr_inst_apex",
    "usr_teacher_karthik",
    "user",
    "usr_teacher_karthik",
    "Profile Credentials Incomplete",
    "User listed full-time coaching availability during school morning hours while also marked as college faculty.",
    now
  ]);
  persistDb();
  console.log("Seeding completed successfully!");
}

// server/index.ts
async function createExpressApp() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  try {
    const db = await getDb();
    await seedInitialData(db);
    console.log("Tealign database initialized and seeded successfully.");
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
  app.use("/api", apiRouter);
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString(), platform: "Tealign" });
  });
  return app;
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
async function startServer() {
  const app = await createExpressApp();
  const PORT = Number(process.env.PORT) || 3e3;
  const distPath = path2.resolve(__dirname, "dist");
  app.use(express2.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path2.join(distPath, "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tealign production server running on port ${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Fatal server boot error:", err);
  process.exit(1);
});
