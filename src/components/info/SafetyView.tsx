import React from 'react';
import { ShieldCheck, Lock, AlertTriangle, EyeOff, UserCheck, CheckCircle2 } from 'lucide-react';

export const SafetyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <div className="text-xs font-bold text-teal-600 uppercase tracking-wider">Safety & Integrity</div>
        <h1 className="text-3xl font-extrabold text-slate-900 font-['Outfit']">
          Trust & Child Protection Architecture
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          We treat the safety and academic integrity of learners, families, and educators as non-negotiable foundations of our marketplace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Credential Verification Protocol</h3>
          <p className="text-slate-600 leading-relaxed">
            Every educator claiming verified status submits degrees, diplomas, and identity documents to our administrative verification desk. We verify university accreditation, subject specialization, and teaching experience before issuing verified badges.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Student Privacy & Minor Protection</h3>
          <p className="text-slate-600 leading-relaxed">
            We deliberately avoid exposing unnecessary personal information of students or minors in public profiles. Direct contact details and physical addresses are only accessible between confirmed, mutually accepted parent-teacher connections.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">In-App Moderated Communications</h3>
          <p className="text-slate-600 leading-relaxed">
            Conversations conducted through the platform are monitored by community safety filters to prevent spam, abusive behavior, and inappropriate solicitations, ensuring a professional pedagogical atmosphere.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Proactive Reporting & Account Suspension</h3>
          <p className="text-slate-600 leading-relaxed">
            Any user can flag suspicious listings, unverified credentials, or policy violations. Platform administrators investigate reports and have immediate authority to suspend fraudulent accounts or remove unverified content.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-3">
        <h3 className="text-base font-bold font-['Outfit']">Zero-Tolerance Academic Integrity Policy</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Tealign prohibits exam cheating, ghostwriting, and impersonation. Our platform exists exclusively to connect students with passionate educators dedicated to genuine conceptual mastery, critical thinking, and sustained academic growth.
        </p>
      </div>
    </div>
  );
};
