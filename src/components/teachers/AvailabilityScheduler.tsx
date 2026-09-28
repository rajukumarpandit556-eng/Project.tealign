import React, { useState, useEffect } from 'react';
import { AvailabilitySlot, DayOfWeek } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { Plus, Trash2, Clock, Check, Save, RotateCcw, AlertCircle } from 'lucide-react';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export const AvailabilityScheduler: React.FC = () => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const res = await api.getTeacherAvailability();
      setSlots(res.slots || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const getDaySlots = (day: DayOfWeek) => {
    return slots.filter((s) => s.day_of_week === day);
  };

  const addSlot = (day: DayOfWeek) => {
    const existing = getDaySlots(day);
    let defaultStart = '16:00';
    let defaultEnd = '19:00';

    if (existing.length > 0) {
      const last = existing[existing.length - 1];
      const endHour = parseInt(last.end_time.split(':')[0], 10);
      if (endHour < 21) {
        defaultStart = `${String(endHour + 1).padStart(2, '0')}:00`;
        defaultEnd = `${String(Math.min(endHour + 3, 23)).padStart(2, '0')}:00`;
      }
    }

    const newSlot: AvailabilitySlot = {
      day_of_week: day,
      start_time: defaultStart,
      end_time: defaultEnd,
      is_active: 1,
    };

    setSlots([...slots, newSlot]);
  };

  const updateSlot = (indexInDay: number, day: DayOfWeek, field: 'start_time' | 'end_time', val: string) => {
    let dayCount = 0;
    const updated = slots.map((s) => {
      if (s.day_of_week === day) {
        if (dayCount === indexInDay) {
          dayCount++;
          return { ...s, [field]: val };
        }
        dayCount++;
      }
      return s;
    });
    setSlots(updated);
  };

  const removeSlot = (indexInDay: number, day: DayOfWeek) => {
    let dayCount = 0;
    const updated = slots.filter((s) => {
      if (s.day_of_week === day) {
        const matches = dayCount === indexInDay;
        dayCount++;
        return !matches;
      }
      return true;
    });
    setSlots(updated);
  };

  const clearDay = (day: DayOfWeek) => {
    setSlots(slots.filter((s) => s.day_of_week !== day));
  };

  const applyPreset = (preset: 'weekday_evenings' | 'morning_batches' | 'all_week') => {
    let newSlots: AvailabilitySlot[] = [];
    if (preset === 'weekday_evenings') {
      const weekdays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      newSlots = weekdays.map((d) => ({
        day_of_week: d,
        start_time: '16:30',
        end_time: '20:30',
        is_active: 1,
      }));
    } else if (preset === 'morning_batches') {
      const all: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      newSlots = all.map((d) => ({
        day_of_week: d,
        start_time: '06:30',
        end_time: '09:00',
        is_active: 1,
      }));
    } else if (preset === 'all_week') {
      DAYS.forEach((d) => {
        newSlots.push({
          day_of_week: d.key,
          start_time: '10:00',
          end_time: '14:00',
          is_active: 1,
        });
        newSlots.push({
          day_of_week: d.key,
          start_time: '16:00',
          end_time: '20:00',
          is_active: 1,
        });
      });
    }
    setSlots(newSlots);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    // Validate slots
    for (const s of slots) {
      if (s.start_time >= s.end_time) {
        setErrorMsg(`Invalid time on ${s.day_of_week}: Start time (${s.start_time}) must be earlier than end time (${s.end_time}).`);
        setSaving(false);
        return;
      }
    }

    try {
      await api.updateTeacherAvailability(slots);
      setSuccessMsg('Your weekly availability schedule has been updated and published to the marketplace.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save availability schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <Clock className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Loading weekly scheduler...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">
            Weekly Availability Scheduler
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Configure custom start and end slots for every day. Support multiple slots per day (e.g. morning + evening) to power accurate search matching for parents and schools.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {saving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Availability</span>
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
        <span className="font-semibold text-slate-600 mr-1">Quick Presets:</span>
        <button
          onClick={() => applyPreset('weekday_evenings')}
          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors shadow-2xs"
        >
          Weekday Evenings (4:30 – 8:30 PM)
        </button>
        <button
          onClick={() => applyPreset('morning_batches')}
          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors shadow-2xs"
        >
          Morning Focus (6:30 – 9:00 AM)
        </button>
        <button
          onClick={() => applyPreset('all_week')}
          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors shadow-2xs"
        >
          Full 7-Day Split Routine
        </button>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 7-Day Slot Editor */}
      <div className="space-y-3">
        {DAYS.map((day) => {
          const daySlots = getDaySlots(day.key);
          const isOff = daySlots.length === 0;

          return (
            <div
              key={day.key}
              className={`p-4 rounded-xl border transition-all ${
                isOff
                  ? 'bg-slate-50/70 border-slate-200/60'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-28 font-bold text-sm ${isOff ? 'text-slate-400' : 'text-slate-900'}`}>
                    {day.label}
                  </div>
                  {isOff ? (
                    <span className="text-xs text-slate-400 italic">Day Off / Unavailable</span>
                  ) : (
                    <span className="text-xs text-blue-600 font-medium">
                      {daySlots.length} active slot{daySlots.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addSlot(day.key)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Slot</span>
                  </button>

                  {!isOff && (
                    <button
                      onClick={() => clearDay(day.key)}
                      className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Clear all slots for this day"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Slot Items */}
              {!isOff && (
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {daySlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => updateSlot(idx, day.key, 'start_time', e.target.value)}
                          className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs text-slate-900 focus:outline-blue-600"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) => updateSlot(idx, day.key, 'end_time', e.target.value)}
                          className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs text-slate-900 focus:outline-blue-600"
                        />
                      </div>
                      <button
                        onClick={() => removeSlot(idx, day.key)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Remove this slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
