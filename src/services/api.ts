import {
  User,
  TeacherProfile,
  AvailabilitySlot,
  Job,
  JobApplication,
  TeacherRequest,
  Review,
  Notification,
  Message,
  Report,
} from '../types/index.ts';

const TOKEN_KEY = 'tealign_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  demoLogin: (role: string) => request<{ token: string; user: User }>('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  getMe: () => request<{ user: User; profile: any }>('/auth/me'),
  updateProfile: (body: Partial<User>) => request<{ message: string; user: User }>('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Teachers & Search
  getTeachers: (params?: Record<string, string | number | boolean | undefined>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') searchParams.append(k, String(v));
      });
    }
    const query = searchParams.toString();
    return request<{ teachers: any[]; total: number }>(`/teachers${query ? `?${query}` : ''}`);
  },

  getTeacherById: (id: string) => request<{ teacher: any }>(`/teachers/${id}`),
  updateTeacherProfile: (body: Partial<TeacherProfile>) => request<{ message: string }>('/teachers/profile', { method: 'PUT', body: JSON.stringify(body) }),
  getTeacherAvailability: () => request<{ slots: AvailabilitySlot[] }>('/teachers/me/availability'),
  updateTeacherAvailability: (slots: AvailabilitySlot[]) => request<{ message: string }>('/teachers/me/availability', { method: 'PUT', body: JSON.stringify({ slots }) }),
  submitTeacherVerification: (body: { document_name: string; notes?: string }) => request<{ message: string }>('/teachers/me/verification', { method: 'POST', body: JSON.stringify(body) }),

  // Jobs
  getJobs: (params?: Record<string, string | number | boolean | undefined>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') searchParams.append(k, String(v));
      });
    }
    const query = searchParams.toString();
    return request<{ jobs: Job[]; total: number }>(`/jobs${query ? `?${query}` : ''}`);
  },

  getJobById: (id: string) => request<{ job: Job; user_application?: JobApplication | null; is_saved?: boolean }>(`/jobs/${id}`),
  createJob: (body: any) => request<{ message: string; job_id: string }>('/jobs', { method: 'POST', body: JSON.stringify(body) }),
  updateJob: (id: string, body: any) => request<{ message: string }>(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  getMyInstituteJobs: () => request<{ jobs: Job[] }>('/institutes/me/jobs'),
  getJobApplications: (jobId: string) => request<{ applications: JobApplication[]; job_title: string }>(`/jobs/${jobId}/applications`),
  applyJob: (jobId: string, body: { cover_letter: string; expected_salary?: number }) => request<{ message: string; application_id: string }>(`/jobs/${jobId}/apply`, { method: 'POST', body: JSON.stringify(body) }),
  getMyApplications: () => request<{ applications: JobApplication[] }>('/teachers/me/applications'),
  updateApplicationStatus: (appId: string, body: { status: string; interview_date?: string; interview_notes?: string }) => request<{ message: string }>(`/applications/${appId}/status`, { method: 'PUT', body: JSON.stringify(body) }),

  // Teacher Requests (Student <-> Teacher)
  createRequest: (body: any) => request<{ message: string; request_id: string }>('/requests', { method: 'POST', body: JSON.stringify(body) }),
  getStudentRequests: () => request<{ requests: TeacherRequest[] }>('/requests/student'),
  getTeacherRequests: () => request<{ requests: TeacherRequest[] }>('/requests/teacher'),
  updateRequestStatus: (id: string, body: { status: string; status_notes?: string }) => request<{ message: string }>(`/requests/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),

  // Reviews
  createReview: (body: any) => request<{ message: string; review_id: string }>('/reviews', { method: 'POST', body: JSON.stringify(body) }),

  // Saved Items
  getSavedItems: () => request<{ teachers: any[]; jobs: Job[] }>('/saved'),
  toggleSave: (item_type: 'teacher' | 'job', item_id: string) => request<{ saved: boolean; message: string }>('/saved', { method: 'POST', body: JSON.stringify({ item_type, item_id }) }),

  // Notifications
  getNotifications: () => request<{ notifications: Notification[]; unread_count: number }>('/notifications'),
  markNotificationRead: (id: string) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<{ success: boolean }>('/notifications/read-all', { method: 'PUT' }),

  // Messages
  getMessages: (contextType: 'request' | 'application', contextId: string) => request<{ messages: Message[] }>(`/messages/${contextType}/${contextId}`),
  sendMessage: (body: { context_type: 'request' | 'application'; context_id: string; receiver_id: string; content: string }) => request<{ message: string; message_id: string }>('/messages', { method: 'POST', body: JSON.stringify(body) }),

  // Reports
  createReport: (body: any) => request<{ message: string }>('/reports', { method: 'POST', body: JSON.stringify(body) }),

  // Admin
  getAdminStats: () => request<{ metrics: any; recent_users: any[]; recent_requests: any[] }>('/admin/stats'),
  getAdminUsers: (params?: { role?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append('role', params.role);
    if (params?.search) searchParams.append('search', params.search);
    const query = searchParams.toString();
    return request<{ users: User[] }>(`/admin/users${query ? `?${query}` : ''}`);
  },
  toggleUserSuspension: (userId: string, is_suspended: boolean) => request<{ message: string }>(`/admin/users/${userId}/suspension`, { method: 'PUT', body: JSON.stringify({ is_suspended }) }),
  getAdminVerifications: () => request<{ verifications: any[] }>('/admin/verifications'),
  updateVerificationStatus: (userId: string, status: 'verified' | 'rejected', notes?: string) => request<{ message: string }>(`/admin/verifications/${userId}`, { method: 'PUT', body: JSON.stringify({ status, notes }) }),
  getAdminModeration: () => request<{ reports: Report[]; reviews: Review[] }>('/admin/moderation'),
  resolveReport: (id: string, body: { status: string; action_taken: string }) => request<{ message: string }>(`/admin/reports/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggleReviewModeration: (id: string, is_moderated: boolean) => request<{ message: string }>(`/admin/reviews/${id}`, { method: 'PUT', body: JSON.stringify({ is_moderated }) }),
};
