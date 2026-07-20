import React from 'react';

const ExploreSources = ({ setActiveTab, setSelectedSource }) => {
  const sources = [
    {
      id: 'google',
      name: 'Google Jobs',
      logoText: 'G+',
      bgColor: 'bg-[#ea4335]',
      textColor: 'text-white font-extrabold text-2xl md:text-3xl'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      logoText: 'in',
      bgColor: 'bg-[#0077b5]',
      textColor: 'text-white font-serif italic font-bold text-2xl md:text-3xl lower'
    },
    {
      id: 'indeed',
      name: 'Indeed',
      logoText: 'i',
      bgColor: 'bg-[#002f87]',
      textColor: 'text-white font-bold text-3xl md:text-4xl font-sans'
    },
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      logoText: '[]',
      bgColor: 'bg-[#00c26b]',
      textColor: 'text-white font-mono font-bold text-2xl md:text-3xl'
    },
    {
      id: 'upwork',
      name: 'Upwork',
      logoText: 'up',
      bgColor: 'bg-[#14a800]',
      textColor: 'text-white font-bold text-xl md:text-2xl font-sans'
    }
  ];

  const handleSourceClick = (sourceId) => {
    setSelectedSource(sourceId);
    setActiveTab('explore');
  };

  return (
    <section className='relative max-w-4xl mx-auto flex flex-col items-center justify-center gap-6 py-12 px-6 text-center select-none'>
      <h3 className='text-xl md:text-2xl font-bold text-neutral-800'>
        Let's explore the place to earn.
      </h3>

      <div className='flex flex-wrap items-center justify-center gap-4 md:gap-8 my-4'>
        {sources.map((src) => (
          <button
            key={src.id}
            onClick={() => handleSourceClick(src.id)}
            className={`${src.bgColor} w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center border-2 border-neutral-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer`}
            title={`Explore jobs on ${src.name}`}
          >
            <span className={src.textColor}>{src.logoText}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => handleSourceClick('all')}
        className='bg-[#a3e635] text-neutral-900 font-bold px-6 py-2 border-2 border-neutral-900 rounded-lg hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-sm'
      >
        More Places
      </button>
    </section>
  );
};

export default ExploreSources;
