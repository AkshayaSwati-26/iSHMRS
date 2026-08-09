import React, { useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Star, MessageSquareHeart, Send, ShieldCheck } from 'lucide-react';

const PatientFeedback = () => {
  const [rating, setRating] = useState(5);
  const [npsScore, setNpsScore] = useState(9);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      const res = await api.post('/patient-portal/feedback', {
        rating,
        npsScore,
        comment,
        isAnonymous
      });

      if (res.data.status === 'success') {
        toast.success('Thank you for your feedback!');
        setSubmitted(true);
      }
    } catch (err) {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto font-sans">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Patient Care Feedback</h1>
        <p className="text-xs font-semibold text-slate-500">Your feedback helps us continually improve medical care and hospital services</p>
      </div>

      {submitted ? (
        <div className="glass-panel p-10 text-center rounded-3xl border border-teal-200 bg-teal-50/50 space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
            <MessageSquareHeart className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-teal-900">Feedback Received!</h2>
          <p className="text-xs text-teal-700 font-medium">Thank you for rating your care experience at iSHRMS.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-4 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-extrabold cursor-pointer hover:bg-teal-600"
          >
            Submit Another Feedback Entry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 bg-white space-y-6 shadow-xs">
          
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider">Overall Consultation Rating (1 to 5 Stars) *</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <Star className={`h-8 w-8 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* NPS Score */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider">How likely are you to recommend iSHRMS? (0 to 10 NPS)</label>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setNpsScore(num)}
                  className={`h-9 w-9 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    npsScore === num ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider">Comments / Suggestions</label>
            <textarea
              rows="3"
              placeholder="Tell us what went well or how we can improve our services..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500"
            />
          </div>

          {/* Anonymous checkbox */}
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
            />
            <span>Submit feedback anonymously</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-xl text-sm transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>{submitting ? 'Submitting...' : 'Submit Care Feedback'}</span>
          </button>

        </form>
      )}

    </div>
  );
};

export default PatientFeedback;
