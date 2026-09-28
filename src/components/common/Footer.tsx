import React from 'react';
import { ShieldCheck, CheckCircle2, Lock, HeartHandshake } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-10 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-10 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white text-sm">Strict Credential Verification</div>
              <div className="text-slate-400 mt-1 leading-relaxed">
                Degrees, experience certificates, and background checks reviewed before verified badges are issued.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white text-sm">Schedule-Accurate Matching</div>
              <div className="text-slate-400 mt-1 leading-relaxed">
                Teachers maintain exact day and time availability slots to eliminate back-and-forth scheduling delays.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white text-sm">Student Safety & Privacy</div>
              <div className="text-slate-400 mt-1 leading-relaxed">
                Contact information is shielded until parents or institutes approve tuition requests.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white text-sm">Verified Reviews Only</div>
              <div className="text-slate-400 mt-1 leading-relaxed">
                Feedback can only be posted after confirmed hiring interactions and completed tutoring modules.
              </div>
            </div>
          </div>
        </div>

        {/* Directory & Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-b border-slate-800">
          <div>
            <div className="text-white font-semibold text-sm mb-3">Find Educators</div>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={() => onNavigate('teachers')} className="hover:text-white transition-colors">Mathematics Specialists</button></li>
              <li><button onClick={() => onNavigate('teachers')} className="hover:text-white transition-colors">Physics & Chemistry Tutors</button></li>
              <li><button onClick={() => onNavigate('teachers')} className="hover:text-white transition-colors">English & IELTS Trainers</button></li>
              <li><button onClick={() => onNavigate('teachers')} className="hover:text-white transition-colors">Computer Science & AI Mentors</button></li>
              <li><button onClick={() => onNavigate('teachers')} className="hover:text-white transition-colors">IB Diploma & Cambridge Coaches</button></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold text-sm mb-3">Schools & Academies</div>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={() => onNavigate('jobs')} className="hover:text-white transition-colors">Browse Vacancies</button></li>
              <li><button onClick={() => onNavigate('jobs')} className="hover:text-white transition-colors">Senior Secondary Faculty</button></li>
              <li><button onClick={() => onNavigate('jobs')} className="hover:text-white transition-colors">Olympiad & Entrance Coaching</button></li>
              <li><button onClick={() => onNavigate('jobs')} className="hover:text-white transition-colors">Part-time & Visiting Faculty</button></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold text-sm mb-3">Teaching Modes</div>
            <ul className="space-y-2 text-slate-400">
              <li><span className="text-slate-300">Home Tuition (Student’s Residence)</span></li>
              <li><span className="text-slate-300">Teacher’s Home Studio</span></li>
              <li><span className="text-slate-300">Coaching Institute Sessions</span></li>
              <li><span className="text-slate-300">K-12 Private School Staffing</span></li>
              <li><span className="text-slate-300">1-on-1 Interactive Online Class</span></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold text-sm mb-3">Governance & Trust</div>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={() => onNavigate('safety')} className="hover:text-white transition-colors">Verification Standards</button></li>
              <li><button onClick={() => onNavigate('safety')} className="hover:text-white transition-colors">Child Safety Policy</button></li>
              <li><button onClick={() => onNavigate('how-it-works')} className="hover:text-white transition-colors">Platform Operating Guidelines</button></li>
              <li><button onClick={() => onNavigate('admin')} className="hover:text-white transition-colors">Platform Administration</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © 2026 Tealign Inc. Dedicated to educational excellence, teacher empowerment, and verified student safety.
          </div>
          <div className="flex items-center gap-4">
            <span>Enterprise Teacher Marketplace</span>
            <span>·</span>
            <span>Relational Scheduling Engine</span>
            <span>·</span>
            <span>Verified Credentials</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
