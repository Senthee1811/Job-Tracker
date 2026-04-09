import React from 'react'; 
import image1 from '../assets/Enthusiastic-bro.png';

const DescriptionBox = () => {
  return (
    <section className='flex items-center justify-center gap-6'>
        <div className='max-w-3xl flex flex-col gap-4'>
            <h2 className='text-3xl'>Streamline Your Job Hunt <br /> <span className='font-playwrite font-light'>Journey.</span></h2>

            <h4 className='text-2xl text-neutral-400'>About this project.</h4>
            <p className='text-2xl font-light'>As fresh graduates, navigating the job search can be overwhelming and managing applications, tracking deadlines, and staying prepared for interviews. This platform is designed to simplify your job hunt by reducing the time spent organizing and minimizing  stress. Focus on what truly matters and preparing your dream job while our application helps you stay on top of every opportunity with ease.</p>
        </div>
        <div className='max-w-3xl object-cover flex items-center justify-center'>
           <img src={image1} alt="image" className='w-full'/>
        </div>
    </section>
  )
}

export default DescriptionBox