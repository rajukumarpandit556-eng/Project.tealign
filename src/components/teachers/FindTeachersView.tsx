import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { TeacherCard } from './TeacherCard.tsx';
import {
  Search,
  Filter,
  Clock,
  MapPin,
  Calendar,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  GraduationCap
} from 'lucide-react';
import { DayOfWeek, TeachingMode } from '../../types/index.ts';

interface FindTeachersViewProps {
  onSelectTeacher: (teacherId: string) => void;
  onRequestTeacher: (teacher: any) => void;
  onToggleSave: (teacherId: string) => void;
  savedTeacherIds: Set<string>;
}

export const FindTeachersView: React.FC<FindTeachersViewProps> = ({
  onSelectTeacher,
  onRequestTeacher,
  onToggleSave,
  savedTeacherIds,
}) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);

  // Search & Filter State
  const [q, setQ] = useState('');
  const [subject, setSubject] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [location, setLocation] = useState('');
  const [mode, setMode] = useState<string>('');
  const [maxFee, setMaxFee] = useState<string>('');
  const [minExp, setMinExp] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [dayOfWeek, setDayOfWeek] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('rating');

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.getTeachers({
        q,
        subject,
        class_grade: classGrade,
        location,
        mode,
        max_fee: maxFee ? Number(maxFee) : undefined,
        min_experience: minExp ? Number(minExp) : undefined,
        verified_only: verifiedOnly ? 'true' : undefined,
        day_of_week: dayOfWeek || undefined,
        time_slot: timeSlot || undefined,
        sort_by: sortBy,
      });

      setTeachers(res.teachers || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to search teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [subject, classGrade, mode, verifiedOnly, dayOfWeek, timeSlot, sortBy]);

  const handleResetFilters = () => {
    setQ('');
    setSubject('');
    setClassGrade('');
    setLocation('');
    setMode('');
    setMaxFee('');
    setMinExp('');
    setVerifiedOnly(false);
    setDayOfWeek('');
    setTimeSlot('');
    setSortBy('rating');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTeachers();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Search Header Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-5">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-blue-100 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Structured Schedule & Subject Matching</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
            Find Verified Expert Teachers & Home Tutors
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
            Search by exact required subjects, class grades, home/online mode, and your exact weekly availability hours with guaranteed schedule overlap.
          </p>
        </div>

        {/* Primary Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search teacher name, subject, or qualification..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-blue-600 font-medium"
            />
          </div>

          <div className="relative w-full md:w-56">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or neighborhood..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-blue-600 font-medium"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
          >
            Find Teachers
          </button>
        </form>

        {/* Quick Filter Pill Controls (Interactive Buttons) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 mr-1 text-[11px]">Popular Subjects:</span>
          {['', 'Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science'].map((subj) => (
            <button
              key={subj}
              onClick={() => setSubject(subj)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                subject === subj
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
              }`}
            >
              {subj || 'All Subjects'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Filter Bar & Results Count */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Grade/Class */}
          <select
            value={classGrade}
            onChange={(e) => setClassGrade(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
          >
            <option value="">Any Grade / Class</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
            <option value="JEE Prep">IIT-JEE / NEET</option>
            <option value="IB Diploma">IB DP / Cambridge</option>
          </select>

          {/* Mode */}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
          >
            <option value="">Any Teaching Mode</option>
            <option value="home_student">Student's Residence</option>
            <option value="teacher_home">Teacher's Home</option>
            <option value="online">Live Online (1-on-1)</option>
            <option value="coaching">Coaching Academy</option>
            <option value="school">School Staffing</option>
          </select>

          {/* Availability Schedule Matcher */}
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            className="px-3 py-1.5 bg-blue-50/70 border border-blue-200 text-blue-900 rounded-xl font-semibold focus:outline-blue-600"
          >
            <option value="">Any Day Availability</option>
            <option value="monday">Available Mondays</option>
            <option value="tuesday">Available Tuesdays</option>
            <option value="wednesday">Available Wednesdays</option>
            <option value="thursday">Available Thursdays</option>
            <option value="friday">Available Fridays</option>
            <option value="saturday">Available Saturdays</option>
            <option value="sunday">Available Sundays</option>
          </select>

          {/* Time Slot Overlap */}
          <select
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            className="px-3 py-1.5 bg-blue-50/70 border border-blue-200 text-blue-900 rounded-xl font-mono focus:outline-blue-600"
          >
            <option value="">Any Time Slot</option>
            <option value="06:30-08:30">Morning (06:30 - 08:30)</option>
            <option value="16:00-18:00">Early Evening (16:00 - 18:00)</option>
            <option value="17:00-19:00">Evening Peak (17:00 - 19:00)</option>
            <option value="18:30-20:30">Late Evening (18:30 - 20:30)</option>
            <option value="10:00-14:00">Weekend Morning (10:00 - 14:00)</option>
          </select>

          {/* Verified Toggle */}
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors font-semibold ${
              verifiedOnly
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Educators Only</span>
          </button>

          {(subject || classGrade || mode || dayOfWeek || timeSlot || verifiedOnly || location || q) && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-slate-700 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right Sorting */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-normal">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-blue-600"
          >
            <option value="rating">Highest Rated</option>
            <option value="experience">Years of Experience</option>
            <option value="fee_asc">Fee: Low to High</option>
            <option value="fee_desc">Fee: High to Low</option>
          </select>
        </div>
      </div>

      {/* Results Count & Schedule Overlay notice */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <span className="font-bold text-slate-900 tabular-nums">{total}</span> qualified educator{total !== 1 ? 's' : ''}
        </span>
        {dayOfWeek && (
          <span className="text-blue-700 font-medium">
            Filtering by scheduled availability on <span className="font-bold capitalize">{dayOfWeek}</span>
            {timeSlot && <span> ({timeSlot})</span>}
          </span>
        )}
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          <Clock className="w-7 h-7 animate-spin mx-auto text-blue-600 mb-2" />
          <span>Searching educator database...</span>
        </div>
      ) : teachers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No matching educators found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try broadening your subject filter, removing the day/time restriction, or adjusting your location criteria.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teachers.map((teacher) => (
            <TeacherCard
              key={teacher.user_id || teacher.id}
              teacher={teacher}
              onSelect={onSelectTeacher}
              onRequest={onRequestTeacher}
              onToggleSave={onToggleSave}
              isSaved={savedTeacherIds.has(teacher.user_id || teacher.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
