import initSqlJs, { Database } from 'sql.js';
import fs from 'node:fs';
import path from 'node:path';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'tealign.sqlite');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
      dbInstance.run('PRAGMA foreign_keys = ON;');
      return dbInstance;
    } catch (err) {
      console.error('Error loading existing SQLite database, creating fresh one:', err);
    }
  }

  dbInstance = new SQL.Database();
  dbInstance.run('PRAGMA foreign_keys = ON;');
  initSchema(dbInstance);
  persistDb();
  return dbInstance;
}

export function persistDb() {
  if (!dbInstance) return;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist database to disk:', err);
  }
}

function initSchema(db: Database) {
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

// SQL Query helper utilities
export function queryAll<T = any>(db: Database, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    return results;
  } finally {
    stmt.free();
  }
}

export function queryOne<T = any>(db: Database, sql: string, params: any[] = []): T | null {
  const results = queryAll<T>(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

export function execute(db: Database, sql: string, params: any[] = []): void {
  db.run(sql, params);
  persistDb();
}
