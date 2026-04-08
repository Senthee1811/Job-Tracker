import React from 'react'
import JobTable from './JobTable'

const TrackJob = () => {
  return (
    <section className='flex flex-col items-center justify-center'>
        <div className='max-w-5xl flex flex-col items-center justify-center gap-4'>
            <h1 className='text-7xl'>Your Tracked <span className='text-lime-400/80 font-playwrite font-light'>Jobs</span> </h1>
            <p className='text-center text-neutral-600 text-3xl max-w-4xl leading-snug'>Track your job applications in one place with company details, statuses, and quick actions. Use search and filters to stay organized and in control. </p>
        </div>
        {/* Table Replica Component */}
        <JobTable />
    </section>
  )
}

export default TrackJob