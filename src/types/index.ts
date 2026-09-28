export type UserRole = 'teacher' | 'student' | 'institute' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  is_verified?: number | boolean;
  is_suspended?: number | boolean;
  created_at?: string;
}

export type TeachingMode = 'home_student' | 'teacher_home' | 'coaching' | 'school' | 'online';
export type EmploymentType = 'full_time' | 'part_time' | 'freelance_hourly';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface TeacherProfile {
  id: string;
  user_id: string;
  title: string;
  bio?: string;
  qualification: string;
  experience_years: number;
  hourly_rate: number;
  monthly_rate?: number;
  service_radius_km: number;
  teaching_modes: TeachingMode[];
  subjects: string[];
  classes: string[];
  languages: string[];
  employment_types: EmploymentType[];
  verification_status: VerificationStatus;
  verification_doc_name?: string;
  verification_notes?: string;
  rating_avg: number;
  review_count: number;
  created_at?: string;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface AvailabilitySlot {
  id?: string;
  teacher_id?: string;
  day_of_week: DayOfWeek;
  start_time: string; // "07:00"
  end_time: string;   // "09:00"
  is_active?: number | boolean;
}

export interface InstituteProfile {
  id: string;
  user_id: string;
  institute_name: string;
  institute_type: 'school' | 'coaching' | 'academy';
  website?: string;
  address: string;
  city: string;
  description?: string;
  established_year?: number;
}

export interface Job {
  id: string;
  institute_id: string;
  title: string;
  subject: string;
  class_grade: string;
  qualification_req: string;
  experience_req: number;
  location: string;
  employment_type: 'full-time' | 'part-time' | 'hourly';
  salary_min: number;
  salary_max: number;
  salary_type: 'monthly' | 'hourly';
  required_schedule: Array<{ day: string; time: string }>;
  description: string;
  status: 'open' | 'closed';
  created_at: string;
  // Joined fields
  institute_name?: string;
  institute_type?: string;
  institute_logo?: string;
  applicant_count?: number;
  user_applied?: boolean;
  user_application_status?: string | null;
  is_saved?: boolean;
}

export type ApplicationStatus = 'applied' | 'shortlisted' | 'interview' | 'hired' | 'rejected';

export interface JobApplication {
  id: string;
  job_id: string;
  teacher_id: string;
  cover_letter?: string;
  expected_salary?: number;
  status: ApplicationStatus;
  interview_date?: string;
  interview_notes?: string;
  created_at: string;
  // Joined fields
  job_title?: string;
  subject?: string;
  class_grade?: string;
  job_location?: string;
  institute_name?: string;
  institute_logo?: string;
  teacher_name?: string;
  teacher_email?: string;
  teacher_phone?: string;
  teacher_avatar?: string;
  teacher_location?: string;
  is_verified?: number | boolean;
  teacher_title?: string;
  qualification?: string;
  experience_years?: number;
  rating_avg?: number;
  subjects?: string[];
  teaching_modes?: TeachingMode[];
}

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'hired' | 'completed' | 'cancelled';

export interface TeacherRequest {
  id: string;
  student_id: string;
  teacher_id: string;
  subject: string;
  class_grade: string;
  teaching_mode: TeachingMode;
  preferred_days: DayOfWeek[];
  preferred_time_slot: string;
  student_location: string;
  hourly_budget?: number;
  message: string;
  status: RequestStatus;
  status_notes?: string;
  created_at: string;
  // Joined fields
  teacher_name?: string;
  teacher_email?: string;
  teacher_phone?: string;
  teacher_avatar?: string;
  teacher_verified?: number | boolean;
  teacher_title?: string;
  teacher_rate?: number;
  rating_avg?: number;
  student_name?: string;
  student_email?: string;
  student_phone?: string;
  student_avatar?: string;
  student_city?: string;
  review_given?: number;
}

export interface Review {
  id: string;
  reviewer_id: string;
  teacher_id: string;
  rating: number;
  comment: string;
  subject: string;
  interaction_type: 'parent_request' | 'institute_job';
  is_moderated: number;
  created_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
  teacher_name?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  is_read: number;
  type: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  context_type: 'request' | 'application';
  context_id: string;
  content: string;
  is_read: number;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  target_type: 'user' | 'job' | 'review' | 'message';
  target_id: string;
  reason: string;
  details?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  action_taken?: string;
  created_at: string;
  reporter_name?: string;
  reporter_email?: string;
}
