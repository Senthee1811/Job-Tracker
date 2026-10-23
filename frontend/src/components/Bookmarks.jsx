import React, { useState } from 'react';
import { 
  IoBookmark, 
  IoLocationOutline, 
  IoBriefcaseOutline,
  IoOpenOutline,
  IoSparklesOutline
} from 'react-icons/io5';
import TailorCvModal from './TailorCvModal';

const Bookmarks = ({ bookmarks = [], onToggleBookmark, onAutoApply }) => {
  const [tailorJob, setTailorJob] = useState(null);
  const [tailorModalOpen, setTailorModalOpen] = useState(false);

  return (
    <div className='max-w-5xl mx-auto px-4 sm:px-6 py-10 select-none space-y-8 animate-in fade-in duration-300'>
      
      <div className='flex flex-col gap-1 border-b-2 border-neutral-900 pb-4'>
        <h2 className='text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight'>
          Bookmarked <span className='text-[#a3e635]'>Vacancies</span>
        </h2>
        <p className='text-xs md:text-sm text-neutral-500 font-medium'>
          Review and prepare tailored applications for your saved Sri Lankan IT roles.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className='text-center py-20 bg-white rounded-2xl border-2 border-neutral-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 space-y-3'>
          <IoBookmark className='w-12 h-12 text-neutral-300 mx-auto' />
          <h4 className='text-base font-extrabold text-neutral-800'>
            No bookmarked opportunities yet
          </h4>
          <p className='text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed'>
            Browse roles on the <strong>Dashboard</strong> or <strong>Explore</strong> tab and click the bookmark icon to save them here for quick access.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          {bookmarks.map((job) => {
            const jobId = job._id || job.id || job.dedupeHash;
            const applyTarget = job.applyUrl || job.link;

            return (
              <div 
                key={jobId} 
                className='bg-white rounded-2xl border-2 border-neutral-900 p-5 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all'
              >
                <div className='space-y-3'>
                  {/* Top Row */}
                  <div className='flex justify-between items-start gap-4'>
                    <div className='space-y-1 flex-1'>
                      <span className='px-2 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-extrabold uppercase rounded-md border border-neutral-300 font-mono'>
                        {job.source || 'SRI LANKA'}
                      </span>
                      <h3 className='text-base font-extrabold text-neutral-900 leading-snug line-clamp-2'>
                        {job.title}
                      </h3>
                      <h4 className='text-xs font-bold text-neutral-500 uppercase'>
                        {job.company}
                      </h4>
                    </div>
                    
                    <button
                      onClick={() => onToggleBookmark(job)}
                      className='text-lime-600 hover:text-rose-600 p-1.5 border border-neutral-300 bg-neutral-50 rounded-xl transition-all cursor-pointer'
                      title="Remove Bookmark"
                    >
                      <IoBookmark size={18} />
                    </button>
                  </div>

                  {/* Description */}
                  <p className='text-xs text-neutral-600 leading-relaxed line-clamp-3 font-sans'>
                    {job.description || job.requirements || `${job.title} vacancy at ${job.company}.`}
                  </p>

                  {/* Metadata tags */}
                  <div className='flex flex-wrap gap-2 text-[11px] font-mono text-neutral-600'>
                    <span className='flex items-center gap-1 border border-neutral-200 px-2 py-0.5 rounded-lg bg-neutral-50'>
                      <IoLocationOutline size={12} />
                      {job.location || 'Sri Lanka'}
                    </span>
                    <span className='border border-neutral-200 px-2 py-0.5 rounded-lg bg-neutral-50'>
                      {job.mode || 'hybrid'}
                    </span>
                    <span className='border border-neutral-200 px-2 py-0.5 rounded-lg bg-neutral-50'>
                      {job.salary || 'Negotiable'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className='border-t border-neutral-100 pt-3 flex justify-end items-center gap-2'>
                  {applyTarget && (
                    <a 
                      href={applyTarget}
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
                    onClick={() => {
                      setTailorJob(job);
                      setTailorModalOpen(true);
                    }}
                    className='px-3 py-1.5 bg-neutral-900 text-white font-bold rounded-lg text-xs hover:bg-neutral-800 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
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

export default Bookmarks;
