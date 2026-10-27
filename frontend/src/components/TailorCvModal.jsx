import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  IoCloseOutline,
  IoSparklesOutline,
  IoDownloadOutline,
  IoCreateOutline,
  IoShieldCheckmarkOutline,
  IoArrowForwardOutline,
  IoAlertCircleOutline,
  IoOpenOutline,
  IoCodeOutline,
  IoCopyOutline,
  IoEyeOutline,
  IoCheckmarkOutline,
  IoRefreshOutline,
  IoDocumentTextOutline,
  IoWarningOutline,
  IoGitCompareOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoArrowUndoOutline
} from 'react-icons/io5';

const TailorCvModal = ({ isOpen, job, onClose, onApplyAssisted }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Main data states
  const [originalModel, setOriginalModel] = useState(null);
  const [tailoredModel, setTailoredModel] = useState(null);
  const [appliedEdits, setAppliedEdits] = useState(null);
  const [hasDocx, setHasDocx] = useState(false);
  const [tailoredCvId, setTailoredCvId] = useState('');
  const [texSource, setTexSource] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');

  // UI modes & options
  const [activeTab, setActiveTab] = useState('diff'); // 'diff' | 'preview'
  const [activePreviewMode, setActivePreviewMode] = useState('pdf'); // 'pdf' | 'latex'
  const [onlyReorderSkills, setOnlyReorderSkills] = useState(false);
  const [copied, setCopied] = useState(false);

  // Granular interactive edits state:
  // Keyed by blockId -> { decision: 'accepted'|'rejected', currentText: string, isEditing: boolean, originalText: string, suggestedText: string, reason: string }
  const [editDecisions, setEditDecisions] = useState({});

  // Revoke object URL on unmount or before generating a new one
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        window.URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const loadPdfBlob = async (id) => {
    if (!id) return;
    try {
      const blobUrl = await api.getTailoredCvPdfBlob(id);
      setPdfBlobUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return blobUrl;
      });
    } catch (err) {
      console.warn('Could not load PDF blob preview:', err.message);
    }
  };

  // Helper to initialize editDecisions map from patch
  const initDecisionsFromPatch = (patch) => {
    const decisions = {};
    if (!patch) return decisions;

    // 1. Summary edit
    if (patch.summaryEdit && patch.summaryEdit.blockId) {
      decisions[patch.summaryEdit.blockId] = {
        blockId: patch.summaryEdit.blockId,
        type: 'summary',
        decision: 'accepted',
        currentText: patch.summaryEdit.tailoredText || patch.summaryEdit.originalText,
        originalText: patch.summaryEdit.originalText,
        suggestedText: patch.summaryEdit.tailoredText,
        reason: patch.summaryEdit.reason || 'Tailored to highlight relevant experience',
        isEditing: false
      };
    }

    // 2. Bullet edits
    if (Array.isArray(patch.bulletEdits)) {
      patch.bulletEdits.forEach((b) => {
        if (b.blockId) {
          decisions[b.blockId] = {
            blockId: b.blockId,
            type: 'bullet',
            decision: 'accepted',
            currentText: b.tailoredText || b.originalText,
            originalText: b.originalText,
            suggestedText: b.tailoredText,
            reason: b.reason || 'Aligned with job requirements',
            isEditing: false
          };
        }
      });
    }

    return decisions;
  };

  // Fetch or generate initial tailoring on modal open
  useEffect(() => {
    if (!isOpen || !job) {
      setOriginalModel(null);
      setTailoredModel(null);
      setAppliedEdits(null);
      setEditDecisions({});
      setPdfUrl('');
      setPdfBlobUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return '';
      });
      setTexSource('');
      setError('');
      setSuccessMsg('');
      setHasDocx(false);
      setOnlyReorderSkills(false);
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
          existing = res;
        } catch (e) {
          // Not generated yet
        }

        if (existing && existing.tailoredCv) {
          const tCv = existing.tailoredCv;
          setOriginalModel(existing.originalDocumentModel || tCv.originalDocumentModel);
          setTailoredModel(existing.tailoredDocumentModel || tCv.tailoredDocumentModel);
          setAppliedEdits(existing.appliedEdits || tCv.appliedEdits);
          setHasDocx(!!existing.hasDocx || !!tCv.hasDocx);
          setPdfUrl(tCv.pdfUrl);
          setTexSource(tCv.texSource || '');
          setTailoredCvId(tCv._id);

          setEditDecisions(initDecisionsFromPatch(existing.appliedEdits || tCv.appliedEdits));
          await loadPdfBlob(tCv._id);
        } else {
          // 2. Generate with Gemini Structure-Preserving Patch Engine
          const res = await api.tailorCv(jobId, null, {
            onlyReorderSkills: false
          }, {
            jobTitle: job.title,
            jobCompany: job.company,
            jobRequirements: job.requirements,
            jobSkills: job.skills
          });

          setOriginalModel(res.originalDocumentModel || res.tailoredCv?.originalDocumentModel);
          setTailoredModel(res.tailoredDocumentModel || res.tailoredCv?.tailoredDocumentModel);
          setAppliedEdits(res.appliedEdits || res.tailoredCv?.appliedEdits);
          setHasDocx(!!res.hasDocx);
          setPdfUrl(res.pdfUrl);
          setTexSource(res.texSource || res.tailoredCv?.texSource || '');
          const newId = res.tailoredCv?._id;
          setTailoredCvId(newId);

          setEditDecisions(initDecisionsFromPatch(res.appliedEdits || res.tailoredCv?.appliedEdits));
          if (newId) {
            await loadPdfBlob(newId);
          }
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

  // Handle regenerating with specific options (e.g. onlyReorderSkills toggle)
  const handleRegenerate = async (reorderSkillsOnly = onlyReorderSkills) => {
    if (!job) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const jobId = job._id || job.id || job.dedupeHash;
      const res = await api.tailorCv(jobId, null, {
        onlyReorderSkills: reorderSkillsOnly
      }, {
        jobTitle: job.title,
        jobCompany: job.company,
        jobRequirements: job.requirements,
        jobSkills: job.skills
      });

      setOriginalModel(res.originalDocumentModel || res.tailoredCv?.originalDocumentModel);
      setTailoredModel(res.tailoredDocumentModel || res.tailoredCv?.tailoredDocumentModel);
      setAppliedEdits(res.appliedEdits || res.tailoredCv?.appliedEdits);
      setHasDocx(!!res.hasDocx);
      setPdfUrl(res.pdfUrl);
      setTexSource(res.texSource || res.tailoredCv?.texSource || '');
      const newId = res.tailoredCv?._id;
      setTailoredCvId(newId);

      setEditDecisions(initDecisionsFromPatch(res.appliedEdits || res.tailoredCv?.appliedEdits));
      if (newId) {
        await loadPdfBlob(newId);
      }
      setSuccessMsg('Generated fresh tailored edits!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to regenerate tailored edits');
    } finally {
      setLoading(false);
    }
  };

  // Re-parse CV into DocumentModel
  const handleReparseCv = async () => {
    setReparsing(true);
    setError('');
    try {
      const res = await api.reparseCv();
      setOriginalModel(res.documentModel);
      setSuccessMsg('CV re-parsed into DocumentModel successfully! Refreshing tailoring...');
      await handleRegenerate();
    } catch (err) {
      setError(err.message || 'Failed to re-parse CV');
    } finally {
      setReparsing(false);
    }
  };

  // Accept a single edit
  const handleAcceptEdit = (blockId) => {
    setEditDecisions((prev) => {
      const item = prev[blockId];
      if (!item) return prev;
      return {
        ...prev,
        [blockId]: {
          ...item,
          decision: 'accepted',
          currentText: item.suggestedText,
          isEditing: false
        }
      };
    });
  };

  // Reject a single edit (revert to candidate's original verbatim text)
  const handleRejectEdit = (blockId) => {
    setEditDecisions((prev) => {
      const item = prev[blockId];
      if (!item) return prev;
      return {
        ...prev,
        [blockId]: {
          ...item,
          decision: 'rejected',
          currentText: item.originalText,
          isEditing: false
        }
      };
    });
  };

  // Toggle inline editing mode for a single edit
  const handleToggleInlineEdit = (blockId) => {
    setEditDecisions((prev) => {
      const item = prev[blockId];
      if (!item) return prev;
      return {
        ...prev,
        [blockId]: {
          ...item,
          isEditing: !item.isEditing
        }
      };
    });
  };

  // Change inline edited text
  const handleTextChange = (blockId, text) => {
    setEditDecisions((prev) => {
      const item = prev[blockId];
      if (!item) return prev;
      return {
        ...prev,
        [blockId]: {
          ...item,
          currentText: text,
          decision: 'accepted'
        }
      };
    });
  };

  // Reset ALL edits to candidate's original verbatim content
  const handleResetToOriginal = () => {
    setEditDecisions((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = {
          ...next[key],
          decision: 'rejected',
          currentText: next[key].originalText,
          isEditing: false
        };
      });
      return next;
    });
    setSuccessMsg('All edits reverted to your original CV text. Click "Apply & Re-compile" to update PDF.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Save current decisions and re-compile PDF / DOCX
  const handleSaveAndRecompile = async () => {
    if (!job) return;
    setSavingEdits(true);
    setError('');
    setSuccessMsg('');

    try {
      // Build tailored customEdits object
      const customBulletEdits = [];
      let customSummaryEdit = null;

      Object.values(editDecisions).forEach((ed) => {
        if (ed.type === 'summary') {
          if (ed.decision === 'accepted' || ed.currentText !== ed.originalText) {
            customSummaryEdit = {
              blockId: ed.blockId,
              originalText: ed.originalText,
              tailoredText: ed.currentText,
              reason: ed.reason
            };
          }
        } else if (ed.type === 'bullet') {
          if (ed.decision === 'accepted' || ed.currentText !== ed.originalText) {
            customBulletEdits.push({
              blockId: ed.blockId,
              originalText: ed.originalText,
              tailoredText: ed.currentText,
              reason: ed.reason
            });
          }
        }
      });

      const customEditsPayload = {
        summaryEdit: customSummaryEdit,
        bulletEdits: customBulletEdits,
        skillsReorder: appliedEdits?.skillsReorder || null,
        sectionReorder: appliedEdits?.sectionReorder || null,
        keywordsToWeave: appliedEdits?.keywordsToWeave || []
      };

      const jobId = job._id || job.id || job.dedupeHash;
      const res = await api.tailorCv(jobId, customEditsPayload, {
        onlyReorderSkills
      }, {
        jobTitle: job.title,
        jobCompany: job.company,
        jobRequirements: job.requirements,
        jobSkills: job.skills
      });

      setTailoredModel(res.tailoredDocumentModel || res.tailoredCv?.tailoredDocumentModel);
      setOriginalModel(res.originalDocumentModel || res.tailoredCv?.originalDocumentModel);
      setAppliedEdits(res.appliedEdits || res.tailoredCv?.appliedEdits);
      setPdfUrl(res.pdfUrl);
      setTexSource(res.texSource || res.tailoredCv?.texSource || '');
      setHasDocx(!!res.hasDocx);
      const newId = res.tailoredCv?._id;
      setTailoredCvId(newId);

      if (newId) {
        await loadPdfBlob(newId);
      }
      setSuccessMsg('Changes applied and PDF re-compiled in your original style!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to apply edits');
    } finally {
      setSavingEdits(false);
    }
  };

  // Download handlers
  const handleDownloadPdf = async () => {
    try {
      const identifier = tailoredCvId || job._id || job.id || job.dedupeHash;
      await api.downloadTailoredCvPdf(identifier, `${user?.lastname || 'Candidate'}-${job.company || 'Tailored'}-CV.pdf`);
    } catch (err) {
      setError(err.message || 'Failed to download tailored PDF');
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const identifier = tailoredCvId || job._id || job.id || job.dedupeHash;
      await api.downloadTailoredCvDocx(identifier, `${user?.lastname || 'Candidate'}-${job.company || 'Tailored'}-CV.docx`);
    } catch (err) {
      setError(err.message || 'Failed to download tailored DOCX');
    }
  };

  const handleDownloadTex = async () => {
    try {
      const identifier = tailoredCvId || job._id || job.id || job.dedupeHash;
      await api.downloadTailoredCvTex(identifier, `${user?.lastname || 'Candidate'}-${job.company || 'Tailored'}-CV.tex`);
    } catch (err) {
      setError(err.message || 'Failed to download .tex source');
    }
  };

  const handleOpenOverleaf = () => {
    if (!texSource) {
      setError('LaTeX source is not ready yet');
      return;
    }
    const form = document.createElement('form');
    form.action = 'https://www.overleaf.com/docs';
    form.method = 'POST';
    form.target = '_blank';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'snip';
    input.value = texSource;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const handleCopyTex = () => {
    if (!texSource) return;
    navigator.clipboard.writeText(texSource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !job) return null;

  const completeness = originalModel?.completenessCheck || null;
  const isCompletenessWarning = completeness && completeness.status === 'warning';
  const hasEdits = Object.keys(editDecisions).length > 0;
  const acceptedCount = Object.values(editDecisions).filter((e) => e.decision === 'accepted').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-2 border-neutral-900 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-neutral-900 bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-lime-100 border border-neutral-900 rounded-xl text-neutral-900">
              <IoSparklesOutline className="w-5 h-5 text-lime-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-neutral-900 text-base sm:text-lg leading-tight">
                  Tailor CV for {job.title}
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-lime-100 border border-neutral-900 rounded font-bold text-neutral-900">
                  Edit, Don't Regenerate
                </span>
              </div>
              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                <span className="text-xs text-neutral-500 font-medium">
                  {job.company} • {job.location || 'Sri Lanka'}
                </span>
                {(job.applyUrl || job.link) && (
                  <a
                    href={job.applyUrl || job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-lime-800 bg-lime-100 hover:bg-lime-200 px-2 py-0.5 rounded border border-lime-300 transition-colors shadow-sm"
                  >
                    <span>View Listing Portal</span>
                    <IoOpenOutline className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-neutral-200 p-0.5 rounded-xl border border-neutral-400">
              <button
                type="button"
                onClick={() => setActiveTab('diff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'diff'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-700 hover:text-neutral-900'
                }`}
              >
                <IoGitCompareOutline className="w-3.5 h-3.5" />
                <span>Side-by-Side Diff</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-700 hover:text-neutral-900'
                }`}
              >
                <IoEyeOutline className="w-3.5 h-3.5" />
                <span>Document Preview</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              <IoCloseOutline className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Completeness Warning Banner */}
        {isCompletenessWarning && (
          <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-300 text-amber-900 text-xs font-medium flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <IoWarningOutline className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Parser Completeness Notice:</strong> Some expected CV tokens may not have extracted perfectly ({completeness.missingTokens?.join(', ')}). Your original wording is kept intact, but you can re-parse if needed.
              </span>
            </div>
            <button
              type="button"
              onClick={handleReparseCv}
              disabled={reparsing}
              className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 border border-amber-400 text-amber-950 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <IoRefreshOutline className={`w-3.5 h-3.5 ${reparsing ? 'animate-spin' : ''}`} />
              <span>{reparsing ? 'Re-parsing...' : 'Re-parse CV'}</span>
            </button>
          </div>
        )}

        {/* Global Controls & Toggles Bar */}
        <div className="px-5 py-2.5 bg-neutral-100 border-b border-neutral-300 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Only Reorder Skills Toggle */}
            <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800 select-none">
              <input
                type="checkbox"
                checked={onlyReorderSkills}
                onChange={(e) => {
                  setOnlyReorderSkills(e.target.checked);
                  handleRegenerate(e.target.checked);
                }}
                className="w-4 h-4 rounded border-2 border-neutral-900 text-lime-600 focus:ring-lime-400"
              />
              <span>Only reorder skills, don't reword bullet points</span>
            </label>

            {hasEdits && (
              <span className="text-[11px] font-mono text-neutral-500">
                {acceptedCount} of {Object.keys(editDecisions).length} suggested edits accepted
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToOriginal}
              className="px-2.5 py-1 text-neutral-700 hover:text-black font-bold flex items-center gap-1 hover:bg-neutral-200 rounded-lg cursor-pointer transition-colors text-xs"
              title="Revert all changes back to your uploaded CV"
            >
              <IoArrowUndoOutline className="w-3.5 h-3.5" />
              <span>Reset to Original</span>
            </button>

            <button
              type="button"
              onClick={() => handleRegenerate()}
              disabled={loading}
              className="px-2.5 py-1 bg-white hover:bg-neutral-200 border border-neutral-400 font-bold text-neutral-800 rounded-lg cursor-pointer flex items-center gap-1 transition-colors text-xs"
            >
              <IoRefreshOutline className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Re-run Gemini</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndRecompile}
              disabled={savingEdits || loading}
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer text-xs transition-colors"
            >
              <IoCheckmarkOutline className="w-4 h-4 text-lime-400" />
              <span>{savingEdits ? 'Recompiling...' : 'Apply & Re-compile PDF'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border-2 border-rose-500 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2.5 shadow-sm">
              <IoAlertCircleOutline className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-sm">
              <IoCheckmarkCircleOutline className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-neutral-900" />
              <div className="text-center">
                <p className="font-extrabold text-neutral-900 text-sm">
                  Analyzing CV Structure & Applying Minimal Job Edits...
                </p>
                <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                  Preserving your exact section order, headings, dates, and employers while subtly tailoring keywords for {job.title}.
                </p>
              </div>
            </div>
          ) : activeTab === 'diff' ? (
            /* SIDE-BY-SIDE DIFF VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LEFT COLUMN: Candidate's Original CV */}
              <div className="border-2 border-neutral-300 rounded-xl p-4 bg-neutral-50/70 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-300">
                  <div className="flex items-center gap-2">
                    <IoDocumentTextOutline className="w-4 h-4 text-neutral-700" />
                    <span className="font-extrabold text-xs uppercase tracking-wider text-neutral-800">
                      Original Uploaded CV
                    </span>
                  </div>
                  <span className="text-[10px] bg-neutral-200 px-2 py-0.5 rounded font-mono text-neutral-600">
                    Verbatim Document Model
                  </span>
                </div>

                {/* Candidate Contact Block */}
                {originalModel?.contact && (
                  <div className="p-3 bg-white border border-neutral-200 rounded-lg text-xs space-y-1">
                    <p className="font-extrabold text-neutral-900 text-sm">{originalModel.contact.name || `${user?.firstname} ${user?.lastname}`}</p>
                    <div className="text-neutral-500 flex flex-wrap gap-2 text-[11px]">
                      {originalModel.contact.email && <span>{originalModel.contact.email}</span>}
                      {originalModel.contact.phone && <span>• {originalModel.contact.phone}</span>}
                      {originalModel.contact.location && <span>• {originalModel.contact.location}</span>}
                    </div>
                  </div>
                )}

                {/* Render Sections in Original Sequence */}
                {(originalModel?.sections || []).map((sec, secIdx) => (
                  <div key={secIdx} className="p-3 bg-white border border-neutral-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-1">
                      <span className="font-bold text-xs text-neutral-900 uppercase">
                        {sec.heading}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {sec.type}
                      </span>
                    </div>

                    {/* Section Blocks */}
                    {sec.type === 'skills' ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(sec.rawItems || []).map((sk, skIdx) => (
                          <span
                            key={skIdx}
                            className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded text-[11px]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    ) : sec.type === 'experience' || sec.type === 'projects' ? (
                      <div className="space-y-3 pt-1">
                        {(sec.entries || []).map((entry, eIdx) => (
                          <div key={eIdx} className="space-y-1 text-xs">
                            <div className="flex justify-between font-bold text-neutral-900 text-[11px]">
                              <span>{entry.title || entry.name} {entry.company && `• ${entry.company}`}</span>
                              <span className="text-neutral-500 font-mono font-normal">{entry.dates}</span>
                            </div>
                            <ul className="space-y-1 pl-3 text-neutral-600 text-[11px] list-disc">
                              {(entry.bullets || []).map((b, bIdx) => (
                                <li key={bIdx} className="leading-snug">
                                  {b.text || b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-xs text-neutral-700">
                        {(sec.blocks || []).map((blk, blkIdx) => (
                          <p key={blkIdx} className="leading-relaxed text-[11px]">
                            {blk.text || blk}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* RIGHT COLUMN: Tailored CV with Interactive Diff Edits */}
              <div className="border-2 border-neutral-900 rounded-xl p-4 bg-white space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b-2 border-neutral-900">
                  <div className="flex items-center gap-2">
                    <IoSparklesOutline className="w-4 h-4 text-lime-600" />
                    <span className="font-extrabold text-xs uppercase tracking-wider text-neutral-900">
                      Tailored Candidate CV
                    </span>
                  </div>
                  <span className="text-[10px] bg-lime-100 border border-lime-300 text-lime-900 font-bold px-2 py-0.5 rounded">
                    Surgical Edits Active
                  </span>
                </div>

                {/* Candidate Contact Block */}
                {tailoredModel?.contact && (
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs space-y-1">
                    <p className="font-extrabold text-neutral-900 text-sm">{tailoredModel.contact.name || `${user?.firstname} ${user?.lastname}`}</p>
                    <div className="text-neutral-500 flex flex-wrap gap-2 text-[11px]">
                      {tailoredModel.contact.email && <span>{tailoredModel.contact.email}</span>}
                      {tailoredModel.contact.phone && <span>• {tailoredModel.contact.phone}</span>}
                      {tailoredModel.contact.location && <span>• {tailoredModel.contact.location}</span>}
                    </div>
                  </div>
                )}

                {/* Render Sections in Tailored Sequence */}
                {(tailoredModel?.sections || []).map((sec, secIdx) => {
                  return (
                    <div key={secIdx} className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
                        <span className="font-bold text-xs text-neutral-900 uppercase">
                          {sec.heading}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {sec.type}
                        </span>
                      </div>

                      {/* Skills Section with Highlighted Order */}
                      {sec.type === 'skills' ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(sec.rawItems || []).map((sk, skIdx) => {
                              const isPrioritized = skIdx < 5;
                              return (
                                <span
                                  key={skIdx}
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    isPrioritized
                                      ? 'bg-lime-200 border border-lime-400 text-lime-950'
                                      : 'bg-white border border-neutral-300 text-neutral-800'
                                  }`}
                                >
                                  {sk}
                                </span>
                              );
                            })}
                          </div>
                          {appliedEdits?.skillsReorder?.rationale && (
                            <p className="text-[10px] text-neutral-500 italic">
                              Reordered to prioritize vacancy matches: {appliedEdits.skillsReorder.rationale}
                            </p>
                          )}
                        </div>
                      ) : sec.type === 'experience' || sec.type === 'projects' ? (
                        /* Experience / Projects Entries */
                        <div className="space-y-3 pt-1">
                          {(sec.entries || []).map((entry, eIdx) => (
                            <div key={eIdx} className="space-y-1.5 text-xs">
                              <div className="flex justify-between font-bold text-neutral-900 text-[11px]">
                                <span>{entry.title || entry.name} {entry.company && `• ${entry.company}`}</span>
                                <span className="text-neutral-500 font-mono font-normal">{entry.dates}</span>
                              </div>
                              <div className="space-y-2 pl-1">
                                {(entry.bullets || []).map((b, bIdx) => {
                                  const blockId = b.id || `blk_${sec.heading}_${eIdx}_b_${bIdx}`;
                                  const edit = editDecisions[blockId];
                                  const isEdited = edit && edit.suggestedText !== edit.originalText;
                                  const isAccepted = edit?.decision === 'accepted';

                                  return (
                                    <div
                                      key={bIdx}
                                      className={`p-2 rounded-lg transition-all ${
                                        isEdited
                                          ? isAccepted
                                            ? 'bg-lime-50 border-2 border-lime-400 shadow-sm'
                                            : 'bg-neutral-100 border border-neutral-300'
                                          : 'bg-white border border-neutral-200'
                                      }`}
                                    >
                                      {/* Bullet Text or Inline Edit */}
                                      {edit?.isEditing ? (
                                        <div className="space-y-1.5">
                                          <textarea
                                            value={edit.currentText}
                                            onChange={(e) => handleTextChange(blockId, e.target.value)}
                                            rows={2}
                                            className="w-full text-xs p-2 border border-neutral-900 rounded font-sans focus:outline-none focus:ring-1 focus:ring-lime-500"
                                          />
                                          <div className="flex justify-end gap-1">
                                            <button
                                              type="button"
                                              onClick={() => handleToggleInlineEdit(blockId)}
                                              className="px-2 py-0.5 text-[11px] bg-neutral-900 text-white rounded font-bold"
                                            >
                                              Done Editing
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-neutral-800 leading-snug">
                                          {edit ? edit.currentText : (b.text || b)}
                                        </p>
                                      )}

                                      {/* Interactive Action Pill Buttons */}
                                      {isEdited && (
                                        <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-neutral-200/80 text-[10px]">
                                          <span className="text-neutral-500 italic max-w-[200px] truncate" title={edit.reason}>
                                            {edit.reason}
                                          </span>
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => handleAcceptEdit(blockId)}
                                              className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                                isAccepted
                                                  ? 'bg-lime-600 text-white'
                                                  : 'bg-lime-100 text-lime-900 hover:bg-lime-200'
                                              }`}
                                            >
                                              <IoCheckmarkOutline className="w-3 h-3" />
                                              <span>{isAccepted ? 'Accepted' : 'Accept'}</span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => handleRejectEdit(blockId)}
                                              className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                                !isAccepted
                                                  ? 'bg-rose-600 text-white'
                                                  : 'bg-neutral-200 text-neutral-700 hover:bg-rose-100 hover:text-rose-800'
                                              }`}
                                            >
                                              <IoCloseOutline className="w-3 h-3" />
                                              <span>{!isAccepted ? 'Rejected' : 'Reject'}</span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => handleToggleInlineEdit(blockId)}
                                              className="px-1.5 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded font-bold cursor-pointer"
                                              title="Inline edit this bullet"
                                            >
                                              <IoCreateOutline className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Summary or Generic Blocks */
                        <div className="space-y-2 text-xs">
                          {(sec.blocks || []).map((blk, blkIdx) => {
                            const blockId = blk.id || `blk_${sec.heading}_${blkIdx}`;
                            const edit = editDecisions[blockId];
                            const isEdited = edit && edit.suggestedText !== edit.originalText;
                            const isAccepted = edit?.decision === 'accepted';

                            return (
                              <div
                                key={blkIdx}
                                className={`p-2 rounded-lg transition-all ${
                                  isEdited
                                    ? isAccepted
                                      ? 'bg-lime-50 border-2 border-lime-400'
                                      : 'bg-neutral-100 border border-neutral-300'
                                    : 'bg-white border border-neutral-200'
                                }`}
                              >
                                {edit?.isEditing ? (
                                  <div className="space-y-1.5">
                                    <textarea
                                      value={edit.currentText}
                                      onChange={(e) => handleTextChange(blockId, e.target.value)}
                                      rows={3}
                                      className="w-full text-xs p-2 border border-neutral-900 rounded font-sans focus:outline-none"
                                    />
                                    <div className="flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleInlineEdit(blockId)}
                                        className="px-2 py-0.5 text-[11px] bg-neutral-900 text-white rounded font-bold"
                                      >
                                        Done Editing
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-neutral-800 leading-relaxed">
                                    {edit ? edit.currentText : (blk.text || blk)}
                                  </p>
                                )}

                                {isEdited && (
                                  <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-neutral-200/80 text-[10px]">
                                    <span className="text-neutral-500 italic max-w-[200px] truncate">
                                      {edit.reason}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleAcceptEdit(blockId)}
                                        className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                                          isAccepted ? 'bg-lime-600 text-white' : 'bg-lime-100 text-lime-900'
                                        }`}
                                      >
                                        <IoCheckmarkOutline className="w-3 h-3" />
                                        <span>Accept</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRejectEdit(blockId)}
                                        className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                                          !isAccepted ? 'bg-rose-600 text-white' : 'bg-neutral-200 text-neutral-700'
                                        }`}
                                      >
                                        <IoCloseOutline className="w-3 h-3" />
                                        <span>Reject</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleInlineEdit(blockId)}
                                        className="px-1.5 py-0.5 bg-neutral-200 text-neutral-700 rounded font-bold"
                                      >
                                        <IoCreateOutline className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Anti-Hallucination & Fidelity Guarantee Badge */}
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-400 rounded-lg text-emerald-900">
                  <IoShieldCheckmarkOutline className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-[11px] font-semibold">
                    100% Fidelity Guarantee: Section order, headings, dates, and employers match your uploaded CV.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* PREVIEW TAB: PDF AND LATEX */
            <div className="border-2 border-neutral-900 rounded-2xl p-4 bg-neutral-900 text-white space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-700">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePreviewMode('pdf')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activePreviewMode === 'pdf'
                        ? 'bg-[#a3e635] text-neutral-950'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <IoEyeOutline className="w-3.5 h-3.5" />
                    <span>Single-Column PDF Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewMode('latex')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activePreviewMode === 'latex'
                        ? 'bg-[#a3e635] text-neutral-950'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <IoCodeOutline className="w-3.5 h-3.5" />
                    <span>Dynamic LaTeX Source (.tex)</span>
                  </button>
                </div>

                <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 text-lime-400 font-mono">
                  Original Order Preserved
                </span>
              </div>

              {activePreviewMode === 'pdf' ? (
                <div className="rounded-xl overflow-hidden border border-neutral-700 bg-white h-[500px]">
                  {pdfBlobUrl || pdfUrl ? (
                    <iframe
                      src={pdfBlobUrl || pdfUrl}
                      className="w-full h-full border-0"
                      title="Tailored Resume Preview"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-neutral-400 bg-neutral-800">
                      Generating PDF in candidate's original structure...
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-[500px]">
                  <button
                    type="button"
                    onClick={handleCopyTex}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copied ? (
                      <>
                        <IoCheckmarkOutline className="w-3.5 h-3.5 text-lime-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <IoCopyOutline className="w-3.5 h-3.5" />
                        <span>Copy .tex</span>
                      </>
                    )}
                  </button>
                  <pre className="h-full overflow-y-auto p-4 text-[11px] font-mono bg-neutral-950 text-neutral-300 rounded-xl border border-neutral-800 leading-relaxed whitespace-pre-wrap select-all">
                    {texSource || '% Compiling candidate LaTeX source...'}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Actions and Downloads */}
        <div className="px-5 py-3.5 border-t-2 border-neutral-900 bg-neutral-50 flex items-center justify-between flex-wrap gap-2">
          {/* Download Options */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="py-2 px-3 bg-white hover:bg-neutral-100 border-2 border-neutral-900 text-neutral-950 font-extrabold rounded-xl transition-all text-xs cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
            >
              <IoDownloadOutline className="w-4 h-4 flex-shrink-0" />
              <span>Download PDF</span>
            </button>

            {/* Download DOCX (If uploaded format was docx) */}
            {hasDocx && (
              <button
                type="button"
                onClick={handleDownloadDocx}
                className="py-2 px-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-900 text-blue-950 font-extrabold rounded-xl transition-all text-xs cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
                title="Download in-place edited native DOCX preserving 100% of Word formatting"
              >
                <IoDocumentTextOutline className="w-4 h-4 flex-shrink-0 text-blue-700" />
                <span>Download DOCX</span>
              </button>
            )}

            {/* Download .tex */}
            <button
              type="button"
              onClick={handleDownloadTex}
              className="py-2 px-3 bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 text-neutral-800 font-bold rounded-xl transition-all text-xs cursor-pointer flex items-center gap-1.5"
            >
              <IoCodeOutline className="w-4 h-4 flex-shrink-0" />
              <span>Download .tex</span>
            </button>

            {/* Open in Overleaf */}
            <button
              type="button"
              onClick={handleOpenOverleaf}
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition-all text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Open project directly in Overleaf online editor"
            >
              <IoOpenOutline className="w-4 h-4 flex-shrink-0" />
              <span>In Overleaf</span>
            </button>
          </div>

          {/* Apply Assisted CTA */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onApplyAssisted) {
                onApplyAssisted(job, tailoredCvId);
              }
            }}
            className="py-2.5 px-5 bg-[#a3e635] text-neutral-950 font-extrabold rounded-xl hover:bg-lime-400 transition-all text-xs cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
          >
            <span>Proceed to Apply with this Tailored CV</span>
            <IoArrowForwardOutline className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TailorCvModal;
