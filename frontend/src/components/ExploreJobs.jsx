import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  IoBookmarkOutline, 
  IoBookmark, 
  IoLocationOutline, 
  IoLogoLinkedin, 
  IoFlashOutline, 
  IoBriefcaseOutline,
  IoSearchOutline
} from 'react-icons/io5';

const ExploreJobs = ({ 
  selectedSource, 
  setSelectedSource, 
  onAutoApply, 
  bookmarks, 
  onToggleBookmark 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState('Sri Lanka');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch live scraped job opportunities
  useEffect(() => {
    const fetchLiveJobs = async () => {
      setLoading(true);
      setError('');
      try {
        const query = searchQuery || 'React';
        const data = await api.getLiveJobs(query, region);
        setJobs(data.jobs || []);
      } catch (err) {
        console.error(err);
        setError('Connection timed out. Loaded fallback listings.');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce live searching to avoid excessive requests
    const delayDebounce = setTimeout(() => {
      fetchLiveJobs();
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, region]);

  const getSourceIcon = (source) => {
    switch (source) {
      case 'linkedin':
        return <IoLogoLinkedin className='text-blue-500' size={18} />;
      case 'xpressjobs':
        return <IoBriefcaseOutline className='text-purple-600' size={18} />;
      case 'rooster':
        return <IoBriefcaseOutline className='text-orange-500' size={18} />;
      default:
        return <IoBriefcaseOutline className='text-neutral-500' size={18} />;
    }
  };

  const filteredJobs = jobs.filter(job => {
    return selectedSource === 'all' || job.source === selectedSource;
  });

  return (
    <div className='max-w-5xl mx-auto px-6 py-12 select-none'>
      
      {/* Search and Filters toolbar */}
      <div className='flex flex-col md:flex-row items-center justify-between gap-6 mb-10'>
        
        {/* Platform source tabs */}
        <div className='flex flex-wrap gap-2.5 items-center justify-center bg-white border-2 border-black p-1.5 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'>
          {['all', 'linkedin', 'xpressjobs', 'rooster'].map((src) => (
            <button
              key={src}
              onClick={() => setSelectedSource(src)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                selectedSource === src
                  ? 'bg-[#a3e635] text-neutral-900 border border-neutral-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              {src === 'all' ? 'All Boards' : src === 'xpressjobs' ? 'XpressJobs' : src === 'rooster' ? 'Rooster' : 'LinkedIn'}
            </button>
          ))}
        </div>

        {/* Region & Search controls */}
        <div className='flex gap-3 w-full md:w-auto items-center justify-end'>
          {/* Region/Country selector */}
          <div className='flex items-center bg-white border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-3 py-2'>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className='bg-transparent text-neutral-800 text-xs font-bold outline-none pr-4 cursor-pointer'
            >
              <option value="Sri Lanka">🇱🇰 Sri Lanka</option>
              <option value="United States">🇺🇸 United States</option>
              <option value="India">🇮🇳 India</option>
              <option value="Remote">🌐 Remote</option>
            </select>
          </div>

          {/* Search bar */}
          <div className='relative w-full md:w-64 flex items-center bg-white border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-3 py-2'>
            <input
              type="text"
              placeholder="Search roles or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='bg-transparent text-neutral-800 placeholder-neutral-400 text-xs outline-none w-full pl-6'
            />
            <IoSearchOutline className='absolute left-3 text-neutral-500' size={18} />
          </div>
        </div>

      </div>

      {loading ? (
        <div className='flex flex-col items-center justify-center py-20 gap-3'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-black'></div>
          <span className='text-xs font-mono text-neutral-400 animate-pulse'>Scraping live job openings for you...</span>
        </div>
      ) : error ? (
        <div className='bg-rose-50 border border-rose-200 text-rose-800 text-xs md:text-sm p-4 rounded-xl mb-6 font-semibold text-left'>
          {error}
        </div>
      ) : null}

      {/* Grid of Job Cards */}
      {!loading && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {filteredJobs.length === 0 ? (
            <div className='col-span-1 md:col-span-2 text-center py-16 bg-neutral-100/50 rounded-2xl border border-neutral-200'>
              <p className='text-neutral-500 font-medium'>No active jobs match your search criteria. Try a different query!</p>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const isBookmarked = bookmarks.some(b => b.id === job.id);
              return (
                <div 
                  key={job.id} 
                  className='bg-white rounded-2xl border-2 border-neutral-900 p-5 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all text-left'
                >
                  
                  {/* Top Section */}
                  <div className='flex justify-between items-start gap-4'>
                    <div className='flex items-center gap-2.5'>
                      <div className='w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center shadow-sm'>
                        {getSourceIcon(job.source)}
                      </div>
                      <div>
                        <h4 className='font-extrabold text-sm text-neutral-900 leading-tight'>{job.title}</h4>
                        <p className='text-xxs text-neutral-500 font-bold uppercase mt-0.5'>{job.company}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => onToggleBookmark(job)}
                      className='text-neutral-400 hover:text-rose-500 transition-colors p-1 cursor-pointer'
                    >
                      {isBookmarked ? (
                        <IoBookmark className='text-rose-500' size={18} />
                      ) : (
                        <IoBookmarkOutline size={18} />
                      )}
                    </button>
                  </div>

                  {/* Body description */}
                  <div>
                    <p className='text-xxs text-neutral-600 font-medium leading-relaxed line-clamp-3'>
                      {job.requirements}
                    </p>
                  </div>

                  {/* Footer options */}
                  <div className='flex justify-between items-center border-t border-neutral-100 pt-3.5 mt-2'>
                    <div className='flex gap-2.5 items-center text-xxs text-neutral-500 font-bold uppercase'>
                      <span className='flex items-center gap-1'>
                        <IoLocationOutline size={12} />
                        {job.location}
                      </span>
                      <span className='bg-neutral-100 px-2 py-0.5 rounded-full'>
                        {job.mode}
                      </span>
                    </div>

                    <button
                      onClick={() => onAutoApply(job)}
                      className='bg-[#a3e635] text-neutral-900 font-bold text-xxs px-3.5 py-1.5 border-2 border-black rounded-lg hover:bg-lime-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center gap-1'
                    >
                      <IoFlashOutline size={13} />
                      Auto Apply
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
};

export { ExploreJobs as default };
export const MOCK_JOBS = []; // Export empty mock array for backward compatibility
