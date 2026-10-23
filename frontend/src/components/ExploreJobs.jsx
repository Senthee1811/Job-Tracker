import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SkeletonCard } from './SkeletonLoader';
import TailorCvModal from './TailorCvModal';
import { 
  IoBookmarkOutline, 
  IoBookmark, 
  IoLocationOutline, 
  IoBriefcaseOutline,
  IoSearchOutline,
  IoOpenOutline,
  IoSparklesOutline,
  IoFlameOutline
} from 'react-icons/io5';

const ExploreJobs = ({ 
  selectedSource = 'all', 
  setSelectedSource, 
  onAutoApply, 
  bookmarks = [], 
  onToggleBookmark 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tailorJob, setTailorJob] = useState(null);
  const [tailorModalOpen, setTailorModalOpen] = useState(false);

  // Fetch vacancies from DB and scraper backend
  useEffect(() => {
    const fetchVacancies = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getVacancies({
          role: searchQuery,
          source: selectedSource,
          location: region,
          limit: 18
        });
        if (data.jobs && data.jobs.length > 0) {
          setJobs(data.jobs);
        } else {
          // Fallback to legacy live jobs endpoint
          const liveData = await api.getLiveJobs(searchQuery || 'React', region);
          setJobs(liveData.jobs || []);
        }
      } catch (err) {
        console.error(err);
        setError('Could not load vacancies. Please retry.');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchVacancies();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, region, selectedSource]);

  const sourcesList = [
    { id: 'all', label: 'All Sources' },
    { id: 'itpro', label: 'ITPro.lk' },
    { id: 'xpressjobs', label: 'XpressJobs' },
    { id: 'topjobs', label: 'TopJobs' },
    { id: 'ikman', label: 'ikman' },
    { id: 'rooster', label: 'Rooster' }
  ];

  const handleOpenTailor = (job) => {
    setTailorJob(job);
    setTailorModalOpen(true);
  };

  return (
    <div className='max-w-6xl mx-auto px-4 sm:px-6 py-10 select-none space-y-8 animate-in fade-in duration-300'>
      
      {/* Title */}
      <div className='text-center space-y-2'>
        <h3 className='text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight'>
          Explore Sri Lanka <span className='text-[#a3e635]'>IT Vacancies</span>
        </h3>
        <p className='text-xs md:text-sm text-neutral-500 font-medium max-w-lg mx-auto leading-relaxed'>
          Discover active engineering roles, customize your ATS resume with Gemini, and track your applications.
        </p>
      </div>

      {/* Search and Filters toolbar */}
      <div className='space-y-4'>
        {/* Platform source tabs */}
        <div className='flex flex-wrap gap-2 items-center justify-center'>
          {sourcesList.map((src) => (
            <button
              key={src.id}
              onClick={() => setSelectedSource(src.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                selectedSource === src.id
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900'
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className='flex flex-col sm:flex-row items-center gap-3 max-w-3xl mx-auto'>
          <div className='relative flex-1 w-full'>
            <IoSearchOutline className='absolute left-3.5 top-3 w-4 h-4 text-neutral-400' />
            <input 
              type="text" 
              placeholder="Search by title, skill, or employer (React, Python, QA, DevOps)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full text-xs pl-10 pr-4 py-2.5 bg-white border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 font-sans shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            />
          </div>

          <div className='relative w-full sm:w-48'>
            <IoLocationOutline className='absolute left-3.5 top-3 w-4 h-4 text-neutral-400' />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className='w-full text-xs pl-10 pr-6 py-2.5 bg-white border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 font-sans shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] appearance-none cursor-pointer'
            >
              <option value="all">All Locations</option>
              <option value="colombo">Colombo</option>
              <option value="kandy">Kandy</option>
              <option value="remote">Remote</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className='p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-center font-bold'>
          {error}
        </div>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : jobs.length === 0 ? (
        <div className='p-12 bg-white border-2 border-neutral-900 rounded-2xl text-center space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'>
          <IoBriefcaseOutline className='w-12 h-12 text-neutral-300 mx-auto' />
          <h4 className='font-extrabold text-neutral-900 text-sm'>No vacancies matched your criteria</h4>
          <p className='text-xs text-neutral-500 max-w-sm mx-auto'>
            Try expanding your search query or switching to "All Sources".
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          {jobs.map((job) => {
            const jobId = job._id || job.id || job.dedupeHash;
            const isSaved = bookmarks.some(b => (b._id || b.id || b.dedupeHash) === jobId);

            return (
              <div 
                key={jobId} 
                className='bg-white rounded-2xl border-2 border-neutral-900 p-5 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all text-left'
              >
                <div className='space-y-3'>
                  {/* Top Badges */}
                  <div className='flex justify-between items-start gap-2'>
                    <div className='flex items-center gap-1.5 flex-wrap'>
                      <span className='px-2 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-extrabold uppercase rounded-md border border-neutral-300 font-mono'>
                        {job.source || 'SRI LANKA'}
                      </span>
                      {job.isNewToday && (
                        <span className='px-2 py-0.5 bg-lime-400 text-neutral-950 text-[10px] font-black uppercase rounded-md border border-neutral-900 flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'>
                          <IoFlameOutline className='w-3 h-3 text-neutral-900' />
                          New Today
                        </span>
                      )}
                    </div>

                    <button 
                      onClick={() => onToggleBookmark(job)}
                      className='text-neutral-400 hover:text-rose-500 transition-colors p-1 cursor-pointer'
                      title="Bookmark vacancy"
                    >
                      {isSaved ? (
                        <IoBookmark className='text-lime-600' size={18} />
                      ) : (
                        <IoBookmarkOutline size={18} />
                      )}
                    </button>
                  </div>

                  {/* Title & Employer */}
                  <div>
                    <h4 className='font-extrabold text-sm text-neutral-900 leading-tight line-clamp-2'>
                      {job.applyUrl ? (
                        <a
                          href={job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className='hover:text-lime-700 hover:underline inline-flex items-center gap-1.5'
                          title="Navigate to live job portal"
                        >
                          <span>{job.title}</span>
                          <IoOpenOutline className='w-3.5 h-3.5 text-neutral-400 flex-shrink-0' />
                        </a>
                      ) : (
                        job.title
                      )}
                    </h4>
                    <p className='text-xs text-neutral-500 font-bold uppercase mt-1'>
                      {job.company}
                    </p>
                  </div>

                  {/* Description Snippet */}
                  <p className='text-xs text-neutral-600 font-sans leading-relaxed line-clamp-3'>
                    {job.description || job.requirements || `${job.title} vacancy at ${job.company}. Click Tailor CV or Apply to review options.`}
                  </p>
                </div>

                {/* Footer Controls */}
                <div className='pt-3 border-t border-neutral-100 space-y-3'>
                  <div className='flex justify-between items-center text-[11px] text-neutral-500 font-mono'>
                    <span className='flex items-center gap-1'>
                      <IoLocationOutline size={12} />
                      {job.location || 'Sri Lanka'}
                    </span>
                    <span className='bg-neutral-100 px-2 py-0.5 rounded font-bold'>
                      {job.mode || 'hybrid'}
                    </span>
                  </div>

                  <div className='flex items-center justify-end gap-2'>
                    {job.applyUrl && (
                      <a 
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className='inline-flex items-center gap-1 px-2.5 py-1.5 text-neutral-700 hover:text-black border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors text-xs font-bold'
                        title="Navigate to Official Job Listing"
                      >
                        <IoOpenOutline size={14} />
                        <span>Portal</span>
                      </a>
                    )}

                    <button
                      onClick={() => handleOpenTailor(job)}
                      className='bg-neutral-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
                    >
                      Tailor CV
                    </button>

                    <button
                      onClick={() => onAutoApply(job)}
                      className='bg-[#a3e635] text-neutral-950 font-extrabold text-xs px-3.5 py-1.5 border-2 border-neutral-900 rounded-lg hover:bg-lime-400 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer'
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

      {/* Tailor Modal */}
      <TailorCvModal
        isOpen={tailorModalOpen}
        job={tailorJob}
        onClose={() => {
          setTailorModalOpen(false);
          setTailorJob(null);
        }}
        onApplyAssisted={(job, tailoredCvId) => {
          setTailorModalOpen(false);
          onAutoApply(job, tailoredCvId);
        }}
      />

    </div>
  );
};

export default ExploreJobs;
