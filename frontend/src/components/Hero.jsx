import React from 'react'
import BackgroundGradient from './BackgroundGradient'
const Hero = () => {
  return (
      <section className='relative max-w-5xl mx-auto flex flex-col items-center justify-center py-24 gap-12 mt-20'>   
        <div className='flex flex-col items-center justify-center w-full'>
            <h1 className='text-left text-6xl md:text-7xl p-8 font-semibold text-neutral-800'>Track Your Job Applications <br /> with <span className='text-lime-400/80 font-playwrite font-light'>Ease</span></h1>
            <p className='text-left text-neutral-600 text-3xl max-w-4xl leading-snug'>Manage your job applications, bookmark opportunities, and stay on top of every stage of the process - all in one place.</p>
            <a className='inline-block rounded-lg bg-lime-500 px-6 py-3 border-2 border-black mt-8'>Let's get started</a>
        </div>
      </section>
      
  )
}

export default Hero