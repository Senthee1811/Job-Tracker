import React from 'react'

const BackgroundGradient = () => {
  return (
    <section className='w-full h-full absolute -z-10'>
        <div className='w-24 h-24 rounded-full bg-lime-400/50 absolute top-0 left-0'></div>
        <div className='w-24 h-24 rounded-full bg-lime-400/50 absolute top-20 -left-4'></div>

    </section>
  )
}

export default BackgroundGradient