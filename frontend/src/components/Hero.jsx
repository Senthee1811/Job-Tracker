import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Hero = ({ setActiveTab, onOpenAuth }) => {
  const { user } = useAuth();

  const handleStart = () => {
    if (user) {
      setActiveTab('tracker');
    } else {
      onOpenAuth();
    }
  };

  return (
    <section className='relative max-w-5xl mx-auto flex flex-col items-center justify-center gap-8 py-16 px-6 text-center select-none'>
      <div className='flex flex-col items-center justify-center w-full gap-6'>
        <h1 className='text-4xl md:text-7xl font-extrabold text-neutral-800 tracking-tight leading-tight'>
          Track Your Job Applications <br />
          with <span className='text-[#a3e635] font-playwrite font-light inline-block transform hover:scale-105 transition-transform duration-300'>Ease</span>
        </h1>
        
        <p className='text-base md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed'>
          Manage your job applications, bookmark opportunities, and stay on top of every stage of the process—all in one place.
        </p>
        
        <button
          onClick={handleStart}
          className='inline-block rounded-lg bg-[#a3e635] px-8 py-3.5 border-2 border-neutral-900 font-bold text-neutral-900 mt-4 cursor-pointer hover:bg-lime-400 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
        >
          Let's get started
        </button>
      </div>
    </section>
  );
};

export default Hero;