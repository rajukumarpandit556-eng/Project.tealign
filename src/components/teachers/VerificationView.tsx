import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { ShieldCheck, Upload, AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react';

export const VerificationView: React.FC = () => {
  const { user, profile, refreshUser } = useAuth();
  const [docName, setDocName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const verificationStatus = profile?.verification_status || (user?.is_verified ? 'verified' : 'unverified');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      setErrorMsg('Please specify the document or degree certificate name.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.submitTeacherVerification({
        document_name: docName.trim(),
        notes: notes.trim(),
      });

      setSuccessMsg('Your verification documents were submitted. Our administrative verification desk will review them within 24–48 hours.');
      setDocName('');
      setNotes('');
      await refreshUser();
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${
            verificationStatus === 'verified'
              ? 'bg-emerald-50 text-emerald-600'
              : verificationStatus === 'pending'
              ? 'bg-amber-50 text-amber-600'
              : 'bg-blue-50 text-blue-600'
          }`}>
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
              <span>Educator Credential Verification</span>
              {verificationStatus === 'verified' && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Verified Active
                </span>
              )}
              {verificationStatus === 'pending' && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Under Admin Review
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verified educators gain trust badges, rank higher in parent searches, receive 4x more tuition requests, and qualify for high-school staff openings.
            </p>
          </div>
        </div>

        {/* Current status detail */}
        {profile?.verification_notes && (
          <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
            <span className="font-bold text-slate-900">Administrator Assessment: </span>
            {profile.verification_notes}
          </div>
        )}
      </div>

      {/* Submission Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Submit / Update Academic Credentials
        </h3>

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Certificate / Degree Document Reference
            </label>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. university_degree_masters_math.pdf or Roll No / Lic # 9812-B"
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-blue-600 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Issuing University / Board & Verification Details
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Provide institution name, graduation year, license number, or online verification URL..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-blue-600 text-xs resize-none"
            />
          </div>

          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2.5 text-[11px] text-blue-900">
            <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Verification Standards: </span>
              Tealign validates government photo ID, higher education degrees, teacher eligibility tests (CTET/STET/B.Ed), and coaching accolades.
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50"
          >
            {submitting ? <Clock className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{submitting ? 'Submitting Documents...' : 'Submit Credentials for Verification'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
