import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoOpenOutline,
  IoMailOutline,
  IoCloseOutline,
  IoDocumentTextOutline,
  IoInformationCircleOutline
} from 'react-icons/io5';

const AutoApplyModal = ({ isOpen, job, tailoredCvId = null, onClose, onApplySuccess }) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [appliedApplication, setAppliedApplication] = useState(null);
  const [mailtoUrl, setMailtoUrl] = useState(null);

  if (!isOpen || !job) return null;

  const handleConfirmApply = async () => {
    setSubmitting(true);
    setError('');

    try {
      const jobId = job._id || job.id || job.dedupeHash;
      const res = await api.applyAssisted({
        jobId,
        tailoredCvId,
        notes: notes || `Applied to ${job.title} at ${job.company}`,
        title: job.title,
        company: job.company,
        requirements: job.requirements,
        salary: job.salary,
        location: job.location,
        mode: job.mode,
        applyUrl: job.applyUrl || job.link
      });

      setAppliedApplication(res.application);
      if (res.mailtoUrl) {
        setMailtoUrl(res.mailtoUrl);
      }

      // Open external job application portal in a new tab
      const targetUrl = res.applyUrl || job.applyUrl || job.link;
      if (targetUrl && targetUrl.startsWith('http')) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }

      if (onApplySuccess) {
        onApplySuccess(res.application);
      }
    } catch (err) {
      console.error('Assisted apply error:', err);
      setError(err.message || 'Failed to record assisted application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-2 border-neutral-900 rounded-2xl w-full max-w-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-neutral-900 bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-lime-100 border border-neutral-900 rounded-xl text-neutral-900">
              <IoOpenOutline className="w-5 h-5 text-lime-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-neutral-900 text-base leading-tight">
                Assisted Job Application
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                {job.title} • {job.company}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            <IoCloseOutline className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <IoAlertCircleOutline className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {appliedApplication ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 border-2 border-neutral-900 rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <IoCheckmarkCircleOutline className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-neutral-900 text-base">
                  Application Logged to Your Tracker!
                </h4>
                <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                  Status set to <strong>"Applied"</strong>. The target vacancy portal has been opened in a new tab for you to submit your final credentials.
                </p>
              </div>

              {mailtoUrl && (
                <div className="pt-2">
                  <a
                    href={mailtoUrl}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white font-extrabold rounded-xl text-xs hover:bg-neutral-800 transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
                  >
                    <IoMailOutline className="w-4 h-4 text-lime-400" />
                    <span>Send Pre-filled Cover Email</span>
                  </a>
                </div>
              )}

              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-neutral-100 text-neutral-800 font-bold rounded-xl text-xs hover:bg-neutral-200 transition-all cursor-pointer border border-neutral-300"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Assisted Apply Information Notice */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-start gap-3 text-xs text-neutral-600 leading-relaxed font-sans">
                <IoInformationCircleOutline className="w-5 h-5 text-neutral-800 flex-shrink-0 mt-0.5" />
                <span>
                  Third-party job portals require candidate sign-in. Job Tracker streamlines this by generating your tailored resume, pre-filling your pipeline record, and launching the official application portal directly.
                </span>
              </div>

              {/* Target Job Summary */}
              <div className="p-4 border-2 border-neutral-900 rounded-xl space-y-2 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs">
                <div className="flex justify-between items-center text-neutral-500 font-mono text-[11px]">
                  <span>Source: {job.source?.toUpperCase() || 'EXTERNAL'}</span>
                  <span>{job.mode || 'hybrid'}</span>
                </div>
                <div className="font-extrabold text-neutral-900 text-sm">
                  {job.title}
                </div>
                <div className="text-neutral-600">
                  {job.company} • {job.location || 'Sri Lanka'}
                </div>
                {tailoredCvId && (
                  <div className="flex items-center gap-1.5 text-lime-700 font-bold pt-1">
                    <IoDocumentTextOutline className="w-4 h-4" />
                    <span>Tailored ATS Resume will be linked</span>
                  </div>
                )}
              </div>

              {/* Notes Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700">
                  Application Notes / Follow-up Strategy
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-3 border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 font-sans"
                  placeholder="e.g. Applied via official recruiter form; follow up with hiring manager next Tuesday."
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-neutral-600 font-bold text-xs hover:text-neutral-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApply}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#a3e635] text-neutral-950 font-extrabold border-2 border-neutral-900 rounded-xl hover:bg-lime-400 transition-all text-xs cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Recording Application...' : 'Open Portal & Track Application'}
                  <IoOpenOutline className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default AutoApplyModal;
