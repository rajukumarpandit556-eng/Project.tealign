import { Router, Response } from 'express';
import { getDb, queryAll, queryOne, execute } from './db.js';
import {
  AuthRequest,
  authenticateToken,
  optionalAuth,
  requireRole,
  hashPassword,
  comparePassword,
  generateToken,
} from './auth.js';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & PROFILES
// ==========================================

// Register
apiRouter.post('/auth/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, full_name, role, phone, location } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Email, password, full name, and role are required.' });
    }

    if (!['teacher', 'student', 'institute'].includes(role)) {
      return res.status(400).json({ error: 'Role must be teacher, student, or institute.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

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
      location || 'Online',
      now,
      now
    ]);

    // Bootstrap profile based on role
    if (role === 'teacher') {
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
        'Educator & Subject Specialist',
        'Experienced educator passionate about student-centric learning.',
        'Bachelor Degree',
        JSON.stringify(['online', 'home_student']),
        JSON.stringify(['General Science', 'Mathematics']),
        JSON.stringify(['Grade 8', 'Grade 9', 'Grade 10']),
        JSON.stringify(['English']),
        JSON.stringify(['part_time', 'freelance_hourly']),
        now,
        now
      ]);

      // Seed initial availability (e.g. Mon-Fri 16:00 - 19:00)
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      for (const d of days) {
        execute(db, `
          INSERT INTO availability_slots (id, teacher_id, day_of_week, start_time, end_time, is_active)
          VALUES (?, ?, ?, '16:00', '19:00', 1)
        `, [`av_${userId}_${d}`, userId, d]);
      }
    } else if (role === 'institute') {
      execute(db, `
        INSERT INTO institute_profiles (
          id, user_id, institute_name, institute_type, address, city, description, established_year, created_at, updated_at
        ) VALUES (?, ?, ?, 'school', ?, ?, ?, 2020, ?, ?)
      `, [
        `ip_${userId}`,
        userId,
        full_name,
        location || 'City Campus',
        location || 'Main Center',
        'Academic institution dedicated to excellence in education.',
        now,
        now
      ]);
    }

    const token = generateToken({
      id: userId,
      email: email.toLowerCase().trim(),
      role,
      full_name: full_name.trim(),
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
        is_verified: 0,
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Internal server error during registration.' });
  }
});

// Login
apiRouter.post('/auth/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const db = await getDb();
    const user = queryOne(db, 'SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.is_suspended) {
      return res.status(403).json({ error: 'This account has been suspended by administration.' });
    }

    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
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
        is_verified: user.is_verified,
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal login error' });
  }
});

// Demo Login (Instant switch between Teacher, Student, School, and Admin)
apiRouter.post('/auth/demo-login', async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    const db = await getDb();
    let email = 'admin@tealign.com';
    if (role === 'teacher') email = 'teacher.ananya@tealign.com';
    else if (role === 'student') email = 'parent.priya@tealign.com';
    else if (role === 'institute') email = 'school.apex@tealign.com';

    const user = queryOne(db, 'SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ error: `Demo user for role ${role} not found.` });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
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
        is_verified: user.is_verified,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Demo switch failed' });
  }
});

// Get current session user
apiRouter.get('/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = queryOne(db, 'SELECT id, email, role, full_name, avatar_url, phone, location, is_verified, is_suspended, created_at FROM users WHERE id = ?', [req.user!.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let profileData = null;
    if (user.role === 'teacher') {
      profileData = queryOne(db, 'SELECT * FROM teacher_profiles WHERE user_id = ?', [user.id]);
      if (profileData) {
        profileData.teaching_modes = JSON.parse(profileData.teaching_modes || '[]');
        profileData.subjects = JSON.parse(profileData.subjects || '[]');
        profileData.classes = JSON.parse(profileData.classes || '[]');
        profileData.languages = JSON.parse(profileData.languages || '[]');
        profileData.employment_types = JSON.parse(profileData.employment_types || '[]');
      }
    } else if (user.role === 'institute') {
      profileData = queryOne(db, 'SELECT * FROM institute_profiles WHERE user_id = ?', [user.id]);
    }

    res.json({ user, profile: profileData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile basic info
apiRouter.put('/auth/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, phone, location, avatar_url } = req.body;
    const db = await getDb();
    const now = new Date().toISOString();

    execute(db, `
      UPDATE users
      SET full_name = COALESCE(?, full_name),
          phone = COALESCE(?, phone),
          location = COALESCE(?, location),
          avatar_url = COALESCE(?, avatar_url),
          updated_at = ?
      WHERE id = ?
    `, [full_name, phone, location, avatar_url, now, req.user!.id]);

    const updatedUser = queryOne(db, 'SELECT id, email, role, full_name, avatar_url, phone, location, is_verified FROM users WHERE id = ?', [req.user!.id]);
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. TEACHERS & MATCHING ENGINE
// ==========================================

// Search teachers with multi-parameter filtering & availability overlap matching
apiRouter.get('/teachers', optionalAuth, async (req: AuthRequest, res: Response) => {
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
      time_slot, // e.g. "17:00" or "16:00-19:00"
      sort_by, // 'rating', 'experience', 'fee_asc', 'fee_desc'
    } = req.query;

    const db = await getDb();

    // Query teacher profiles joined with users
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
    const params: any[] = [];

    if (verified_only === 'true') {
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

    // Parse JSON columns
    let teachers = rows.map((r) => ({
      ...r,
      teaching_modes: JSON.parse(r.teaching_modes || '[]'),
      subjects: JSON.parse(r.subjects || '[]'),
      classes: JSON.parse(r.classes || '[]'),
      languages: JSON.parse(r.languages || '[]'),
      employment_types: JSON.parse(r.employment_types || '[]'),
    }));

    // In-memory relational filtering for JSON arrays and text match
    if (q) {
      const searchTerm = String(q).toLowerCase();
      teachers = teachers.filter((t) =>
        t.full_name.toLowerCase().includes(searchTerm) ||
        t.title.toLowerCase().includes(searchTerm) ||
        t.qualification.toLowerCase().includes(searchTerm) ||
        t.subjects.some((s: string) => s.toLowerCase().includes(searchTerm))
      );
    }

    if (subject) {
      const subjTerm = String(subject).toLowerCase();
      teachers = teachers.filter((t) =>
        t.subjects.some((s: string) => s.toLowerCase().includes(subjTerm))
      );
    }

    if (class_grade) {
      const gradeTerm = String(class_grade).toLowerCase();
      teachers = teachers.filter((t) =>
        t.classes.some((c: string) => c.toLowerCase().includes(gradeTerm))
      );
    }

    if (location) {
      const locTerm = String(location).toLowerCase();
      teachers = teachers.filter((t) =>
        (t.location || '').toLowerCase().includes(locTerm)
      );
    }

    if (mode) {
      teachers = teachers.filter((t) =>
        t.teaching_modes.includes(mode)
      );
    }

    // Availability Matching Engine
    if (day_of_week) {
      const day = String(day_of_week).toLowerCase();
      // Fetch availability slots for this day
      const slots = queryAll(db, `
        SELECT teacher_id, start_time, end_time 
        FROM availability_slots 
        WHERE day_of_week = ? AND is_active = 1
      `, [day]);

      const teacherAvailableIds = new Set<string>();

      for (const slot of slots) {
        if (!time_slot) {
          // Any slot on that day counts
          teacherAvailableIds.add(slot.teacher_id);
        } else {
          // Check slot overlap
          const [reqStart, reqEnd] = String(time_slot).includes('-')
            ? String(time_slot).split('-')
            : [String(time_slot), String(time_slot)];

          if (slot.start_time <= reqStart && slot.end_time >= reqEnd) {
            teacherAvailableIds.add(slot.teacher_id);
          }
        }
      }

      teachers = teachers.filter((t) => teacherAvailableIds.has(t.user_id));
    }

    // Sorting
    if (sort_by === 'experience') {
      teachers.sort((a, b) => b.experience_years - a.experience_years);
    } else if (sort_by === 'fee_asc') {
      teachers.sort((a, b) => a.hourly_rate - b.hourly_rate);
    } else if (sort_by === 'fee_desc') {
      teachers.sort((a, b) => b.hourly_rate - a.hourly_rate);
    } else {
      // Default: rating descending
      teachers.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
    }

    res.json({ teachers, total: teachers.length });
  } catch (err: any) {
    console.error('Teachers query error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single teacher details with full profile, availability schedule, reviews, and stats
apiRouter.get('/teachers/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const user = queryOne(db, `
      SELECT id, full_name, email, avatar_url, phone, location, is_verified, created_at 
      FROM users 
      WHERE id = ? AND role = 'teacher'
    `, [id]);

    if (!user) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const profile = queryOne(db, 'SELECT * FROM teacher_profiles WHERE user_id = ?', [id]);
    if (!profile) {
      return res.status(404).json({ error: 'Teacher profile not set up yet' });
    }

    profile.teaching_modes = JSON.parse(profile.teaching_modes || '[]');
    profile.subjects = JSON.parse(profile.subjects || '[]');
    profile.classes = JSON.parse(profile.classes || '[]');
    profile.languages = JSON.parse(profile.languages || '[]');
    profile.employment_types = JSON.parse(profile.employment_types || '[]');

    // Availability slots grouped by day
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

    // Reviews
    const reviews = queryAll(db, `
      SELECT r.*, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.teacher_id = ? AND r.is_moderated = 1
      ORDER BY r.created_at DESC
    `, [id]);

    // Check if current user saved this teacher
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
        is_saved: isSaved,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update teacher profile
apiRouter.put('/teachers/profile', authenticateToken, requireRole('teacher'), async (req: AuthRequest, res: Response) => {
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
      employment_types,
    } = req.body;

    const db = await getDb();
    const now = new Date().toISOString();

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
      experience_years !== undefined ? Number(experience_years) : null,
      hourly_rate !== undefined ? Number(hourly_rate) : null,
      monthly_rate !== undefined ? Number(monthly_rate) : null,
      service_radius_km !== undefined ? Number(service_radius_km) : null,
      teaching_modes ? JSON.stringify(teaching_modes) : null,
      subjects ? JSON.stringify(subjects) : null,
      classes ? JSON.stringify(classes) : null,
      languages ? JSON.stringify(languages) : null,
      employment_types ? JSON.stringify(employment_types) : null,
      now,
      req.user!.id
    ]);

    res.json({ message: 'Teacher profile updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get own availability
apiRouter.get('/teachers/me/availability', authenticateToken, requireRole('teacher'), async (req: AuthRequest, res: Response) => {
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
    `, [req.user!.id]);

    res.json({ slots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save weekly availability schedule (replace with full structured schedule)
apiRouter.put('/teachers/me/availability', authenticateToken, requireRole('teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const { slots } = req.body; // array of { day_of_week, start_time, end_time, is_active }
    if (!Array.isArray(slots)) {
      return res.status(400).json({ error: 'Slots must be an array of schedule objects.' });
    }

    const db = await getDb();

    // Remove existing slots for this teacher
    execute(db, 'DELETE FROM availability_slots WHERE teacher_id = ?', [req.user!.id]);

    // Insert new structured slots
    for (const s of slots) {
      if (!s.day_of_week || !s.start_time || !s.end_time) continue;
      const slotId = `av_${req.user!.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      execute(db, `
        INSERT INTO availability_slots (id, teacher_id, day_of_week, start_time, end_time, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [slotId, req.user!.id, s.day_of_week.toLowerCase(), s.start_time, s.end_time, s.is_active !== undefined ? (s.is_active ? 1 : 0) : 1]);
    }

    res.json({ message: 'Weekly availability updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher Verification Submission
apiRouter.post('/teachers/me/verification', authenticateToken, requireRole('teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const { document_name, notes } = req.body;
    if (!document_name) {
      return res.status(400).json({ error: 'Document name or proof is required.' });
    }

    const db = await getDb();
    const now = new Date().toISOString();

    execute(db, `
      UPDATE teacher_profiles
      SET verification_status = 'pending',
          verification_doc_name = ?,
          verification_notes = ?,
          updated_at = ?
      WHERE user_id = ?
    `, [document_name, notes || 'Submitted for verification', now, req.user!.id]);

    // Create notification for admin
    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, 'usr_admin', 'New Teacher Verification Request', ?, '/admin', 0, 'verification', ?)
    `, [`notif_${Date.now()}`, `${req.user!.full_name} submitted credentials for verification.`, now]);

    res.json({ message: 'Verification documents submitted. Our team will review within 24-48 hours.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. JOBS & RECRUITMENT WORKFLOW (INSTITUTES & TEACHERS)
// ==========================================

// Browse jobs (public)
apiRouter.get('/jobs', optionalAuth, async (req: AuthRequest, res: Response) => {
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
    const params: any[] = [];

    // Filter by open status by default unless admin or specified
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

    // Parse JSON schedule
    jobs = jobs.map((job) => ({
      ...job,
      required_schedule: JSON.parse(job.required_schedule || '[]'),
    }));

    if (q) {
      const term = String(q).toLowerCase();
      jobs = jobs.filter((j) =>
        j.title.toLowerCase().includes(term) ||
        j.description.toLowerCase().includes(term) ||
        j.institute_name.toLowerCase().includes(term) ||
        j.subject.toLowerCase().includes(term)
      );
    }

    // Check if user has applied or saved
    if (req.user) {
      const userApplications = queryAll(db, 'SELECT job_id, status FROM job_applications WHERE teacher_id = ?', [req.user.id]);
      const appMap = new Map(userApplications.map((a) => [a.job_id, a.status]));
      const savedItems = new Set(queryAll(db, 'SELECT item_id FROM saved_items WHERE user_id = ? AND item_type = "job"', [req.user.id]).map((s) => s.item_id));

      jobs = jobs.map((j) => ({
        ...j,
        user_applied: appMap.has(j.id),
        user_application_status: appMap.get(j.id) || null,
        is_saved: savedItems.has(j.id),
      }));
    }

    res.json({ jobs, total: jobs.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single job details
apiRouter.get('/jobs/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
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
      return res.status(404).json({ error: 'Job opening not found' });
    }

    job.required_schedule = JSON.parse(job.required_schedule || '[]');

    let userApplication = null;
    let isSaved = false;

    if (req.user) {
      userApplication = queryOne(db, 'SELECT * FROM job_applications WHERE job_id = ? AND teacher_id = ?', [id, req.user.id]);
      const saved = queryOne(db, 'SELECT id FROM saved_items WHERE user_id = ? AND item_type = "job" AND item_id = ?', [req.user.id, id]);
      isSaved = !!saved;
    }

    res.json({ job, user_application: userApplication, is_saved: isSaved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Post a new job (Institute)
apiRouter.post('/jobs', authenticateToken, requireRole('institute'), async (req: AuthRequest, res: Response) => {
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
      description,
    } = req.body;

    if (!title || !subject || !class_grade || !salary_min || !description) {
      return res.status(400).json({ error: 'Title, subject, class grade, salary, and description are required.' });
    }

    const db = await getDb();
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    execute(db, `
      INSERT INTO jobs (
        id, institute_id, title, subject, class_grade, qualification_req, experience_req,
        location, employment_type, salary_min, salary_max, salary_type, required_schedule,
        description, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
    `, [
      jobId,
      req.user!.id,
      title.trim(),
      subject.trim(),
      class_grade.trim(),
      qualification_req || 'Bachelor or Master in relevant subject',
      Number(experience_req) || 0,
      location || 'On-site campus',
      employment_type || 'full-time',
      Number(salary_min),
      Number(salary_max || salary_min),
      salary_type || 'monthly',
      JSON.stringify(required_schedule || []),
      description.trim(),
      now,
      now
    ]);

    res.status(201).json({ message: 'Teaching job posted successfully', job_id: jobId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update or close job (Institute)
apiRouter.put('/jobs/:id', authenticateToken, requireRole('institute', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, title, description, salary_min, salary_max } = req.body;

    const db = await getDb();
    const job = queryOne(db, 'SELECT institute_id FROM jobs WHERE id = ?', [id]);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (req.user!.role !== 'admin' && job.institute_id !== req.user!.id) {
      return res.status(403).json({ error: 'You are not authorized to update this job.' });
    }

    const now = new Date().toISOString();
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

    res.json({ message: 'Job updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Institute's own posted jobs
apiRouter.get('/institutes/me/jobs', authenticateToken, requireRole('institute'), async (req: AuthRequest, res: Response) => {
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
    `, [req.user!.id]);

    const formatted = jobs.map((j) => ({
      ...j,
      required_schedule: JSON.parse(j.required_schedule || '[]'),
    }));

    res.json({ jobs: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Institute views applications for a job
apiRouter.get('/jobs/:id/applications', authenticateToken, requireRole('institute', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const job = queryOne(db, 'SELECT institute_id, title FROM jobs WHERE id = ?', [id]);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (req.user!.role !== 'admin' && job.institute_id !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to view applications for this job' });
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
      subjects: JSON.parse(a.subjects || '[]'),
      teaching_modes: JSON.parse(a.teaching_modes || '[]'),
    }));

    res.json({ applications: formatted, job_title: job.title });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher applies for a job
apiRouter.post('/jobs/:id/apply', authenticateToken, requireRole('teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { cover_letter, expected_salary } = req.body;
    const db = await getDb();

    const job = queryOne(db, 'SELECT id, institute_id, title, status FROM jobs WHERE id = ?', [id]);
    if (!job) return res.status(404).json({ error: 'Job opening not found' });

    if (job.status === 'closed') {
      return res.status(400).json({ error: 'This job posting is now closed.' });
    }

    const existing = queryOne(db, 'SELECT id FROM job_applications WHERE job_id = ? AND teacher_id = ?', [id, req.user!.id]);
    if (existing) {
      return res.status(409).json({ error: 'You have already submitted an application for this position.' });
    }

    const appId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    execute(db, `
      INSERT INTO job_applications (id, job_id, teacher_id, cover_letter, expected_salary, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'applied', ?, ?)
    `, [appId, id, req.user!.id, cover_letter || '', Number(expected_salary) || 0, now, now]);

    // Send notification to institute
    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, ?, 'New Job Application Received', ?, ?, 0, 'application', ?)
    `, [
      `notif_${Date.now()}`,
      job.institute_id,
      `${req.user!.full_name} applied for "${job.title}".`,
      `/institute/jobs/${id}`,
      now
    ]);

    res.status(201).json({ message: 'Application submitted successfully!', application_id: appId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher views their own applications
apiRouter.get('/teachers/me/applications', authenticateToken, requireRole('teacher'), async (req: AuthRequest, res: Response) => {
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
    `, [req.user!.id]);

    res.json({ applications: apps });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Institute updates application status (Shortlist, Interview, Hire, Reject)
apiRouter.put('/applications/:id/status', authenticateToken, requireRole('institute', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, interview_date, interview_notes } = req.body;

    const validStatuses = ['applied', 'shortlisted', 'interview', 'hired', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
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
      return res.status(404).json({ error: 'Application not found' });
    }

    if (req.user!.role !== 'admin' && application.institute_id !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this application.' });
    }

    const now = new Date().toISOString();
    execute(db, `
      UPDATE job_applications
      SET status = ?,
          interview_date = COALESCE(?, interview_date),
          interview_notes = COALESCE(?, interview_notes),
          updated_at = ?
      WHERE id = ?
    `, [status, interview_date, interview_notes, now, id]);

    // Send notification to teacher
    let messageText = `Your application for "${application.job_title}" status updated to: ${status.toUpperCase()}.`;
    if (status === 'interview') {
      messageText = `Interview scheduled for "${application.job_title}"! Check your applications tab for timing and notes.`;
    } else if (status === 'hired') {
      messageText = `Congratulations! You have been marked HIRED for "${application.job_title}".`;
    }

    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, ?, 'Job Application Update', ?, '/applications', 0, 'application', ?)
    `, [`notif_${Date.now()}`, application.teacher_id, messageText, now]);

    res.json({ message: `Application status updated to ${status}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. TEACHER REQUESTS (STUDENT/PARENT <-> TEACHER)
// ==========================================

// Parent/Student sends a teaching request
apiRouter.post('/requests', authenticateToken, requireRole('student'), async (req: AuthRequest, res: Response) => {
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
      message,
    } = req.body;

    if (!teacher_id || !subject || !class_grade || !message) {
      return res.status(400).json({ error: 'Teacher ID, subject, class grade, and message are required.' });
    }

    const db = await getDb();
    const teacher = queryOne(db, 'SELECT id, full_name FROM users WHERE id = ? AND role = "teacher"', [teacher_id]);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    execute(db, `
      INSERT INTO teacher_requests (
        id, student_id, teacher_id, subject, class_grade, teaching_mode,
        preferred_days, preferred_time_slot, student_location, hourly_budget,
        message, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `, [
      reqId,
      req.user!.id,
      teacher_id,
      subject,
      class_grade,
      teaching_mode || 'online',
      JSON.stringify(preferred_days || ['monday', 'wednesday']),
      preferred_time_slot || 'Flexible',
      student_location || 'Online',
      Number(hourly_budget) || 1000,
      message.trim(),
      now,
      now
    ]);

    // Notify teacher
    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, ?, 'New Tuition Request', ?, '/requests', 0, 'request', ?)
    `, [
      `notif_${Date.now()}`,
      teacher_id,
      `${req.user!.full_name} sent you a request for ${subject} (${class_grade}).`,
      now
    ]);

    // Initial message in conversation
    execute(db, `
      INSERT INTO messages (id, sender_id, receiver_id, context_type, context_id, content, is_read, created_at)
      VALUES (?, ?, ?, 'request', ?, ?, 0, ?)
    `, [`msg_${Date.now()}`, req.user!.id, teacher_id, reqId, message.trim(), now]);

    res.status(201).json({ message: 'Request sent successfully!', request_id: reqId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Student's sent requests
apiRouter.get('/requests/student', authenticateToken, requireRole('student'), async (req: AuthRequest, res: Response) => {
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
    `, [req.user!.id]);

    const formatted = requests.map((r) => ({
      ...r,
      preferred_days: JSON.parse(r.preferred_days || '[]'),
    }));

    res.json({ requests: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher's received requests
apiRouter.get('/requests/teacher', authenticateToken, requireRole('teacher'), async (req: AuthRequest, res: Response) => {
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
    `, [req.user!.id]);

    const formatted = requests.map((r) => ({
      ...r,
      preferred_days: JSON.parse(r.preferred_days || '[]'),
    }));

    res.json({ requests: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update request status (Teacher accepts/declines, student hires/completes)
apiRouter.put('/requests/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, status_notes } = req.body;

    const validStatuses = ['pending', 'accepted', 'declined', 'hired', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const db = await getDb();
    const request = queryOne(db, 'SELECT * FROM teacher_requests WHERE id = ?', [id]);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const isTeacher = req.user!.id === request.teacher_id;
    const isStudent = req.user!.id === request.student_id;
    const isAdmin = req.user!.role === 'admin';

    if (!isTeacher && !isStudent && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to modify this request' });
    }

    const now = new Date().toISOString();
    execute(db, `
      UPDATE teacher_requests
      SET status = ?,
          status_notes = COALESCE(?, status_notes),
          updated_at = ?
      WHERE id = ?
    `, [status, status_notes, now, id]);

    // Send reciprocal notification
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. REVIEWS & RATINGS
// ==========================================

apiRouter.post('/reviews', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { teacher_id, rating, comment, subject, interaction_type } = req.body;

    if (!teacher_id || !rating || !comment) {
      return res.status(400).json({ error: 'Teacher ID, rating (1-5), and written comment are required.' });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const db = await getDb();

    // Verify eligible interaction (e.g. parent request or institute job)
    const validRequest = queryOne(db, `
      SELECT id FROM teacher_requests 
      WHERE student_id = ? AND teacher_id = ? AND status IN ('accepted', 'hired', 'completed')
    `, [req.user!.id, teacher_id]);

    const validJob = queryOne(db, `
      SELECT ja.id FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE j.institute_id = ? AND ja.teacher_id = ? AND ja.status = 'hired'
    `, [req.user!.id, teacher_id]);

    if (!validRequest && !validJob && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Reviews are only permitted after a verified hiring or accepted teaching interaction.' });
    }

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    execute(db, `
      INSERT INTO reviews (id, reviewer_id, teacher_id, rating, comment, subject, interaction_type, is_moderated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [reviewId, req.user!.id, teacher_id, numRating, comment.trim(), subject || 'Tuition', interaction_type || 'parent_request', now]);

    // Recalculate teacher's average rating
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

    // Notify teacher
    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, ?, 'New Review Received', ?, ?, 0, 'review', ?)
    `, [
      `notif_${Date.now()}`,
      teacher_id,
      `${req.user!.full_name} gave you a ${numRating}★ review!`,
      `/teachers/${teacher_id}`,
      now
    ]);

    res.status(201).json({ message: 'Review submitted successfully!', review_id: reviewId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. SAVED ITEMS (TEACHERS & JOBS)
// ==========================================

apiRouter.get('/saved', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const saved = queryAll(db, `
      SELECT * FROM saved_items WHERE user_id = ? ORDER BY created_at DESC
    `, [req.user!.id]);

    const teacherIds = saved.filter((s) => s.item_type === 'teacher').map((s) => s.item_id);
    const jobIds = saved.filter((s) => s.item_type === 'job').map((s) => s.item_id);

    let teachers: any[] = [];
    if (teacherIds.length > 0) {
      const placeholders = teacherIds.map(() => '?').join(',');
      teachers = queryAll(db, `
        SELECT u.id, u.full_name, u.avatar_url, u.location, u.is_verified, tp.title, tp.hourly_rate, tp.rating_avg, tp.subjects
        FROM users u
        JOIN teacher_profiles tp ON u.id = tp.user_id
        WHERE u.id IN (${placeholders})
      `, teacherIds).map((t) => ({ ...t, subjects: JSON.parse(t.subjects || '[]') }));
    }

    let jobs: any[] = [];
    if (jobIds.length > 0) {
      const placeholders = jobIds.map(() => '?').join(',');
      jobs = queryAll(db, `
        SELECT j.*, ip.institute_name, u.avatar_url as institute_logo
        FROM jobs j
        JOIN institute_profiles ip ON j.institute_id = ip.user_id
        JOIN users u ON j.institute_id = u.id
        WHERE j.id IN (${placeholders})
      `, jobIds);
    }

    res.json({ teachers, jobs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/saved', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { item_type, item_id } = req.body;
    if (!item_type || !item_id) {
      return res.status(400).json({ error: 'Item type and ID are required' });
    }

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM saved_items WHERE user_id = ? AND item_type = ? AND item_id = ?', [req.user!.id, item_type, item_id]);

    if (existing) {
      execute(db, 'DELETE FROM saved_items WHERE id = ?', [existing.id]);
      return res.json({ saved: false, message: 'Removed from saved items' });
    } else {
      const id = `save_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      execute(db, 'INSERT INTO saved_items (id, user_id, item_type, item_id, created_at) VALUES (?, ?, ?, ?, ?)', [
        id, req.user!.id, item_type, item_id, new Date().toISOString()
      ]);
      return res.json({ saved: true, message: 'Saved successfully' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const notifs = queryAll(db, `
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `, [req.user!.id]);

    const unreadCount = notifs.filter((n) => !n.is_read).length;
    res.json({ notifications: notifs, unread_count: unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/notifications/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    execute(db, 'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/notifications/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    execute(db, 'UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user!.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. IN-APP MESSAGES & CONNECTION
// ==========================================

apiRouter.get('/messages/:contextType/:contextId', authenticateToken, async (req: AuthRequest, res: Response) => {
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

    // Mark incoming messages as read
    execute(db, `
      UPDATE messages 
      SET is_read = 1 
      WHERE context_type = ? AND context_id = ? AND receiver_id = ?
    `, [contextType, contextId, req.user!.id]);

    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/messages', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { context_type, context_id, receiver_id, content } = req.body;
    if (!context_type || !context_id || !receiver_id || !content) {
      return res.status(400).json({ error: 'Context, receiver, and message content are required.' });
    }

    const db = await getDb();
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    execute(db, `
      INSERT INTO messages (id, sender_id, receiver_id, context_type, context_id, content, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `, [msgId, req.user!.id, receiver_id, context_type, context_id, content.trim(), now]);

    // Create notification for receiver
    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, ?, 'New Message', ?, ?, 0, 'message', ?)
    `, [
      `notif_${Date.now()}`,
      receiver_id,
      `${req.user!.full_name}: "${content.substring(0, 45)}${content.length > 45 ? '...' : ''}"`,
      context_type === 'request' ? '/requests' : '/applications',
      now
    ]);

    res.status(201).json({ message: 'Message sent', message_id: msgId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. SAFETY, REPORTING & MODERATION
// ==========================================

apiRouter.post('/reports', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { reported_user_id, target_type, target_id, reason, details } = req.body;
    if (!target_type || !target_id || !reason) {
      return res.status(400).json({ error: 'Target type, target ID, and reason are required.' });
    }

    const db = await getDb();
    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    execute(db, `
      INSERT INTO reports (id, reporter_id, reported_user_id, target_type, target_id, reason, details, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [reportId, req.user!.id, reported_user_id || null, target_type, target_id, reason, details || '', now]);

    res.status(201).json({ message: 'Report submitted. Our safety team will review promptly.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. ADMIN DASHBOARD & GOVERNANCE
// ==========================================

// Platform Statistics & KPIs
apiRouter.get('/admin/stats', authenticateToken, requireRole('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();

    const totalUsers = queryOne(db, 'SELECT COUNT(*) as count FROM users')?.count || 0;
    const teachersCount = queryOne(db, 'SELECT COUNT(*) as count FROM users WHERE role = "teacher"')?.count || 0;
    const studentsCount = queryOne(db, 'SELECT COUNT(*) as count FROM users WHERE role = "student"')?.count || 0;
    const institutesCount = queryOne(db, 'SELECT COUNT(*) as count FROM users WHERE role = "institute"')?.count || 0;
    const openJobsCount = queryOne(db, 'SELECT COUNT(*) as count FROM jobs WHERE status = "open"')?.count || 0;
    const totalApplications = queryOne(db, 'SELECT COUNT(*) as count FROM job_applications')?.count || 0;
    const totalRequests = queryOne(db, 'SELECT COUNT(*) as count FROM teacher_requests')?.count || 0;
    const pendingVerifications = queryOne(db, 'SELECT COUNT(*) as count FROM teacher_profiles WHERE verification_status = "pending"')?.count || 0;
    const pendingReports = queryOne(db, 'SELECT COUNT(*) as count FROM reports WHERE status = "pending"')?.count || 0;

    // Recent activity feed
    const recentUsers = queryAll(db, 'SELECT id, full_name, role, email, created_at FROM users ORDER BY created_at DESC LIMIT 5');
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
        pending_reports: pendingReports,
      },
      recent_users: recentUsers,
      recent_requests: recentRequests,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Users Management
apiRouter.get('/admin/users', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { role, search } = req.query;
    const db = await getDb();

    let sql = 'SELECT id, email, full_name, role, avatar_url, phone, location, is_verified, is_suspended, created_at FROM users WHERE 1=1';
    const params: any[] = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      sql += ' AND (LOWER(full_name) LIKE ? OR LOWER(email) LIKE ?)';
      params.push(`%${String(search).toLowerCase()}%`, `%${String(search).toLowerCase()}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const users = queryAll(db, sql, params);
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin toggle user suspension
apiRouter.put('/admin/users/:id/suspension', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_suspended } = req.body;

    const db = await getDb();
    execute(db, 'UPDATE users SET is_suspended = ? WHERE id = ?', [is_suspended ? 1 : 0, id]);
    res.json({ message: `User ${is_suspended ? 'suspended' : 'reactivated'} successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin pending verifications
apiRouter.get('/admin/verifications', authenticateToken, requireRole('admin'), async (_req: AuthRequest, res: Response) => {
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin approve or reject teacher verification
apiRouter.put('/admin/verifications/:userId', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, notes } = req.body; // status: 'verified' | 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be verified or rejected' });
    }

    const db = await getDb();
    const isVerified = status === 'verified' ? 1 : 0;
    const now = new Date().toISOString();

    execute(db, `
      UPDATE teacher_profiles
      SET verification_status = ?,
          verification_notes = COALESCE(?, verification_notes),
          updated_at = ?
      WHERE user_id = ?
    `, [status, notes, now, userId]);

    execute(db, 'UPDATE users SET is_verified = ? WHERE id = ?', [isVerified, userId]);

    // Send notification to teacher
    execute(db, `
      INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
      VALUES (?, ?, 'Verification Status Update', ?, '/verification', 0, 'verification', ?)
    `, [
      `notif_${Date.now()}`,
      userId,
      status === 'verified'
        ? 'Congratulations! Your teacher credentials have been verified. Your verified badge is now active.'
        : `Your verification submission was reviewed: ${notes || 'Please resubmit with valid documents.'}`,
      now
    ]);

    res.json({ message: `Verification status set to ${status}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin moderation (reports, reviews)
apiRouter.get('/admin/moderation', authenticateToken, requireRole('admin'), async (_req: AuthRequest, res: Response) => {
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin resolve report
apiRouter.put('/admin/reports/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, action_taken } = req.body;

    const db = await getDb();
    execute(db, `
      UPDATE reports
      SET status = ?,
          action_taken = ?
      WHERE id = ?
    `, [status || 'resolved', action_taken || 'Reviewed and addressed', id]);

    res.json({ message: 'Report updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin toggle review moderation
apiRouter.put('/admin/reviews/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_moderated } = req.body;

    const db = await getDb();
    execute(db, 'UPDATE reviews SET is_moderated = ? WHERE id = ?', [is_moderated ? 1 : 0, id]);
    res.json({ message: `Review ${is_moderated ? 'approved' : 'hidden'}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
