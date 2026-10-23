import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  IoCloseOutline,
  IoSparklesOutline,
  IoDownloadOutline,
  IoCreateOutline,
  IoCheckmarkCircleOutline,
  IoShieldCheckmarkOutline,
  IoArrowForwardOutline,
  IoAlertCircleOutline
} from 'react-icons/io5';

const TailorCvModal = ({ isOpen, job, onClose, onApplyAssisted }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tailoredData, setTailoredData] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [tailoredCvId, setTailoredCvId] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Editable fields
  const [editedSummary, setEditedSummary] = useState('');
  const [editedSkills, setEditedSkills] = useState('');
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (!isOpen || !job) {
      setTailoredData(null);
      setPdfUrl('');
      setError('');
      setEditMode(false);
      return;
    }

    const fetchOrGenerateTailored = async () => {
      setLoading(true);
      setError('');
      try {
        const jobId = job._id || job.id || job.dedupeHash;
        
        // 1. Check if tailored CV already exists
        let existing = null;
        try {
          const res = await api.getTailoredCv(jobId);
          existing = res.tailoredCv;
        } catch (e) {
          // not generated yet
        }

        if (existing) {
          setTailoredData(existing.tailoredData);
          setPdfUrl(existing.pdfUrl);
          setTailoredCvId(existing._id);
          setEditedSummary(existing.tailoredData?.summary || '');
          setEditedSkills((existing.tailoredData?.highlightedSkills || []).join(', '));
        } else {
          // 2. Generate with Gemini
          const res = await api.tailorCv(jobId, null, {
            jobTitle: job.title,
            jobCompany: job.company,
            jobRequirements: job.requirements,
            jobSkills: job.skills
          });
          setTailoredData(res.tailoredCv?.tailoredData);
          setPdfUrl(res.pdfUrl);
          setTailoredCvId(res.tailoredCv?._id);
          setEditedSummary(res.tailoredCv?.tailoredData?.summary || '');
          setEditedSkills((res.tailoredCv?.tailoredData?.highlightedSkills || []).join(', '));
        }
      } catch (err) {
        console.error('Tailor CV error:', err);
        setError(err.message || 'Failed to tailor CV for this vacancy.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrGenerateTailored();
  }, [isOpen, job]);

  const handleSaveAndRegenerate = async (e) => {
    e.preventDefault();
    if (!job) return;
    setLoading(true);
    setError('');

    try {
      const skillsArray = editedSkills.split(',').map(s => s.trim()).filter(Boolean);
      const updatedPayload = {
        ...tailoredData,
        summary: editedSummary,
        highlightedSkills: skillsArray
      };

      const jobId = job._id || job.id || job.dedupeHash;
      const res = await api.tailorCv(jobId, updatedPayload, {
        jobTitle: job.title,
        jobCompany: job.company,
        jobRequirements: job.requirements,
        jobSkills: job.skills
      });

      setTailoredData(res.tailoredCv?.tailoredData);
      setPdfUrl(res.pdfUrl);
      setTailoredCvId(res.tailoredCv?._id);
      setEditMode(false);
    } catch (err) {
      setError(err.message || 'Failed to save and re-render PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `Tailored_CV_${job.company?.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-2 border-neutral-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-neutral-900 bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-lime-100 border border-neutral-900 rounded-xl text-neutral-900">
              <IoSparklesOutline className="w-5 h-5 text-lime-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-neutral-900 text-lg leading-tight">
                Tailor CV for {job.title}
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                {job.company} • {job.location || 'Sri Lanka'}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-3">
              <IoAlertCircleOutline className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-neutral-900" />
              <div className="text-center">
                <p className="font-bold text-neutral-800 text-sm">
                  Tailoring your experience with Gemini ATS engine...
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Enforcing strict anti-hallucination checks & compiling single-column PDF.
                </p>
              </div>
            </div>
          ) : tailoredData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Original vs Tailored Comparison */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Content Customization
                  </h4>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="text-xs font-bold text-neutral-700 hover:text-black flex items-center gap-1.5 cursor-pointer underline underline-offset-2"
                  >
                    <IoCreateOutline className="w-4 h-4" />
                    {editMode ? 'Cancel Edit' : 'Edit Content'}
                  </button>
                </div>

                {editMode ? (
                  <form onSubmit={handleSaveAndRegenerate} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Professional Summary
                      </label>
                      <textarea
                        value={editedSummary}
                        onChange={(e) => setEditedSummary(e.target.value)}
                        rows={4}
                        className="w-full text-xs p-3 border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 font-sans"
                        placeholder="Customize your professional summary..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Highlighted Skills (comma separated)
                      </label>
                      <input
                        type="text"
                        value={editedSkills}
                        onChange={(e) => setEditedSkills(e.target.value)}
                        className="w-full text-xs p-3 border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 font-mono"
                        placeholder="React, Node.js, TypeScript, etc."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-neutral-900 text-white font-extrabold rounded-xl hover:bg-neutral-800 transition-all text-xs cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
                    >
                      Save & Re-generate ATS PDF
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 text-xs">
                    {/* Summary Card */}
                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                      <span className="font-bold text-neutral-800 block">Reworded Summary</span>
                      <p className="text-neutral-600 leading-relaxed font-sans">
                        {tailoredData.summary || 'Summary aligned with job opening.'}
                      </p>
                    </div>

                    {/* Highlighted Skills */}
                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                      <span className="font-bold text-neutral-800 block">Prioritized Skills Match</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(tailoredData.highlightedSkills || tailoredData.skills || []).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-lime-100 text-lime-800 font-bold rounded-lg border border-lime-300 text-[11px]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Anti-Hallucination Badge */}
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                      <IoShieldCheckmarkOutline className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-[11px] font-medium">
                        Anti-hallucination verified: Only candidate's real skills & work history are highlighted.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: PDF Preview / Action Card */}
              <div className="flex flex-col border-2 border-neutral-900 rounded-xl p-5 bg-neutral-900 text-white justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-lime-400 uppercase tracking-widest">
                      ATS-Friendly Resume
                    </span>
                    <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 text-neutral-300">
                      Single-Column Standard
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                    Your resume has been compiled into an applicant tracking system (ATS) single-column template optimized for automated parsers and recruiters.
                  </p>

                  <div className="p-4 bg-neutral-800/80 rounded-xl border border-neutral-700 text-xs space-y-1.5">
                    <div className="text-neutral-400">Target Role: <strong className="text-white">{job.title}</strong></div>
                    <div className="text-neutral-400">Employer: <strong className="text-white">{job.company}</strong></div>
                    <div className="text-neutral-400">Format: <strong className="text-lime-400">PDF (A4)</strong></div>
                  </div>
                </div>

                <div className="space-y-3 pt-6">
                  {pdfUrl && (
                    <button
                      onClick={handleDownloadPdf}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-white text-neutral-950 font-extrabold rounded-xl hover:bg-neutral-100 transition-all text-xs cursor-pointer shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]"
                    >
                      <IoDownloadOutline className="w-4 h-4" />
                      Download Tailored PDF
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onClose();
                      if (onApplyAssisted) {
                        onApplyAssisted(job, tailoredCvId);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#a3e635] text-neutral-950 font-extrabold rounded-xl hover:bg-lime-400 transition-all text-xs cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <span>Proceed to Apply with this CV</span>
                    <IoArrowForwardOutline className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};

export default TailorCvModal;
