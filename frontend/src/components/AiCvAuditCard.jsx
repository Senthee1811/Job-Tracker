import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  IoSparklesOutline,
  IoDownloadOutline,
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoAddOutline,
  IoCheckmarkOutline,
  IoDocumentTextOutline
} from 'react-icons/io5';

const AiCvAuditCard = ({ activeCv, onAddSkill, userSkills = [] }) => {
  const [report, setReport] = useState(activeCv?.analysisReport || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [addedKeywords, setAddedKeywords] = useState([]);

  useEffect(() => {
    if (activeCv?.analysisReport?.overallScore) {
      setReport(activeCv.analysisReport);
    }
  }, [activeCv]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const res = await api.analyzeCv(activeCv?._id);
      if (res.analysisReport) {
        setReport(res.analysisReport);
      }
    } catch (err) {
      setError(err.message || 'Failed to complete AI CV audit');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setError('');
    try {
      await api.downloadCvAnalysisPdf(activeCv?._id || 'active');
    } catch (err) {
      setError(err.message || 'Failed to download analysis PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleAddKeywordToSkills = (kw) => {
    if (onAddSkill) {
      onAddSkill(kw);
      setAddedKeywords((prev) => [...prev, kw]);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-300';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-300';
    return 'text-rose-600 bg-rose-50 border-rose-300';
  };

  const getBarColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className='bg-white border-2 border-neutral-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-neutral-900 pb-4'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-xl bg-lime-100 border-2 border-neutral-900 flex items-center justify-center text-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0'>
            <IoSparklesOutline className='w-5 h-5 text-neutral-900' />
          </div>
          <div>
            <h4 className='font-extrabold text-neutral-900 text-base'>
              AI CV Audit & ATS Readiness
            </h4>
            <p className='text-xs text-neutral-500'>
              Instant 0–100 scoring, ATS readability, quantifiable impact metrics, and downloadable PDF report.
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2 flex-wrap'>
          {report?.overallScore && (
            <button
              type='button'
              onClick={handleDownloadPdf}
              disabled={downloading}
              className='px-3.5 py-2 bg-white text-neutral-900 font-extrabold text-xs border-2 border-neutral-900 rounded-xl hover:bg-neutral-50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50'
              title='Download professional audit report in PDF'
            >
              <IoDownloadOutline className='w-4 h-4' />
              <span>{downloading ? 'Downloading...' : 'Download PDF Report'}</span>
            </button>
          )}

          <button
            type='button'
            onClick={handleAnalyze}
            disabled={analyzing}
            className='px-4 py-2 bg-[#a3e635] text-neutral-950 font-extrabold text-xs border-2 border-neutral-900 rounded-xl hover:bg-lime-400 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50'
          >
            <IoRefreshOutline className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Auditing Resume...' : report?.overallScore ? 'Re-run AI Audit' : 'Run AI CV Audit'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className='bg-rose-50 border-2 border-rose-500 text-rose-700 text-xs font-bold p-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'>
          {error}
        </div>
      )}

      {/* Analysis Empty State */}
      {!report?.overallScore && !analyzing && (
        <div className='p-8 text-center bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-xl space-y-3'>
          <div className='w-12 h-12 mx-auto rounded-full bg-lime-100 border border-lime-300 flex items-center justify-center text-lime-800'>
            <IoDocumentTextOutline className='w-6 h-6' />
          </div>
          <div className='space-y-1'>
            <h5 className='font-bold text-neutral-800 text-sm'>No AI Audit Generated Yet</h5>
            <p className='text-xs text-neutral-500 max-w-md mx-auto'>
              Click <strong>"Run AI CV Audit"</strong> to generate your ATS score, discover missing keywords, and download your branded analysis report.
            </p>
          </div>
        </div>
      )}

      {/* Analyzing Progress State */}
      {analyzing && (
        <div className='p-8 text-center bg-lime-50/50 border-2 border-neutral-900 rounded-xl space-y-3 animate-pulse'>
          <div className='inline-block animate-spin rounded-full h-8 w-8 border-4 border-neutral-200 border-t-neutral-900' />
          <p className='text-xs font-extrabold text-neutral-800'>
            Evaluating ATS formatting, quantifiable impact metrics, and competitive role alignment...
          </p>
        </div>
      )}

      {/* Report Results */}
      {report?.overallScore && !analyzing && (
        <div className='space-y-6'>
          {/* 1. Scorecard Banner */}
          <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
            {/* Overall Score */}
            <div className={`md:col-span-2 p-5 border-2 border-neutral-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between ${getScoreColor(report.overallScore)}`}>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-black uppercase tracking-wider text-neutral-700'>
                  Overall Market Readiness
                </span>
                <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-neutral-300 text-neutral-800'>
                  0–100 Scale
                </span>
              </div>
              <div className='my-3 flex items-baseline gap-2'>
                <span className='text-5xl font-black tracking-tight text-neutral-900'>
                  {report.overallScore}
                </span>
                <span className='text-base font-bold text-neutral-500'>/ 100</span>
              </div>
              <p className='text-xs text-neutral-700 font-medium leading-relaxed'>
                {report.summary || 'Strong technical foundation with competitive local and remote positioning.'}
              </p>
            </div>

            {/* Sub-scores Grid */}
            <div className='md:col-span-3 p-5 bg-neutral-50 border-2 border-neutral-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-around gap-3'>
              {[
                { label: 'ATS Parsability & Format', score: report.atsScore || 75 },
                { label: 'Impact & Quantifiable Metrics', score: report.impactScore || 70 },
                { label: 'Brevity & Conciseness', score: report.brevityScore || 80 },
                { label: 'Technical Depth & Relevance', score: report.skillsScore || 75 }
              ].map((sub, i) => (
                <div key={i} className='space-y-1 text-xs'>
                  <div className='flex justify-between font-bold text-neutral-700'>
                    <span>{sub.label}</span>
                    <span className='font-mono'>{sub.score}%</span>
                  </div>
                  <div className='w-full bg-neutral-200 h-2 rounded-full overflow-hidden border border-neutral-300'>
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getBarColor(sub.score)}`}
                      style={{ width: `${sub.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Strengths and Areas for Enhancement */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Strengths */}
            <div className='p-4 bg-emerald-50/50 border-2 border-neutral-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2.5'>
              <div className='flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider'>
                <IoCheckmarkCircleOutline className='w-4 h-4 text-emerald-600' />
                <span>Key Competitive Advantages</span>
              </div>
              <ul className='space-y-1.5 text-xs text-neutral-700'>
                {(report.strengths || []).map((s, idx) => (
                  <li key={idx} className='flex items-start gap-2'>
                    <span className='text-emerald-600 font-bold'>+</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses / Gaps */}
            <div className='p-4 bg-rose-50/50 border-2 border-neutral-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2.5'>
              <div className='flex items-center gap-2 text-rose-800 font-extrabold text-xs uppercase tracking-wider'>
                <IoAlertCircleOutline className='w-4 h-4 text-rose-600' />
                <span>Areas for Enhancement</span>
              </div>
              <ul className='space-y-1.5 text-xs text-neutral-700'>
                {(report.weaknesses || []).map((w, idx) => (
                  <li key={idx} className='flex items-start gap-2'>
                    <span className='text-rose-600 font-bold'>!</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3. Missing High Demand Keywords */}
          {report.missingKeywords?.length > 0 && (
            <div className='p-4 bg-neutral-50 border-2 border-neutral-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2.5'>
              <div className='flex items-center justify-between flex-wrap gap-2'>
                <span className='font-extrabold text-xs text-neutral-800 uppercase tracking-wider'>
                  Missing In-Demand Keywords (Click to add to your skills checklist)
                </span>
                <span className='text-[10px] text-neutral-500 font-medium'>
                  Commonly scanned by tech employers
                </span>
              </div>
              <div className='flex flex-wrap gap-2'>
                {report.missingKeywords.map((kw, idx) => {
                  const isAdded = userSkills.includes(kw) || addedKeywords.includes(kw);
                  return (
                    <button
                      key={idx}
                      type='button'
                      onClick={() => !isAdded && handleAddKeywordToSkills(kw)}
                      disabled={isAdded}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        isAdded
                          ? 'bg-neutral-200 border-neutral-300 text-neutral-600 cursor-default'
                          : 'bg-white border-neutral-900 text-neutral-900 hover:bg-[#a3e635] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer'
                      }`}
                    >
                      <span>{kw}</span>
                      {isAdded ? (
                        <IoCheckmarkOutline className='w-3.5 h-3.5 text-emerald-600' />
                      ) : (
                        <IoAddOutline className='w-3.5 h-3.5' />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Actionable Step-by-Step Suggestions */}
          {report.actionableSuggestions?.length > 0 && (
            <div className='space-y-3'>
              <h5 className='font-extrabold text-neutral-800 text-xs uppercase tracking-wider'>
                Actionable Optimization Suggestions
              </h5>
              <div className='space-y-2.5'>
                {report.actionableSuggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className='p-3.5 bg-white border-2 border-neutral-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs space-y-1'
                  >
                    <div className='flex items-center justify-between'>
                      <span className='font-bold text-neutral-900'>
                        Section: {sug.section || 'General'}
                      </span>
                      <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-300'>
                        Step {idx + 1}
                      </span>
                    </div>
                    {sug.issue && (
                      <p className='text-neutral-500 font-medium italic'>
                        Issue: {sug.issue}
                      </p>
                    )}
                    {sug.recommendation && (
                      <p className='text-neutral-800 font-semibold pt-1 border-t border-neutral-100'>
                        Tip: {sug.recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Recommended Target Roles */}
          {report.tailoredRoles?.length > 0 && (
            <div className='p-3.5 bg-lime-50/50 border-2 border-neutral-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 text-xs flex-wrap'>
              <span className='font-extrabold text-neutral-800'>
                Recommended Target Roles:
              </span>
              <div className='flex flex-wrap gap-1.5'>
                {report.tailoredRoles.map((role, idx) => (
                  <span
                    key={idx}
                    className='px-2.5 py-1 bg-white border border-neutral-900 font-bold rounded-lg text-neutral-800 text-[11px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiCvAuditCard;
