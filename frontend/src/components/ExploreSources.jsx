import React from 'react';

const ExploreSources = ({ setActiveTab, setSelectedSource }) => {
  const sources = [
    {
      id: 'topjobs',
      name: 'TopJobs.lk',
      logoText: 'TJ',
      bgColor: 'bg-blue-600',
      textColor: 'text-white font-extrabold text-2xl md:text-3xl font-mono'
    },
    {
      id: 'itpro',
      name: 'ITPro.lk',
      logoText: 'IT',
      bgColor: 'bg-emerald-600',
      textColor: 'text-white font-black text-2xl md:text-3xl'
    },
    {
      id: 'xpressjobs',
      name: 'XpressJobs',
      logoText: 'XJ',
      bgColor: 'bg-purple-600',
      textColor: 'text-white font-extrabold text-2xl md:text-3xl'
    },
    {
      id: 'ikman',
      name: 'ikman Jobs',
      logoText: 'ik',
      bgColor: 'bg-amber-500',
      textColor: 'text-neutral-950 font-black text-2xl md:text-3xl font-sans'
    },
    {
      id: 'rooster',
      name: 'Rooster.jobs',
      logoText: 'RJ',
      bgColor: 'bg-rose-500',
      textColor: 'text-white font-extrabold text-xl md:text-2xl font-sans'
    }
  ];

  const handleSourceClick = (sourceId) => {
    setSelectedSource(sourceId);
    setActiveTab('explore');
  };

  return (
    <section className='relative max-w-4xl mx-auto flex flex-col items-center justify-center gap-6 py-12 px-6 text-center select-none'>
      <h3 className='text-xl md:text-2xl font-bold text-neutral-800'>
        Discover Vacancies Across Top Sri Lankan IT Boards
      </h3>

      <div className='flex flex-wrap items-center justify-center gap-4 md:gap-8 my-4'>
        {sources.map((src) => (
          <button
            key={src.id}
            onClick={() => handleSourceClick(src.id)}
            className={`${src.bgColor} w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center border-2 border-neutral-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer`}
            title={`Explore jobs on ${src.name}`}
          >
            <span className={src.textColor}>
              {src.logoText}
            </span>
          </button>
        ))}
      </div>

      <p className='text-xs md:text-sm text-neutral-500 font-medium max-w-lg'>
        Aggregated daily, normalized into unified data models, and matched to your candidate profile with RAG intelligence.
      </p>
    </section>
  );
};

export default ExploreSources;
