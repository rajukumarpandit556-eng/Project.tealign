import React from 'react';
import { AvailabilitySlot } from '../../types/index.ts';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface ScheduleViewerProps {
  slots: AvailabilitySlot[];
  compact?: boolean;
}

const DAYS = [
  { key: 'monday', label: 'Mon', full: 'Monday' },
  { key: 'tuesday', label: 'Tue', full: 'Tuesday' },
  { key: 'wednesday', label: 'Wed', full: 'Wednesday' },
  { key: 'thursday', label: 'Thu', full: 'Thursday' },
  { key: 'friday', label: 'Fri', full: 'Friday' },
  { key: 'saturday', label: 'Sat', full: 'Saturday' },
  { key: 'sunday', label: 'Sun', full: 'Sunday' },
];

export const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ slots = [], compact = false }) => {
  // Group slots by day
  const slotsByDay: Record<string, AvailabilitySlot[]> = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };

  slots.forEach((s) => {
    const day = s.day_of_week?.toLowerCase();
    if (slotsByDay[day] && (s.is_active === 1 || s.is_active === true || s.is_active === undefined)) {
      slotsByDay[day].push(s);
    }
  });

  // Sort each day's slots by start time
  Object.keys(slotsByDay).forEach((day) => {
    slotsByDay[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
  });

  const activeDaysCount = Object.values(slotsByDay).filter((arr) => arr.length > 0).length;

  if (compact) {
    return (
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-500 font-medium pb-1 border-b border-slate-100">
          <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Weekly Routine
          </span>
          <span>{activeDaysCount} active days / week</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {DAYS.map((d) => {
            const hasSlots = slotsByDay[d.key].length > 0;
            return (
              <div
                key={d.key}
                className={`py-1.5 px-1 rounded-md text-[11px] font-medium border ${
                  hasSlots
                    ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}
              >
                <div>{d.label}</div>
                <div className="text-[9px] mt-0.5 opacity-80">
                  {hasSlots ? `${slotsByDay[d.key].length} slot${slotsByDay[d.key].length > 1 ? 's' : ''}` : 'Off'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">Weekly Availability Schedule</h4>
            <p className="text-xs text-slate-500">Live updated custom tutoring & consultation hours</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{activeDaysCount} Days Available</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
        {DAYS.map((d) => {
          const daySlots = slotsByDay[d.key];
          const hasSlots = daySlots.length > 0;

          return (
            <div
              key={d.key}
              className={`p-3 rounded-xl border transition-all ${
                hasSlots
                  ? 'bg-blue-50/40 border-blue-200/80 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900">{d.full}</span>
                {hasSlots ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>

              {hasSlots ? (
                <div className="space-y-1.5">
                  {daySlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-blue-200 rounded-md px-2 py-1 text-[11px] font-mono text-blue-900 font-semibold shadow-2xs"
                    >
                      {slot.start_time} - {slot.end_time}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic py-1">
                  Unavailable
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
