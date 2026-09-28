import { Database } from 'sql.js';
import { hashPassword } from './auth.js';
import { execute, queryOne, persistDb } from './db.js';

export async function seedInitialData(db: Database) {
  // Check if admin user already exists
  const existing = queryOne(db, "SELECT id FROM users WHERE email = 'admin@tealign.com'");
  if (existing) {
    return; // Already seeded
  }

  console.log('Seeding initial production marketplace data...');
  const defaultPasswordHash = await hashPassword('Tealign2026!');
  const now = new Date().toISOString();

  // 1. Users
  const users = [
    {
      id: 'usr_admin',
      email: 'admin@tealign.com',
      full_name: 'Eleanor Vance',
      role: 'admin',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      phone: '+1 555-0199',
      location: 'Central Admin Office',
      is_verified: 1,
    },
    {
      id: 'usr_teacher_ananya',
      email: 'teacher.ananya@tealign.com',
      full_name: 'Dr. Ananya Sharma',
      role: 'teacher',
      avatar_url: '/src/assets/images/teacher_portrait_female_1790609487993.jpg',
      phone: '+91 98110 23456',
      location: 'South Extension, New Delhi',
      is_verified: 1,
    },
    {
      id: 'usr_teacher_rohit',
      email: 'teacher.rohit@tealign.com',
      full_name: 'Rohit Verma',
      role: 'teacher',
      avatar_url: '/src/assets/images/teacher_portrait_male_1790609502955.jpg',
      phone: '+91 98220 34567',
      location: 'Koramangala, Bengaluru',
      is_verified: 1,
    },
    {
      id: 'usr_teacher_sarah',
      email: 'teacher.sarah@tealign.com',
      full_name: 'Sarah Jenkins',
      role: 'teacher',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      phone: '+1 555-0142',
      location: 'Bandra West, Mumbai',
      is_verified: 1,
    },
    {
      id: 'usr_teacher_karthik',
      email: 'teacher.karthik@tealign.com',
      full_name: 'Karthik Subramanian',
      role: 'teacher',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      phone: '+91 98330 45678',
      location: 'Indiranagar, Bengaluru',
      is_verified: 0, // Pending verification
    },
    {
      id: 'usr_student_priya',
      email: 'parent.priya@tealign.com',
      full_name: 'Priya Menon',
      role: 'student',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      phone: '+91 98440 56789',
      location: 'Greater Kailash, New Delhi',
      is_verified: 1,
    },
    {
      id: 'usr_student_arjun',
      email: 'student.arjun@tealign.com',
      full_name: 'Arjun Patel',
      role: 'student',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      phone: '+91 98550 67890',
      location: 'HSR Layout, Bengaluru',
      is_verified: 1,
    },
    {
      id: 'usr_inst_apex',
      email: 'school.apex@tealign.com',
      full_name: 'Rajesh Khurana (Director)',
      role: 'institute',
      avatar_url: '/src/assets/images/institute_campus_building_1790609515143.jpg',
      phone: '+91 11 2689 0011',
      location: 'Vasant Kunj, New Delhi',
      is_verified: 1,
    },
    {
      id: 'usr_inst_zenith',
      email: 'coaching.zenith@tealign.com',
      full_name: 'Neha Kapoor (Academic Dean)',
      role: 'institute',
      avatar_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=400&q=80',
      phone: '+91 80 4123 9988',
      location: 'Koramangala 4th Block, Bengaluru',
      is_verified: 1,
    }
  ];

  for (const u of users) {
    execute(db, `
      INSERT INTO users (id, email, password_hash, full_name, role, avatar_url, phone, location, is_verified, is_suspended, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `, [u.id, u.email, defaultPasswordHash, u.full_name, u.role, u.avatar_url, u.phone, u.location, u.is_verified, now, now]);
  }

  // 2. Teacher Profiles
  const teacherProfiles = [
    {
      id: 'tp_ananya',
      user_id: 'usr_teacher_ananya',
      title: 'Senior Mathematics & Statistics Specialist (CBSE, ICSE & IB DP)',
      bio: 'Ph.D. in Applied Mathematics with over 8 years of dedicated pedagogical experience. Specializing in making higher-order calculus, algebraic reasoning, and coordinate geometry intuitive and scoring for high school and competitive board students.',
      qualification: 'Ph.D. Applied Mathematics, M.Sc. Delhi University, B.Ed',
      experience_years: 8,
      hourly_rate: 1200,
      monthly_rate: 18000,
      service_radius_km: 12,
      teaching_modes: JSON.stringify(['home_student', 'teacher_home', 'coaching', 'online']),
      subjects: JSON.stringify(['Mathematics', 'Applied Mathematics', 'Statistics', 'Quantitative Reasoning']),
      classes: JSON.stringify(['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'IB Diploma']),
      languages: JSON.stringify(['English', 'Hindi']),
      employment_types: JSON.stringify(['part_time', 'freelance_hourly']),
      verification_status: 'verified',
      verification_doc_name: 'degree_phd_mathematics_du.pdf',
      verification_notes: 'All university credentials, identity proof, and criminal background checks verified by Tealign Admin.',
      rating_avg: 4.95,
      review_count: 18
    },
    {
      id: 'tp_rohit',
      user_id: 'usr_teacher_rohit',
      title: 'Physics Master Educator (IIT-JEE Main/Adv, NEET & Olympiads)',
      bio: 'M.Tech from IIT Bombay with 6+ years mentoring top rankers in mechanics, electrodynamics, optics, and thermodynamics. Focuses on conceptual clarity and problem-solving velocity.',
      qualification: 'M.Tech IIT Bombay, B.Tech Electrical Engineering',
      experience_years: 6,
      hourly_rate: 1500,
      monthly_rate: 22000,
      service_radius_km: 15,
      teaching_modes: JSON.stringify(['home_student', 'teacher_home', 'coaching', 'school', 'online']),
      subjects: JSON.stringify(['Physics', 'Applied Physics', 'Science (Grade 9-10)']),
      classes: JSON.stringify(['Grade 10', 'Grade 11', 'Grade 12', 'JEE Prep', 'NEET Prep']),
      languages: JSON.stringify(['English', 'Hindi', 'Kannada']),
      employment_types: JSON.stringify(['full_time', 'part_time', 'freelance_hourly']),
      verification_status: 'verified',
      verification_doc_name: 'iit_bombay_mtech_certificate.pdf',
      verification_notes: 'Verified IIT degree and teaching credentials.',
      rating_avg: 4.88,
      review_count: 24
    },
    {
      id: 'tp_sarah',
      user_id: 'usr_teacher_sarah',
      title: 'Certified English Literature, Creative Writing & IELTS/TOEFL Coach',
      bio: 'CELTA-certified educator with master’s degree in English Literature. Specializes in advanced essay composition, analytical reading, speech fluency, and standardized English exams.',
      qualification: 'M.A. English Literature, Cambridge CELTA Certified',
      experience_years: 5,
      hourly_rate: 950,
      monthly_rate: 14000,
      service_radius_km: 8,
      teaching_modes: JSON.stringify(['home_student', 'online', 'school']),
      subjects: JSON.stringify(['English Literature', 'English Language', 'IELTS / TOEFL', 'Creative Writing']),
      classes: JSON.stringify(['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
      languages: JSON.stringify(['English', 'French (Beginner)']),
      employment_types: JSON.stringify(['part_time', 'freelance_hourly']),
      verification_status: 'verified',
      verification_doc_name: 'cambridge_celta_award.pdf',
      verification_notes: 'CELTA license number verified via Cambridge portal.',
      rating_avg: 4.92,
      review_count: 14
    },
    {
      id: 'tp_karthik',
      user_id: 'usr_teacher_karthik',
      title: 'Computer Science, Python & Artificial Intelligence Tutor',
      bio: 'B.Tech in Computer Science and former software engineer passionately teaching Python, Data Structures, Web Development, and CBSE CS curriculum to secondary students.',
      qualification: 'B.Tech Computer Science & Engineering',
      experience_years: 4,
      hourly_rate: 850,
      monthly_rate: 12500,
      service_radius_km: 10,
      teaching_modes: JSON.stringify(['home_student', 'online', 'coaching']),
      subjects: JSON.stringify(['Computer Science', 'Python Programming', 'Information Technology', 'Data Structures']),
      classes: JSON.stringify(['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'College Undergrad']),
      languages: JSON.stringify(['English', 'Tamil']),
      employment_types: JSON.stringify(['part_time', 'freelance_hourly']),
      verification_status: 'pending',
      verification_doc_name: 'btech_transcripts_anna_univ.pdf',
      verification_notes: 'Document submitted on March 26. Pending admin verification review.',
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
      tp.id, tp.user_id, tp.title, tp.bio, tp.qualification, tp.experience_years, tp.hourly_rate, tp.monthly_rate,
      tp.service_radius_km, tp.teaching_modes, tp.subjects, tp.classes, tp.languages, tp.employment_types,
      tp.verification_status, tp.verification_doc_name, tp.verification_notes, tp.rating_avg, tp.review_count, now, now
    ]);
  }

  // 3. Weekly Availability Slots (Custom day/time slots, multiple slots per day)
  const availability = [
    // Dr. Ananya Sharma (usr_teacher_ananya)
    { id: 'av_1', teacher_id: 'usr_teacher_ananya', day: 'monday', start: '06:30', end: '08:30' },
    { id: 'av_2', teacher_id: 'usr_teacher_ananya', day: 'monday', start: '16:00', end: '20:30' },
    { id: 'av_3', teacher_id: 'usr_teacher_ananya', day: 'tuesday', start: '16:00', end: '20:30' },
    { id: 'av_4', teacher_id: 'usr_teacher_ananya', day: 'wednesday', start: '06:30', end: '08:30' },
    { id: 'av_5', teacher_id: 'usr_teacher_ananya', day: 'wednesday', start: '16:00', end: '20:30' },
    { id: 'av_6', teacher_id: 'usr_teacher_ananya', day: 'thursday', start: '16:00', end: '20:30' },
    { id: 'av_7', teacher_id: 'usr_teacher_ananya', day: 'friday', start: '15:00', end: '19:30' },
    { id: 'av_8', teacher_id: 'usr_teacher_ananya', day: 'saturday', start: '09:00', end: '14:00' },
    // Rohit Verma (usr_teacher_rohit)
    { id: 'av_9', teacher_id: 'usr_teacher_rohit', day: 'monday', start: '17:00', end: '21:00' },
    { id: 'av_10', teacher_id: 'usr_teacher_rohit', day: 'tuesday', start: '17:00', end: '21:00' },
    { id: 'av_11', teacher_id: 'usr_teacher_rohit', day: 'thursday', start: '17:00', end: '21:00' },
    { id: 'av_12', teacher_id: 'usr_teacher_rohit', day: 'friday', start: '17:00', end: '21:00' },
    { id: 'av_13', teacher_id: 'usr_teacher_rohit', day: 'saturday', start: '09:00', end: '16:00' },
    { id: 'av_14', teacher_id: 'usr_teacher_rohit', day: 'sunday', start: '10:00', end: '14:00' },
    // Sarah Jenkins (usr_teacher_sarah)
    { id: 'av_15', teacher_id: 'usr_teacher_sarah', day: 'monday', start: '14:00', end: '19:00' },
    { id: 'av_16', teacher_id: 'usr_teacher_sarah', day: 'tuesday', start: '14:00', end: '19:00' },
    { id: 'av_17', teacher_id: 'usr_teacher_sarah', day: 'wednesday', start: '14:00', end: '19:00' },
    { id: 'av_18', teacher_id: 'usr_teacher_sarah', day: 'thursday', start: '14:00', end: '19:00' },
    { id: 'av_19', teacher_id: 'usr_teacher_sarah', day: 'saturday', start: '10:00', end: '13:00' },
    // Karthik Subramanian (usr_teacher_karthik)
    { id: 'av_20', teacher_id: 'usr_teacher_karthik', day: 'monday', start: '18:00', end: '21:30' },
    { id: 'av_21', teacher_id: 'usr_teacher_karthik', day: 'wednesday', start: '18:00', end: '21:30' },
    { id: 'av_22', teacher_id: 'usr_teacher_karthik', day: 'saturday', start: '11:00', end: '18:00' },
    { id: 'av_23', teacher_id: 'usr_teacher_karthik', day: 'sunday', start: '11:00', end: '18:00' },
  ];

  for (const slot of availability) {
    execute(db, `
      INSERT INTO availability_slots (id, teacher_id, day_of_week, start_time, end_time, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [slot.id, slot.teacher_id, slot.day, slot.start, slot.end]);
  }

  // 4. Institute Profiles
  execute(db, `
    INSERT INTO institute_profiles (id, user_id, institute_name, institute_type, website, address, city, description, established_year, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'ip_apex', 'usr_inst_apex', 'Apex Senior Secondary & Cambridge International School', 'school',
    'https://apexschool.edu.example', 'Plot 14, Sector C, Vasant Kunj', 'New Delhi',
    'Leading K-12 educational institution committed to scholastic rigor, critical thinking, STEM innovation, and global citizenship.',
    2004, now, now
  ]);

  execute(db, `
    INSERT INTO institute_profiles (id, user_id, institute_name, institute_type, website, address, city, description, established_year, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'ip_zenith', 'usr_inst_zenith', 'Zenith IIT & Medical Olympiad Academy', 'coaching',
    'https://zenithacademy.edu.example', '84 Koramangala 4th Block, 80 Feet Road', 'Bengaluru',
    'Premier entrance coaching institute known for consistent Top-100 AIRs in JEE Advanced and NEET-UG with dedicated mentor-led small cohorts.',
    2012, now, now
  ]);

  // 5. Jobs posted by institutes
  const jobs = [
    {
      id: 'job_math_apex',
      institute_id: 'usr_inst_apex',
      title: 'Senior Secondary Mathematics Teacher (Grades 11 & 12 CBSE)',
      subject: 'Mathematics',
      class_grade: 'Grade 11-12',
      qualification_req: 'M.Sc. Mathematics, B.Ed mandatory with prior CBSE experience',
      experience_req: 4,
      location: 'Vasant Kunj, New Delhi (On-campus)',
      employment_type: 'full-time',
      salary_min: 65000,
      salary_max: 85000,
      salary_type: 'monthly',
      required_schedule: JSON.stringify([
        { day: 'Monday - Friday', time: '08:00 - 14:30' },
        { day: 'Alternate Saturdays', time: '08:30 - 12:30' }
      ]),
      description: 'We are seeking an energetic educator to instruct Grade 11 and 12 mathematics cohorts. Responsibilities include syllabus delivery, diagnostic weekly testing, board preparation modules, and organizing inter-school math olympiads.',
      status: 'open'
    },
    {
      id: 'job_physics_zenith',
      institute_id: 'usr_inst_zenith',
      title: 'Master Faculty - Advanced Physics (JEE Advanced Cohort)',
      subject: 'Physics',
      class_grade: 'JEE Advanced / Olympiad',
      qualification_req: 'B.Tech/M.Tech from IIT/NIT or M.Sc Physics with top rank track record',
      experience_req: 5,
      location: 'Koramangala, Bengaluru (Hybrid / Classroom)',
      employment_type: 'full-time',
      salary_min: 120000,
      salary_max: 180000,
      salary_type: 'monthly',
      required_schedule: JSON.stringify([
        { day: 'Monday, Wednesday, Friday', time: '16:30 - 20:30' },
        { day: 'Saturday & Sunday', time: '10:00 - 15:00' }
      ]),
      description: 'Lead high-achieving student batches targeting Top 500 in JEE Advanced. You will curate challenging problem sets, conduct doubt-clearing workshops, and mentor students in analytical mechanics and electromagnetism.',
      status: 'open'
    },
    {
      id: 'job_cs_zenith',
      institute_id: 'usr_inst_zenith',
      title: 'Coding & Algorithmic Problem Solving Instructor (High School)',
      subject: 'Computer Science',
      class_grade: 'Grade 9-12',
      qualification_req: 'Degree in Computer Science or Software Engineering',
      experience_req: 2,
      location: 'Koramangala, Bengaluru',
      employment_type: 'part-time',
      salary_min: 40000,
      salary_max: 55000,
      salary_type: 'monthly',
      required_schedule: JSON.stringify([
        { day: 'Tuesday & Thursday', time: '17:00 - 19:30' },
        { day: 'Saturday', time: '14:00 - 17:00' }
      ]),
      description: 'Train budding programmers in Python, logic building, algorithmic complexity, and preparation for ZIO (Zonal Informatics Olympiad).',
      status: 'open'
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
      j.id, j.institute_id, j.title, j.subject, j.class_grade, j.qualification_req, j.experience_req,
      j.location, j.employment_type, j.salary_min, j.salary_max, j.salary_type, j.required_schedule,
      j.description, j.status, now, now
    ]);
  }

  // 6. Job Applications
  execute(db, `
    INSERT INTO job_applications (id, job_id, teacher_id, cover_letter, expected_salary, status, interview_date, interview_notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'app_rohit_zenith', 'job_physics_zenith', 'usr_teacher_rohit',
    'I have 6 years of experience mentoring IIT-JEE candidates with 14 students qualifying in the top 500 rank bracket. My pedagogical approach focuses on breaking down multi-concept physics problems into first principles.',
    160000, 'interview', '2026-10-04T15:00:00Z',
    'Round 1 technical screening cleared. Scheduled for demo lecture on Rotational Dynamics on Saturday.',
    now, now
  ]);

  execute(db, `
    INSERT INTO job_applications (id, job_id, teacher_id, cover_letter, expected_salary, status, interview_date, interview_notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'app_ananya_apex', 'job_math_apex', 'usr_teacher_ananya',
    'As a Ph.D. holder with 8 years of school board teaching experience, I have developed structured revision modules that have helped over 90% of my students score above 90% in CBSE Board exams.',
    80000, 'shortlisted', null,
    'Profile and credentials reviewed. Shortlisted for panel review.',
    now, now
  ]);

  // 7. Teacher Requests (Parent/Student <-> Teacher)
  execute(db, `
    INSERT INTO teacher_requests (
      id, student_id, teacher_id, subject, class_grade, teaching_mode, preferred_days,
      preferred_time_slot, student_location, hourly_budget, message, status, status_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'req_priya_ananya', 'usr_student_priya', 'usr_teacher_ananya',
    'Mathematics', 'Grade 10', 'home_student',
    JSON.stringify(['monday', 'wednesday', 'friday']),
    '17:00 - 18:30', 'Greater Kailash, New Delhi',
    1200,
    'Hello Dr. Ananya, my daughter is in 10th grade CBSE and needs focused guidance in Quadratic Equations, Trigonometry, and Surface Areas. We live within 4 km of South Extension.',
    'accepted',
    'Teacher accepted the request. First trial session scheduled for Wednesday 5 PM.',
    now, now
  ]);

  execute(db, `
    INSERT INTO teacher_requests (
      id, student_id, teacher_id, subject, class_grade, teaching_mode, preferred_days,
      preferred_time_slot, student_location, hourly_budget, message, status, status_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'req_arjun_rohit', 'usr_student_arjun', 'usr_teacher_rohit',
    'Physics', 'Grade 12', 'online',
    JSON.stringify(['tuesday', 'thursday', 'saturday']),
    '18:00 - 19:30', 'HSR Layout, Bengaluru',
    1500,
    'Hi Sir, I am preparing for JEE Advanced 2027 and need intensive 1-on-1 problem solving sessions for Modern Physics and Electrodynamics.',
    'hired',
    'Regular weekly tuition active. 12 classes completed successfully.',
    now, now
  ]);

  // 8. Reviews
  execute(db, `
    INSERT INTO reviews (id, reviewer_id, teacher_id, rating, comment, subject, interaction_type, is_moderated, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `, [
    'rev_1', 'usr_student_priya', 'usr_teacher_ananya', 5,
    'Dr. Ananya is phenomenal! Her patience and methodical approach made math my daughter’s favorite subject. Her scores went from 68% to 92% in the pre-boards.',
    'Grade 10 Mathematics', 'parent_request', now
  ]);

  execute(db, `
    INSERT INTO reviews (id, reviewer_id, teacher_id, rating, comment, subject, interaction_type, is_moderated, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `, [
    'rev_2', 'usr_student_arjun', 'usr_teacher_rohit', 5,
    'Rohit sir makes the toughest JEE questions feel approachable. His visual diagrams and problem breakdowns are world-class.',
    'Physics (JEE Advanced)', 'parent_request', now
  ]);

  // 9. Notifications
  execute(db, `
    INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
    VALUES (?, ?, ?, ?, ?, 0, 'request', ?)
  `, [
    'notif_1', 'usr_teacher_ananya', 'New Parent Request Accepted',
    'Priya Menon confirmed your upcoming tuition session for Grade 10 Mathematics.',
    '/requests', now
  ]);

  execute(db, `
    INSERT INTO notifications (id, user_id, title, message, link, is_read, type, created_at)
    VALUES (?, ?, ?, ?, ?, 0, 'application', ?)
  `, [
    'notif_2', 'usr_teacher_rohit', 'Interview Scheduled at Zenith Academy',
    'Zenith IIT Academy scheduled your demo lecture interview for Saturday.',
    '/applications', now
  ]);

  // 10. Messages (Sample conversation)
  execute(db, `
    INSERT INTO messages (id, sender_id, receiver_id, context_type, context_id, content, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `, [
    'msg_1', 'usr_student_priya', 'usr_teacher_ananya', 'request', 'req_priya_ananya',
    'Hello Dr. Ananya, thank you so much for accepting! Can we begin this Wednesday at 5:00 PM?', now
  ]);

  execute(db, `
    INSERT INTO messages (id, sender_id, receiver_id, context_type, context_id, content, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `, [
    'msg_2', 'usr_teacher_ananya', 'usr_student_priya', 'request', 'req_priya_ananya',
    'Hello Priya! Yes, Wednesday at 5:00 PM works perfectly. I will bring initial diagnostic assessment sheets.', now
  ]);

  // 11. Reports (Sample moderated item for admin demo)
  execute(db, `
    INSERT INTO reports (id, reporter_id, reported_user_id, target_type, target_id, reason, details, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `, [
    'rep_1', 'usr_inst_apex', 'usr_teacher_karthik', 'user', 'usr_teacher_karthik',
    'Profile Credentials Incomplete',
    'User listed full-time coaching availability during school morning hours while also marked as college faculty.',
    now
  ]);

  persistDb();
  console.log('Seeding completed successfully!');
}
