import React, { useState } from 'react';
import { Modal } from '../common/Modal.tsx';
import { api } from '../../services/api.ts';
import { Star, Send, AlertCircle } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [subject, setSubject] = useState<string>('Tuition');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg('Please write a constructive review.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.createReview({
        teacher_id: teacherId,
        rating,
        comment: comment.trim(),
        subject,
        interaction_type: 'parent_request',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leave an Educator Review"
      subtitle={`Review your verified learning experience with ${teacherName}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Star Rating Selector */}
        <div>
          <label className="block font-semibold text-slate-700 mb-2">Overall Rating</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className="p-1 text-slate-300 hover:text-amber-400 transition-colors focus:outline-none"
              >
                <Star
                  className={`w-7 h-7 ${
                    star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
            <span className="font-bold text-slate-800 text-sm ml-2">{rating} out of 5 stars</span>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Subject Covered</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Grade 10 Mathematics, Physics"
            required
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 font-medium"
          />
        </div>

        {/* Feedback Comment */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Written Feedback</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="How did the teacher help improve conceptual clarity, problem solving, or test scores?"
            required
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-600 resize-none leading-relaxed"
          />
        </div>

        <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          Reviews are checked by Tealign community guidelines to maintain academic integrity.
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting...' : 'Post Review'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
