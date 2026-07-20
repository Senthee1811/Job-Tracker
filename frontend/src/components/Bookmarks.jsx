import React from 'react';
import { 
  IoBookmark, 
  IoLocationOutline, 
  IoLogoLinkedin, 
  IoFlashOutline, 
  IoLogoGoogle, 
  IoBriefcaseOutline
} from 'react-icons/io5';

const Bookmarks = ({ bookmarks, onToggleBookmark, onAutoApply }) => {
  const getSourceIcon = (source) => {
    switch (source) {
      case 'google':
        return <IoLogoGoogle className='text-red-500' size={18} />;
      case 'linkedin':
        return <IoLogoLinkedin className='text-blue-500' size={18} />;
      case 'upwork':
        return <IoBriefcaseOutline className='text-green-600' size={18} />;
      default:
        return <IoBriefcaseOutline className='text-neutral-500' size={18} />;
    }
  };

  return (
    <div className='max-w-5xl mx-auto px-6 py-12 select-none'>
      
      <div className='flex flex-col gap-2 mb-10 text-left border-b-2 border-neutral-100 pb-4'>
        <h2 className='text-2xl md:text-3xl font-extrabold text-neutral-900 uppercase'>
          Bookmarked Jobs
        </h2>
        <p className='text-xs md:text-sm text-neutral-500 font-medium'>
          Access and auto-apply to your saved vacancies.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className='text-center py-20 bg-lime-400/5 rounded-2xl border border-lime-400/20'>
          <p className='text-neutral-500 font-medium text-lg mb-2'>
            No bookmarked opportunities yet.
          </p>
          <p className='text-xs text-neutral-400 max-w-sm mx-auto leading-normal'>
            Go to the <strong>Explore</strong> tab, search for your favorite vacancies, and click the star icon to save them here!
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {bookmarks.map((job) => (
            <div 
              key={job.id} 
              className='bg-white rounded-2xl border-2 border-neutral-900 p-5 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all'
            >
              
              {/* Top Row: company logo, title, bookmark */}
              <div className='flex justify-between items-start gap-4'>
                <div>
                  <div className='flex items-center gap-2 mb-1.5'>
                    <span className='bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full text-xxs font-bold text-neutral-500 flex items-center gap-1 uppercase'>
                      {getSourceIcon(job.source)}
                      {job.source}
                    </span>
                    <span className='bg-lime-100 text-lime-800 border border-lime-200 px-2 py-0.5 rounded-full text-xxs font-bold uppercase'>
                      {job.category}
                    </span>
                  </div>
                  <h3 className='text-lg font-extrabold text-neutral-900 leading-snug'>{job.title}</h3>
                  <h4 className='text-sm font-semibold text-neutral-500'>{job.company}</h4>
                </div>
                
                <button
                  onClick={() => onToggleBookmark(job)}
                  className='text-amber-500 hover:text-neutral-400 p-1 border border-amber-200 hover:border-neutral-200 bg-amber-50 hover:bg-neutral-50 rounded-lg transition-all cursor-pointer'
                  title="Remove Bookmark"
                >
                  <IoBookmark size={20} />
                </button>
              </div>

              {/* Requirements summary */}
              <p className='text-xs text-neutral-600 leading-relaxed line-clamp-3'>
                {job.requirements}
              </p>

              {/* Metadata tags */}
              <div className='flex flex-wrap gap-2 text-xxs md:text-xs font-bold text-neutral-600'>
                <span className='flex items-center gap-1 border border-neutral-200 px-2 py-1 rounded-lg bg-neutral-50'>
                  <IoLocationOutline size={14} />
                  {job.location} ({job.mode})
                </span>
                <span className='flex items-center gap-1 border border-neutral-200 px-2 py-1 rounded-lg bg-neutral-50'>
                  ${job.salary.toLocaleString()} {job.source === 'upwork' ? 'Project' : '/ year'}
                </span>
              </div>

              {/* Auto Apply trigger */}
              <div className='border-t border-neutral-100 pt-3 flex justify-end'>
                <button
                  onClick={() => onAutoApply(job)}
                  className='bg-[#a3e635] text-neutral-900 font-bold text-xs px-4 py-2 border-2 border-neutral-900 rounded-lg hover:bg-lime-400 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center gap-1.5'
                >
                  <IoFlashOutline size={14} className='animate-pulse' />
                  Auto Apply
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Bookmarks;
