import React, { useState } from 'react';
import { 
  IoBookmarkOutline, 
  IoBookmark, 
  IoLocationOutline, 
  IoLogoLinkedin, 
  IoFlashOutline, 
  IoLogoGoogle, 
  IoBriefcaseOutline,
  IoSearchOutline
} from 'react-icons/io5';

// Mock Jobs data
const MOCK_JOBS = [
  {
    id: 'job-1',
    company: 'Google',
    title: 'Senior Frontend Engineer',
    category: 'Software Engineering',
    source: 'google',
    location: 'Mountain View, CA',
    mode: 'hybrid',
    salary: 175000,
    requirements: '5+ years of experience with React, TypeScript, and large-scale web applications. Passion for building highly performant UIs and complex layouts.',
    link: 'careers.google.com/jobs/senior-frontend'
  },
  {
    id: 'job-2',
    company: 'Meta',
    title: 'React Developer (Contract)',
    category: 'Frontend Development',
    source: 'linkedin',
    location: 'Remote, US',
    mode: 'remote',
    salary: 140000,
    requirements: 'Strong experience with React, State Management, and Tailwind CSS. Ability to ship high-quality products independently.',
    link: 'linkedin.com/jobs/view/meta-react'
  },
  {
    id: 'job-3',
    company: 'Stripe',
    title: 'Full Stack Engineer',
    category: 'Full Stack Development',
    source: 'indeed',
    location: 'San Francisco, CA',
    mode: 'hybrid',
    salary: 160000,
    requirements: 'Solid background in React, Node.js, Express, and PostgreSQL. Familiarity with payment gateway integrations and security compliance.',
    link: 'indeed.com/view/stripe-fullstack'
  },
  {
    id: 'job-4',
    company: 'Netflix',
    title: 'Senior UI Engineer',
    category: 'Software Engineering',
    source: 'glassdoor',
    location: 'Los Gatos, CA',
    mode: 'on-site',
    salary: 190000,
    requirements: 'Expertise in modern JavaScript, HTML5, CSS3, and rendering performance. Experience building interactive data visualization dashboards.',
    link: 'glassdoor.com/job/netflix-ui'
  },
  {
    id: 'job-5',
    company: 'Tech StartUp',
    title: 'Build a Responsive SaaS App',
    category: 'Web Development',
    source: 'upwork',
    location: 'Remote',
    mode: 'remote',
    salary: 8000,
    requirements: 'Need a developer to convert Figma designs into a fully functional Next.js + Tailwind web application. Estimated length: 2 months.',
    link: 'upwork.com/jobs/saas-app'
  },
  {
    id: 'job-6',
    company: 'Airbnb',
    title: 'Staff Full Stack Developer',
    category: 'Software Engineering',
    source: 'linkedin',
    location: 'Seattle, WA',
    mode: 'remote',
    salary: 210000,
    requirements: 'Experience architectural patterns in React, Node, and GraphQL. Leading cross-functional teams to build guest experience modules.',
    link: 'linkedin.com/jobs/view/airbnb-staff'
  },
  {
    id: 'job-7',
    company: 'Shopify',
    title: 'Backend Engineer',
    category: 'Backend Development',
    source: 'indeed',
    location: 'Remote, Canada',
    mode: 'remote',
    salary: 135000,
    requirements: 'Ruby on Rails, Node.js, and Redis database management. Experience scaling web sockets and managing large throughput messaging queues.',
    link: 'indeed.com/view/shopify-backend'
  },
  {
    id: 'job-8',
    company: 'Google',
    title: 'Associate Product Manager',
    category: 'Product Management',
    source: 'google',
    location: 'New York, NY',
    mode: 'hybrid',
    salary: 130000,
    requirements: '1-3 years of product experience or technical degree. Analytical background with experience working directly with engineering teams.',
    link: 'careers.google.com/jobs/apm'
  },
  {
    id: 'job-9',
    company: 'E-Commerce Corp',
    title: 'Integrate Stripe Payments',
    category: 'Web Development',
    source: 'upwork',
    location: 'Remote',
    mode: 'remote',
    salary: 3500,
    requirements: 'Looking for a payments expert to wire Stripe subscription models into our existing React + Node SaaS portal.',
    link: 'upwork.com/jobs/stripe-payments'
  },
  {
    id: 'job-10',
    company: 'Amazon',
    title: 'Cloud DevOps Architect',
    category: 'DevOps & Systems',
    source: 'glassdoor',
    location: 'Austin, TX',
    mode: 'on-site',
    salary: 165000,
    requirements: 'AWS certifications required. Experience building Terraform scripts, Docker pipelines, Kubernetes orchestration clusters, and scaling infrastructure.',
    link: 'glassdoor.com/job/amazon-devops'
  }
];

const ExploreJobs = ({ 
  selectedSource, 
  setSelectedSource, 
  onAutoApply, 
  bookmarks, 
  onToggleBookmark 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredJobs = MOCK_JOBS.filter(job => {
    const matchesSource = selectedSource === 'all' || job.source === selectedSource;
    const matchesSearch = 
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSource && matchesSearch;
  });

  return (
    <div className='max-w-5xl mx-auto px-6 py-12 select-none'>
      
      {/* Search and Filters toolbar */}
      <div className='flex flex-col md:flex-row items-center justify-between gap-6 mb-10'>
        
        {/* Platform source selector buttons */}
        <div className='flex flex-wrap gap-2.5 items-center justify-center bg-white border-2 border-black p-1.5 rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'>
          {['all', 'google', 'linkedin', 'indeed', 'glassdoor', 'upwork'].map((src) => (
            <button
              key={src}
              onClick={() => setSelectedSource(src)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                selectedSource === src
                  ? 'bg-[#a3e635] text-neutral-900 border border-neutral-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              {src === 'all' ? 'All Platforms' : src}
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className='relative w-full md:w-80 flex items-center bg-white border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-3 py-2'>
          <input
            type="text"
            placeholder="Search roles, skills, or companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='bg-transparent text-neutral-800 placeholder-neutral-400 text-sm outline-none w-full pl-6'
          />
          <IoSearchOutline className='absolute left-3 text-neutral-500' size={18} />
        </div>

      </div>

      {/* Grid of Job Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {filteredJobs.length === 0 ? (
          <div className='col-span-1 md:col-span-2 text-center py-16 bg-neutral-100/50 rounded-2xl border border-neutral-200'>
            <p className='text-neutral-500 font-medium'>No active jobs match your criteria. Try another filter!</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isBookmarked = bookmarks.some(b => b.id === job.id);
            return (
              <div 
                key={job.id} 
                className='bg-white rounded-2xl border-2 border-neutral-900 p-5 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all'
              >
                
                {/* Top Section: Company logo, Title, bookmark */}
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
                    className='text-neutral-400 hover:text-amber-500 p-1 border border-neutral-100 hover:border-amber-200 hover:bg-amber-50 rounded-lg transition-all cursor-pointer'
                    title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Job'}
                  >
                    {isBookmarked ? (
                      <IoBookmark className='text-amber-500' size={20} />
                    ) : (
                      <IoBookmarkOutline size={20} />
                    )}
                  </button>
                </div>

                {/* Details paragraph */}
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

                {/* Bottom Trigger button */}
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
            );
          })
        )}
      </div>

    </div>
  );
};

export default ExploreJobs;
export { MOCK_JOBS };
