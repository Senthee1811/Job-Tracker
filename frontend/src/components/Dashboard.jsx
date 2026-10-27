import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ScoreRing from './ScoreRing';
import { SkeletonCard, SkeletonRecommendation } from './SkeletonLoader';
import TailorCvModal from './TailorCvModal';
import AutoApplyModal from './AutoApplyModal';
import Toast from './Toast';
import {
  IoSparklesOutline,
  IoSyncOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoLocationOutline,
  IoBriefcaseOutline,
  IoCalendarOutline,
  IoBookmarkOutline,
  IoBookmark,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoAddOutline,
  IoTimeOutline,
  IoTrashOutline,
  IoCheckmarkCircleOutline,
  IoFlameOutline,
  IoArrowForwardOutline,
  IoTrendingUpOutline,
  IoDocumentTextOutline,
  IoOpenOutline
} from 'react-icons/io5';

const Dashboard = ({ setActiveTab }) => {
  const { user } = useAuth();

  // Application Pipeline Stats
  const [applications, setApplications] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [expandedRecId, setExpandedRecId] = useState(null);

  // Sri Lanka Vacancies state
  const [vacancies, setVacancies] = useState([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(true);
  const [vacancyPage, setVacancyPage] = useState(1);
  const [vacancyTotalPages, setVacancyTotalPages] = useState(1);
  const [selectedSource, setSelectedSource] = useState('all');
  const [searchRole, setSearchRole] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [appliedPreferences, setAppliedPreferences] = useState(null);

  // Reminders state
  const [reminders, setReminders] = useState([]);
  const [showAddReminderForm, setShowAddReminderForm] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('10:00');
  const [reminderDesc, setReminderDesc] = useState('');
  const [reminderColor, setReminderColor] = useState('#a3e635');

  // Modals state
  const [tailorModalOpen, setTailorModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedTailoredCvId, setSelectedTailoredCvId] = useState(null);

  // Toast state
  const [toast, setToast] = useState(null);

  // Local bookmarks
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bookmarks') || '[]');
    } catch {
      return [];
    }
  });

  const toggleBookmark = (job) => {
    const jobId = job._id || job.id || job.dedupeHash;
    setBookmarks((prev) => {
      const exists = prev.some((b) => (b._id || b.id || b.dedupeHash) === jobId);
      let updated;
      if (exists) {
        updated = prev.filter((b) => (b._id || b.id || b.dedupeHash) !== jobId);
        setToast({ message: `Removed "${job.title}" from saved bookmarks.`, type: 'info' });
      } else {
        updated = [...prev, job];
        setToast({ message: `Saved "${job.title}" to bookmarks!`, type: 'success' });
      }
      localStorage.setItem('bookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  const isBookmarked = (job) => {
    const jobId = job._id || job.id || job.dedupeHash;
    return bookmarks.some((b) => (b._id || b.id || b.dedupeHash) === jobId);
  };

  // Fetch application statistics
  const fetchStats = async () => {
    if (!user) return;
    try {
      const data = await api.getApplications();
      setApplications(data.applications || []);
    } catch (err) {
      console.error(err);
      setApplications([]);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    if (!user) return;
    setRecsLoading(true);
    try {
      const data = await api.getRecommendations(1, 4);
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setRecsLoading(false);
    }
  };

  // Recompute recommendations
  const handleRecomputeRecommendations = async () => {
    setRecsLoading(true);
    try {
      const data = await api.recomputeRecommendations();
      setRecommendations(data.recommendations?.slice(0, 4) || []);
      setToast({ message: 'AI match scores recomputed using latest candidate profile!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to recompute match scores', type: 'error' });
    } finally {
      setRecsLoading(false);
    }
  };

  // Fetch Sri Lanka Vacancies
  const fetchVacancies = async () => {
    setVacanciesLoading(true);
    try {
      const data = await api.getVacancies({
        page: vacancyPage,
        limit: 6,
        source: selectedSource,
        role: searchRole,
        location: selectedLocation,
        showAll: showAllJobs
      });
      setVacancies(data.jobs || []);
      setVacancyTotalPages(data.totalPages || 1);
      setAppliedPreferences(data.appliedPreferences || null);
    } catch (err) {
      console.error('Error fetching vacancies:', err);
    } finally {
      setVacanciesLoading(false);
    }
  };

  // Trigger manual scrape refresh
  const handleRefreshScrapers = async () => {
    setToast({ message: 'Triggered live scraper cycle across Sri Lankan job boards...', type: 'info' });
    try {
      await api.refreshVacancies();
      setToast({ message: 'Vacancy refresh completed! Reloading board...', type: 'success' });
      fetchVacancies();
    } catch (err) {
      setToast({ message: 'Scraper refresh error: ' + err.message, type: 'error' });
    }
  };

  // Fetch reminders
  const fetchReminders = async () => {
    if (!user) return;
    try {
      const data = await api.getReminders();
      setReminders(data.reminders || []);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!reminderTitle || !reminderDate) {
      setToast({ message: 'Please provide Title and Date for reminder', type: 'error' });
      return;
    }
    try {
      await api.createReminder({
        title: reminderTitle,
        description: reminderDesc,
        date: reminderDate,
        time: reminderTime,
        color: reminderColor
      });
      setReminderTitle('');
      setReminderDesc('');
      setReminderDate('');
      setShowAddReminderForm(false);
      setToast({ message: 'Reminder created successfully!', type: 'success' });
      fetchReminders();
    } catch (err) {
      setToast({ message: 'Failed to create reminder', type: 'error' });
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await api.deleteReminder(id);
      setToast({ message: 'Reminder deleted', type: 'info' });
      fetchReminders();
    } catch (err) {
      setToast({ message: 'Failed to delete reminder', type: 'error' });
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchRecommendations();
    fetchReminders();
  }, [user]);

  // Load vacancies on filter/page change with 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVacancies();
    }, 250);
    return () => clearTimeout(timer);
  }, [vacancyPage, selectedSource, searchRole, selectedLocation, showAllJobs]);

  // Aggregate stats calculations
  const total = applications.length;
  const applied = applications.filter((a) => a.status === 'applied').length;
  const interviewed = applications.filter((a) => a.status === 'interviewed').length;
  const offered = applications.filter((a) => a.status === 'offered').length;
  const rejected = applications.filter((a) => a.status === 'rejected').length;

  const handleOpenTailor = (job) => {
    setSelectedJob(job);
    setTailorModalOpen(true);
  };

  const handleOpenApply = (job, tailoredCvId = null) => {
    setSelectedJob(job);
    setSelectedTailoredCvId(tailoredCvId);
    setApplyModalOpen(true);
  };

  const sourceTabs = [
    { id: 'all', label: 'All Sources' },
    { id: 'itpro', label: 'ITPro.lk' },
    { id: 'xpressjobs', label: 'XpressJobs' },
    { id: 'topjobs', label: 'TopJobs' },
    { id: 'ikman', label: 'ikman Jobs' },
    { id: 'rooster', label: 'Rooster' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-in fade-in duration-300">
      
      {/* 1. Header & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
            Welcome back, <span className="text-[#84cc16]">{user?.firstname || 'Candidate'}</span>!
          </h2>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Track applications, discover daily Sri Lankan IT vacancies, and match roles using RAG intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-neutral-900 font-bold border-2 border-neutral-900 rounded-xl hover:bg-neutral-50 text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
          >
            <IoDocumentTextOutline className="w-4 h-4 text-lime-600" />
            <span>Manage CV Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#a3e635] text-neutral-950 font-extrabold border-2 border-neutral-900 rounded-xl hover:bg-lime-400 text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
          >
            <IoBriefcaseOutline className="w-4 h-4" />
            <span>Application Spreadsheet</span>
          </button>
        </div>
      </div>

      {/* 2. Stats Metric Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Total */}
        <div className="p-4 bg-white border-2 border-neutral-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Total Tracked</span>
          <div className="text-2xl font-black text-neutral-900">{total}</div>
          <div className="text-[10px] text-neutral-500 font-medium">All recorded vacancies</div>
        </div>

        {/* Applied */}
        <div className="p-4 bg-white border-2 border-neutral-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">Applied</span>
          <div className="text-2xl font-black text-blue-600">{applied}</div>
          <div className="text-[10px] text-neutral-500 font-medium">In initial pipeline</div>
        </div>

        {/* Interviewing */}
        <div className="p-4 bg-white border-2 border-neutral-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Interviewing</span>
          <div className="text-2xl font-black text-amber-600">{interviewed}</div>
          <div className="text-[10px] text-neutral-500 font-medium">Active screening / rounds</div>
        </div>

        {/* Offers */}
        <div className="p-4 bg-white border-2 border-neutral-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Offers</span>
          <div className="text-2xl font-black text-emerald-600">{offered}</div>
          <div className="text-[10px] text-neutral-500 font-medium">Secured proposals</div>
        </div>

        {/* Rejected */}
        <div className="p-4 bg-white border-2 border-neutral-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-1 col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Archived / Rejected</span>
          <div className="text-2xl font-black text-rose-600">{rejected}</div>
          <div className="text-[10px] text-neutral-500 font-medium">Closed pipelines</div>
        </div>
      </div>

      {/* 3. Section: "Recommended for You" (RAG Match Scoring) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-neutral-900 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-lime-100 text-neutral-900 border border-neutral-900 rounded-lg">
              <IoSparklesOutline className="w-5 h-5 text-lime-700" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-neutral-900 leading-tight">
                Recommended for You
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                AI hybrid match score (50% semantic, 30% skills, 10% experience, 10% preference)
              </p>
            </div>
          </div>

          <button
            onClick={handleRecomputeRecommendations}
            disabled={recsLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-neutral-800 font-bold border border-neutral-300 rounded-xl hover:bg-neutral-50 text-xs cursor-pointer shadow-sm disabled:opacity-50"
          >
            <IoSyncOutline className={`w-3.5 h-3.5 ${recsLoading ? 'animate-spin' : ''}`} />
            <span>Recalculate Matches</span>
          </button>
        </div>

        {recsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonRecommendation />
            <SkeletonRecommendation />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="p-8 bg-white border-2 border-neutral-900 rounded-2xl text-center space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <IoBriefcaseOutline className="w-10 h-10 text-neutral-300 mx-auto" />
            <p className="text-xs text-neutral-600 font-bold">
              Upload your CV in Profile to unlock personalized match scores and role recommendations!
            </p>
            <button
              onClick={() => setActiveTab('profile')}
              className="px-4 py-2 bg-[#a3e635] text-neutral-950 font-extrabold border-2 border-neutral-900 rounded-xl text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              Upload CV
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((job) => {
              const jobId = job._id || job.id || job.dedupeHash;
              const isExpanded = expandedRecId === jobId;
              const expl = job.explanation;

              return (
                <div
                  key={jobId}
                  className="bg-white border-2 border-neutral-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Score & Title */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-md border border-neutral-300">
                            {job.source || 'SRI LANKA'}
                          </span>
                          <span className="text-[10px] font-bold text-neutral-500">
                            {job.mode || 'hybrid'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-neutral-900 text-base leading-snug">
                          {job.applyUrl || job.link ? (
                            <a
                              href={job.applyUrl || job.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-lime-700 hover:underline inline-flex items-center gap-1.5"
                              title="Navigate to live job portal"
                            >
                              <span>{job.title}</span>
                              <IoOpenOutline className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                            </a>
                          ) : (
                            job.title
                          )}
                        </h4>
                        <p className="text-xs text-neutral-600 font-medium">
                          {job.company} • {job.location || 'Sri Lanka'}
                        </p>
                      </div>

                      {/* Score Ring */}
                      <ScoreRing score={job.matchScore || 75} size={54} />
                    </div>

                    {/* Skill Overlap Preview */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {expl?.matchedSkills?.slice(0, 4).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 bg-lime-100 text-lime-800 text-[10px] font-bold rounded-md border border-lime-300"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                      {expl?.missingSkills?.slice(0, 2).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-200"
                        >
                          + {skill}
                        </span>
                      ))}
                    </div>

                    {/* One-Line Recruiter Summary */}
                    {expl?.oneLineSummary && (
                      <p className="text-xs text-neutral-600 font-sans italic border-l-2 border-lime-400 pl-2 py-0.5">
                        "{expl.oneLineSummary}"
                      </p>
                    )}

                    {/* Expandable Explanation Breakdown */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-neutral-200 space-y-2.5 text-xs animate-in fade-in duration-200">
                        {/* Score Breakdown Bars */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                          <div>
                            <span className="text-neutral-500">Semantic Fit:</span>
                            <span className="font-bold ml-1 text-neutral-800">{job.scoreBreakdown?.semantic || 80}%</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Skill Overlap:</span>
                            <span className="font-bold ml-1 text-neutral-800">{job.scoreBreakdown?.skills || 75}%</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Seniority Fit:</span>
                            <span className="font-bold ml-1 text-neutral-800">{job.scoreBreakdown?.experience || 90}%</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Preferences:</span>
                            <span className="font-bold ml-1 text-neutral-800">{job.scoreBreakdown?.preference || 85}%</span>
                          </div>
                        </div>

                        {/* Strengths */}
                        {expl?.strengths?.length > 0 && (
                          <div>
                            <span className="font-bold text-neutral-800 block text-[11px]">Strengths</span>
                            <ul className="list-disc list-inside text-neutral-600 text-[11px]">
                              {expl.strengths.map((str, i) => (
                                <li key={i}>{str}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Gaps */}
                        {expl?.gaps?.length > 0 && (
                          <div>
                            <span className="font-bold text-neutral-800 block text-[11px]">Potential Gaps</span>
                            <ul className="list-disc list-inside text-neutral-600 text-[11px]">
                              {expl.gaps.map((gap, i) => (
                                <li key={i}>{gap}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-4 mt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setExpandedRecId(isExpanded ? null : jobId)}
                      className="text-xs font-bold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Less Details' : 'Why this score?'}</span>
                      {isExpanded ? <IoChevronUpOutline /> : <IoChevronDownOutline />}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleBookmark(job)}
                        className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="Bookmark"
                      >
                        {isBookmarked(job) ? (
                          <IoBookmark className="w-4 h-4 text-lime-600" />
                        ) : (
                          <IoBookmarkOutline className="w-4 h-4 text-neutral-500" />
                        )}
                      </button>

                      {(job.applyUrl || job.link) && (
                        <a
                          href={job.applyUrl || job.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors"
                          title="Open Official Job Listing in New Tab"
                        >
                          <IoOpenOutline className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        onClick={() => handleOpenTailor(job)}
                        className="px-3 py-1.5 bg-neutral-900 text-white font-bold rounded-xl text-xs hover:bg-neutral-800 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                      >
                        Tailor CV
                      </button>

                      <button
                        onClick={() => handleOpenApply(job)}
                        className="px-3 py-1.5 bg-[#a3e635] text-neutral-950 font-extrabold border border-neutral-900 rounded-xl text-xs hover:bg-lime-400 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Section: "Today's Vacancies in Sri Lanka" */}
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-neutral-900 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-neutral-900 text-white rounded-lg">
              <IoFlameOutline className="w-5 h-5 text-lime-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-neutral-900 leading-tight">
                Today's Vacancies in Sri Lanka
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                Live IT job postings indexed from TopJobs, ITPro.lk, XpressJobs, ikman, and Rooster
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshScrapers}
              className="px-3.5 py-2 bg-white text-neutral-900 font-bold border-2 border-neutral-900 rounded-xl hover:bg-neutral-50 text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5"
            >
              <IoSyncOutline className="w-3.5 h-3.5" />
              <span>Refresh Boards</span>
            </button>
          </div>
        </div>

        {/* Preference Filter Status Bar */}
        <div className="p-3.5 bg-lime-50/80 border-2 border-neutral-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-neutral-900 flex items-center gap-1.5">
              <IoFilterOutline className="w-4 h-4 text-lime-700" />
              {showAllJobs ? 'Showing:' : 'Showing jobs for:'}
            </span>
            {showAllJobs ? (
              <span className="px-2.5 py-0.5 bg-neutral-900 text-white rounded-lg text-[11px] font-bold">
                All Sri Lankan IT Jobs
              </span>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {(appliedPreferences?.roles || user?.preferences?.roles || ['Software Engineer']).map((r, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-[#a3e635] text-neutral-950 rounded-lg text-[11px] font-bold border border-neutral-900"
                  >
                    {r}
                  </span>
                ))}
                <span className="text-neutral-400 font-bold">•</span>
                {(appliedPreferences?.locations || user?.preferences?.locations || ['Colombo', 'Remote']).map((l, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-white text-neutral-800 rounded-lg text-[11px] font-bold border border-neutral-300"
                  >
                    {l}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setShowAllJobs(!showAllJobs);
                setVacancyPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 border-neutral-900 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] ${
                showAllJobs
                  ? 'bg-[#a3e635] text-neutral-950 hover:bg-lime-400'
                  : 'bg-white text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              {showAllJobs ? 'Filter by My Preferences' : 'Show All IT Jobs'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="text-xs font-bold text-neutral-700 hover:text-black underline cursor-pointer"
            >
              Edit Preferences
            </button>
          </div>
        </div>

        {/* Filters & Source Tabs */}
        <div className="space-y-3">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {sourceTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedSource(tab.id);
                  setVacancyPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                  selectedSource === tab.id
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative col-span-2">
              <IoSearchOutline className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchRole}
                onChange={(e) => {
                  setSearchRole(e.target.value);
                  setVacancyPage(1);
                }}
                placeholder="Search by role, skill, or keyword (e.g. React, QA, Python, DevOps)..."
                className="w-full text-xs pl-10 pr-4 py-2.5 bg-white border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 font-sans shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="relative">
              <IoLocationOutline className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setVacancyPage(1);
                }}
                className="w-full text-xs pl-10 pr-8 py-2.5 bg-white border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 font-sans shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] appearance-none cursor-pointer"
              >
                <option value="all">All Locations (Sri Lanka)</option>
                <option value="colombo">Colombo</option>
                <option value="kandy">Kandy</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vacancies Grid */}
        {vacanciesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : vacancies.length === 0 ? (
          <div className="p-12 bg-white border-2 border-neutral-900 rounded-2xl text-center space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <IoBriefcaseOutline className="w-10 h-10 text-neutral-300 mx-auto" />
            <h4 className="font-extrabold text-neutral-800 text-sm">No Vacancies Matched Your Filters</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Try adjusting your role keywords, selecting "All Sources", or clicking "Refresh Boards".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vacancies.map((job) => {
              const jobId = job._id || job.id || job.dedupeHash;
              return (
                <div
                  key={jobId}
                  className="bg-white border-2 border-neutral-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded-md border border-neutral-300 font-mono">
                        {job.source || 'SRI LANKA'}
                      </span>

                      {job.isNewToday && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-lime-400 text-neutral-950 rounded-md border border-neutral-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                          <IoFlameOutline className="w-3 h-3 text-neutral-900" />
                          New Today
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-neutral-900 text-sm leading-snug line-clamp-2">
                        {job.title}
                      </h4>
                      <p className="text-xs text-neutral-600 font-medium mt-0.5">
                        {job.company} • {job.location || 'Sri Lanka'}
                      </p>
                    </div>

                    <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed font-sans">
                      {job.description || `Software vacancy at ${job.company}. Click Tailor CV or Apply to review application options.`}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-neutral-500 font-mono">
                      <span className="px-2 py-0.5 bg-neutral-50 border border-neutral-200 rounded">
                        {job.salary || 'Negotiable'}
                      </span>
                      <span className="px-2 py-0.5 bg-neutral-50 border border-neutral-200 rounded">
                        {job.mode || 'hybrid'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 mt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleBookmark(job)}
                      className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                      title="Bookmark"
                    >
                      {isBookmarked(job) ? (
                        <IoBookmark className="w-4 h-4 text-lime-600" />
                      ) : (
                        <IoBookmarkOutline className="w-4 h-4 text-neutral-500" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenTailor(job)}
                        className="px-3 py-1.5 bg-neutral-900 text-white font-bold rounded-xl text-xs hover:bg-neutral-800 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                      >
                        Tailor CV
                      </button>

                      <button
                        onClick={() => handleOpenApply(job)}
                        className="px-3 py-1.5 bg-[#a3e635] text-neutral-950 font-extrabold border border-neutral-900 rounded-xl text-xs hover:bg-lime-400 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {vacancyTotalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setVacancyPage((p) => Math.max(1, p - 1))}
              disabled={vacancyPage === 1}
              className="px-4 py-2 bg-white text-neutral-800 font-bold border-2 border-neutral-900 rounded-xl text-xs hover:bg-neutral-50 disabled:opacity-40 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-neutral-600">
              Page {vacancyPage} of {vacancyTotalPages}
            </span>
            <button
              onClick={() => setVacancyPage((p) => Math.min(vacancyTotalPages, p + 1))}
              disabled={vacancyPage === vacancyTotalPages}
              className="px-4 py-2 bg-white text-neutral-800 font-bold border-2 border-neutral-900 rounded-xl text-xs hover:bg-neutral-50 disabled:opacity-40 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* 5. Section: Reminders & Quick Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Reminders Widget */}
        <div className="lg:col-span-2 bg-white border-2 border-neutral-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2">
              <IoCalendarOutline className="w-5 h-5 text-lime-600" />
              <h4 className="font-extrabold text-neutral-900 text-sm">
                Interview & Follow-up Reminders
              </h4>
            </div>
            <button
              onClick={() => setShowAddReminderForm(!showAddReminderForm)}
              className="text-xs font-bold text-neutral-700 hover:text-black flex items-center gap-1 cursor-pointer"
            >
              <IoAddOutline className="w-4 h-4" />
              <span>{showAddReminderForm ? 'Cancel' : 'Add Reminder'}</span>
            </button>
          </div>

          {showAddReminderForm && (
            <form onSubmit={handleAddReminder} className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    placeholder="e.g. Technical Round with WSO2"
                    className="w-full p-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-lime-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full p-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-lime-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={reminderDesc}
                  onChange={(e) => setReminderDesc(e.target.value)}
                  placeholder="Review system design concepts..."
                  className="w-full p-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-lime-400"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-lg text-xs hover:bg-neutral-800 transition-all cursor-pointer"
              >
                Save Reminder
              </button>
            </form>
          )}

          {reminders.length === 0 ? (
            <p className="text-xs text-neutral-500 italic py-4 text-center">
              No upcoming interview or task deadlines recorded.
            </p>
          ) : (
            <div className="space-y-2">
              {reminders.map((rem) => (
                <div
                  key={rem._id}
                  className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs hover:bg-neutral-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: rem.color || '#a3e635' }}
                    />
                    <div>
                      <div className="font-extrabold text-neutral-900">{rem.title}</div>
                      {rem.description && (
                        <div className="text-[11px] text-neutral-500">{rem.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-neutral-500">
                      {rem.date} {rem.time}
                    </span>
                    <button
                      onClick={() => handleDeleteReminder(rem._id)}
                      className="text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete reminder"
                    >
                      <IoTrashOutline className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pipeline Summary Card */}
        <div className="bg-neutral-900 text-white border-2 border-neutral-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#a3e635]">
              Pipeline Strategy
            </span>
            <h4 className="text-base font-extrabold text-white leading-tight">
              Ready to Accelerate Your Career?
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Tailoring your resume for target positions boosts screening callbacks by over 300%. Check your recommended roles daily and apply with customized ATS resumes.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => setActiveTab('explore')}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-xs transition-all border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore All Sri Lankan Vacancies</span>
              <IoArrowForwardOutline className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <TailorCvModal
        isOpen={tailorModalOpen}
        job={selectedJob}
        onClose={() => {
          setTailorModalOpen(false);
          setSelectedJob(null);
        }}
        onApplyAssisted={(job, tailoredCvId) => {
          setSelectedJob(job);
          setSelectedTailoredCvId(tailoredCvId);
          setApplyModalOpen(true);
        }}
      />

      <AutoApplyModal
        isOpen={applyModalOpen}
        job={selectedJob}
        tailoredCvId={selectedTailoredCvId}
        onClose={() => {
          setApplyModalOpen(false);
          setSelectedJob(null);
          setSelectedTailoredCvId(null);
        }}
        onApplySuccess={() => {
          fetchStats();
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
};

export default Dashboard;
