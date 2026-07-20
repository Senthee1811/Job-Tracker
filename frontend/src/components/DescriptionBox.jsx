import React from 'react'; 
import image1 from '../assets/Enthusiastic-bro.png';

const DescriptionBox = () => {
  return (
    <section className='max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 py-16 px-6 select-none'>
      <div className='flex-1 flex flex-col gap-5 text-left'>
        <h2 className='text-3xl md:text-5xl font-extrabold text-neutral-800 leading-tight'>
          Streamline Your Job Hunt <br /> 
          <span className='text-[#a3e635] font-playwrite font-light inline-block mt-1'>Journey.</span>
        </h2>

        <div className='flex flex-col gap-2 mt-2'>
          <h4 className='text-lg font-bold text-neutral-400 tracking-wide uppercase text-xs md:text-sm'>
            About this project.
          </h4>
          <p className='text-neutral-600 font-normal leading-relaxed text-sm md:text-base'>
            As fresh graduates, navigating the job search can be overwhelming—managing applications, tracking deadlines, and staying prepared for interviews. This platform is designed to simplify your job hunt by reducing the time spent organizing and minimizing stress. Focus on what truly matters—preparing for your dream job—while our application helps you stay on top of every opportunity with ease.
          </p>
        </div>
      </div>
      
      <div className='flex-1 max-w-md w-full flex items-center justify-center'>
        <img 
          src={image1} 
          alt="Graduate celebrating job search illustration" 
          className='w-full h-auto object-contain drop-shadow-md hover:rotate-2 transition-transform duration-300'
        />
      </div>
    </section>
  );
};

export default DescriptionBox;