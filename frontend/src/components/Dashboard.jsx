import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  IoHomeOutline, 
  IoBarChartOutline, 
  IoListOutline, 
  IoBookmarkOutline, 
  IoSettingsOutline,
  IoSearchOutline,
  IoAddOutline,
  IoNotificationsOutline,
  IoEllipsisHorizontalOutline,
  IoCheckmarkCircleOutline,
  IoLogoGoogle,
  IoLogoLinkedin,
  IoTimeOutline,
  IoShieldCheckmarkOutline
} from 'react-icons/io5';

const Dashboard = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Manual job modal trigger
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const data = await api.getApplications();
        setApplications(data.applications || []);
      } catch (err) {
        console.error(err);
        if (err.message && err.message.toLowerCase().includes('no applications found')) {
          setApplications([]);
        } else {
          setError('Failed to load application statistics');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  // Aggregate stats
  const total = applications.length;
  const applied = applications.filter(a => a.status === 'applied').length;
  const interviewed = applications.filter(a => a.status === 'interviewed').length;
  const offered = applications.filter(a => a.status === 'offered').length;
  const rejected = applications.filter(a => a.status === 'rejected').length;

  const getPercentage = (count) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const appliedPct = getPercentage(applied);
  const interviewedPct = getPercentage(interviewed);
  const offeredPct = getPercentage(offered);

  // Date styling
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className='max-w-7xl mx-auto px-4 py-8 select-none font-sans text-neutral-800'>
      <div className='bg-white border-2 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row min-h-[80vh] relative z-10'>
        
        {/* PANEL 1: LEFT SIDEBAR */}
        <aside className='w-full md:w-60 border-b-2 md:border-b-0 md:border-r-2 border-black p-6 flex flex-col justify-between bg-lime-400/5 min-h-fit md:min-h-full'>
          <div className='flex flex-col gap-8'>
            {/* Logo */}
            <div className='flex items-center gap-2 border-b border-neutral-200 pb-4'>
              <div className='w-8 h-8 rounded-lg bg-[#a3e635] border-2 border-black flex items-center justify-center font-black text-neutral-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'>
                JT
              </div>
              <span className='font-bold text-lg tracking-tight'>JT Chaart</span>
            </div>

            {/* Profile Card */}
            <div className='flex flex-col items-center text-center gap-2 py-3 bg-white border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'>
              <div className='w-16 h-16 rounded-full bg-lime-100 border-2 border-black overflow-hidden relative flex items-center justify-center font-extrabold text-neutral-800 text-xl shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'>
                {user?.firstname?.[0]?.toUpperCase()}{user?.lastname?.[0]?.toUpperCase()}
              </div>
              <div>
                <h4 className='font-extrabold text-sm text-neutral-900'>{user?.firstname} {user?.lastname}</h4>
                <p className='text-xxs font-semibold text-neutral-400 truncate max-w-[150px]'>{user?.email}</p>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className='flex flex-col gap-2'>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className='flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold bg-[#a3e635] border-2 border-black text-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              >
                <IoHomeOutline size={16} />
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('tracker')}
                className='flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors'
              >
                <IoListOutline size={16} />
                Job Tracker
              </button>
              <button 
                onClick={() => setActiveTab('explore')}
                className='flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors'
              >
                <IoBarChartOutline size={16} />
                Explored Board
              </button>
              <button 
                onClick={() => setActiveTab('bookmarks')}
                className='flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors'
              >
                <IoBookmarkOutline size={16} />
                Bookmarks
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className='flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors'
              >
                <IoSettingsOutline size={16} />
                Settings
              </button>
            </nav>
          </div>
          
          <div className='text-xxs font-semibold text-neutral-400 mt-6 border-t border-neutral-200 pt-4'>
            © {new Date().getFullYear()} JT Tracker Inc.
          </div>
        </aside>

        {/* PANEL 2: CENTER MAIN CONTENT */}
        <main className='flex-1 p-6 md:p-8 flex flex-col gap-8 text-left overflow-y-auto max-h-[85vh] scrollbar-thin scrollbar-thumb-neutral-200'>
          
          {/* Main Header */}
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-4'>
            <div>
              <h2 className='text-2xl md:text-3xl font-extrabold text-neutral-900'>
                Hello, {user?.firstname}
              </h2>
              <p className='text-xxs md:text-xs text-neutral-400 font-bold tracking-wide uppercase mt-1'>
                Today is {today}
              </p>
            </div>
            
            <div className='flex items-center gap-3 w-full md:w-auto'>
              <button 
                onClick={() => setActiveTab('tracker')}
                className='bg-white border-2 border-black p-2 rounded-xl hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer'
              >
                <IoSearchOutline size={18} />
              </button>
              <button 
                onClick={() => setActiveTab('explore')}
                className='flex-1 md:flex-none bg-neutral-950 text-white font-extrabold text-xs px-4 py-2.5 border-2 border-black rounded-xl hover:bg-neutral-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5'
              >
                <IoAddOutline size={16} />
                Add New Project
              </button>
            </div>
          </div>

          {/* Project Cards Row */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {/* Card 1: Purple (Web Dev / Applied) */}
            <div className='bg-[#581c87] text-white rounded-3xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between min-h-[160px] relative overflow-hidden'>
              <div className='absolute right-[-20px] top-[-20px] w-24 h-24 rounded-full bg-white/5'></div>
              <div className='flex justify-between items-start'>
                <span className='bg-white/10 text-white font-bold text-xxs px-2.5 py-0.5 rounded-full border border-white/20 uppercase'>
                  Applied
                </span>
                <IoEllipsisHorizontalOutline className='text-white/70 cursor-pointer hover:text-white' size={18} />
              </div>
              <div className='mt-4'>
                <h4 className='text-lg font-extrabold leading-snug'>Web Development</h4>
                <p className='text-xxs text-purple-200 font-semibold mt-1'>{applied} applications | {appliedPct}% rate</p>
              </div>
              <div className='mt-4 flex flex-col gap-1.5'>
                <div className='w-full bg-white/20 rounded-full h-2 p-0.5'>
                  <div className='bg-[#a3e635] h-full rounded-full transition-all duration-300' style={{ width: `${appliedPct}%` }}></div>
                </div>
              </div>
            </div>

            {/* Card 2: Teal (Mobile App Design / Interview) */}
            <div className='bg-[#0d9488] text-white rounded-3xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between min-h-[160px] relative overflow-hidden'>
              <div className='absolute right-[-20px] top-[-20px] w-24 h-24 rounded-full bg-white/5'></div>
              <div className='flex justify-between items-start'>
                <span className='bg-white/10 text-white font-bold text-xxs px-2.5 py-0.5 rounded-full border border-white/20 uppercase'>
                  Interviewed
                </span>
                <IoEllipsisHorizontalOutline className='text-white/70 cursor-pointer hover:text-white' size={18} />
              </div>
              <div className='mt-4'>
                <h4 className='text-lg font-extrabold leading-snug'>Mobile App Design</h4>
                <p className='text-xxs text-teal-100 font-semibold mt-1'>{interviewed} scheduled | {interviewedPct}% rate</p>
              </div>
              <div className='mt-4 flex flex-col gap-1.5'>
                <div className='w-full bg-white/20 rounded-full h-2 p-0.5'>
                  <div className='bg-[#a3e635] h-full rounded-full transition-all duration-300' style={{ width: `${interviewedPct}%` }}></div>
                </div>
              </div>
            </div>

            {/* Card 3: Orange (UI Kit / Offered) */}
            <div className='bg-[#ea580c] text-white rounded-3xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between min-h-[160px] relative overflow-hidden'>
              <div className='absolute right-[-20px] top-[-20px] w-24 h-24 rounded-full bg-white/5'></div>
              <div className='flex justify-between items-start'>
                <span className='bg-white/10 text-white font-bold text-xxs px-2.5 py-0.5 rounded-full border border-white/20 uppercase'>
                  Offered
                </span>
                <IoEllipsisHorizontalOutline className='text-white/70 cursor-pointer hover:text-white' size={18} />
              </div>
              <div className='mt-4'>
                <h4 className='text-lg font-extrabold leading-snug'>Facebook Brand UI Kit</h4>
                <p className='text-xxs text-orange-100 font-semibold mt-1'>{offered} received | {offeredPct}% rate</p>
              </div>
              <div className='mt-4 flex flex-col gap-1.5'>
                <div className='w-full bg-white/20 rounded-full h-2 p-0.5'>
                  <div className='bg-[#a3e635] h-full rounded-full transition-all duration-300' style={{ width: `${offeredPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Lower Columns: Tasks & Stats */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            
            {/* Left: Tasks for today */}
            <div className='flex flex-col gap-4'>
              <h3 className='text-sm font-extrabold text-neutral-900 uppercase border-b border-neutral-100 pb-2'>
                Tasks for today
              </h3>
              
              <div className='flex flex-col gap-3.5'>
                {/* Task Item 1 */}
                <div className='bg-white border-2 border-black rounded-2xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-l-8 border-l-[#ea580c] flex justify-between items-center'>
                  <div>
                    <h4 className='font-extrabold text-sm text-neutral-900'>Mobile App</h4>
                    <p className='text-xxs text-neutral-400 font-bold uppercase mt-0.5'>Prepare Figma file</p>
                  </div>
                  <IoCheckmarkCircleOutline className='text-neutral-300' size={22} />
                </div>

                {/* Task Item 2 */}
                <div className='bg-white border-2 border-black rounded-2xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-l-8 border-l-[#581c87] flex justify-between items-center'>
                  <div>
                    <h4 className='font-extrabold text-sm text-neutral-900'>UX wireframes</h4>
                    <p className='text-xxs text-neutral-400 font-bold uppercase mt-0.5'>Design UX wireframes</p>
                  </div>
                  <IoCheckmarkCircleOutline className='text-neutral-300' size={22} />
                </div>

                {/* Task Item 3 */}
                <div className='bg-white border-2 border-black rounded-2xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-l-8 border-l-[#0d9488] flex justify-between items-center'>
                  <div>
                    <h4 className='font-extrabold text-sm text-neutral-900'>Mobile App</h4>
                    <p className='text-xxs text-neutral-400 font-bold uppercase mt-0.5'>Research</p>
                  </div>
                  <IoCheckmarkCircleOutline className='text-emerald-500' size={22} />
                </div>
              </div>
            </div>

            {/* Right: Statistics */}
            <div className='flex flex-col gap-4'>
              <h3 className='text-sm font-extrabold text-neutral-900 uppercase border-b border-neutral-100 pb-2'>
                Statistics
              </h3>

              <div className='grid grid-cols-3 gap-4 mb-4'>
                <div className='bg-[#e4ffd4]/20 border-2 border-black rounded-2xl p-3 text-center flex flex-col items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'>
                  <span className='text-lg font-extrabold'>{total}</span>
                  <span className='text-[8px] font-bold text-neutral-400 uppercase tracking-wide leading-tight'>Tracked time</span>
                </div>
                <div className='bg-white border-2 border-black rounded-2xl p-3 text-center flex flex-col items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'>
                  <span className='text-lg font-extrabold'>{offered + interviewed}</span>
                  <span className='text-[8px] font-bold text-neutral-400 uppercase tracking-wide leading-tight'>Finished tasks</span>
                </div>
                <div 
                  onClick={() => setActiveTab('explore')}
                  className='border-2 border-dashed border-neutral-400 hover:border-black rounded-2xl p-3 text-center flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-neutral-50 transition-colors'
                >
                  <IoAddOutline size={20} className='text-neutral-500' />
                  <span className='text-[8px] font-bold text-neutral-400 uppercase tracking-wide leading-tight'>New widget</span>
                </div>
              </div>

              {/* Promo pro banner */}
              <div className='bg-[#a3e635]/10 border-2 border-neutral-950 rounded-2xl p-4 flex items-center justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden'>
                <div className='flex flex-col gap-1 text-left relative z-10'>
                  <span className='text-lg font-extrabold text-neutral-900'>$9.99 <span className='text-xs font-semibold'>p/m</span></span>
                  <h4 className='text-xs font-black text-neutral-900 mt-0.5'>Pro Plan</h4>
                  <p className='text-[10px] text-neutral-500 font-semibold leading-normal max-w-[150px]'>More productivity with premium!</p>
                </div>
                
                {/* Circle badge */}
                <div className='w-12 h-12 rounded-full bg-[#a3e635] border-2 border-black flex items-center justify-center text-xs font-black rotate-12 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'>
                  PRO
                </div>
              </div>
            </div>

          </div>

        </main>

        {/* PANEL 3: RIGHT CALENDAR SIDEBAR */}
        <aside className='w-full md:w-60 border-t-2 md:border-t-0 md:border-l-2 border-black p-6 flex flex-col gap-6 bg-lime-400/5'>
          
          <div className='flex justify-between items-center border-b border-neutral-200 pb-4'>
            <span className='font-extrabold text-sm tracking-wider text-neutral-800 uppercase'>Calendar</span>
            <button className='bg-white border-2 border-black p-1.5 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'>
              <IoNotificationsOutline size={16} />
            </button>
          </div>

          <div className='flex flex-col gap-6 text-left overflow-y-auto max-h-[70vh] pr-1'>
            {/* Event Day 1 */}
            <div className='flex flex-col gap-3'>
              <span className='text-[10px] font-extrabold tracking-widest text-neutral-400 uppercase'>Oct 20, 2026</span>
              <div className='flex flex-col gap-2.5'>
                <div className='flex gap-3 pl-2 border-l-2 border-l-[#a3e635]'>
                  <span className='text-[10px] font-black text-neutral-900 self-start mt-0.5'>10:00</span>
                  <div>
                    <h5 className='text-xs font-bold text-neutral-800 leading-tight'>Dribbble shot</h5>
                    <p className='text-[10px] font-semibold text-neutral-400'>Facebook Brand</p>
                  </div>
                </div>
                <div className='flex gap-3 pl-2 border-l-2 border-l-[#ea580c]'>
                  <span className='text-[10px] font-black text-neutral-900 self-start mt-0.5'>13:20</span>
                  <div>
                    <h5 className='text-xs font-bold text-neutral-800 leading-tight'>Design</h5>
                    <p className='text-[10px] font-semibold text-neutral-400'>Task Management</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Day 2 */}
            <div className='flex flex-col gap-3'>
              <span className='text-[10px] font-extrabold tracking-widest text-neutral-400 uppercase'>Oct 21, 2026</span>
              <div className='flex flex-col gap-2.5'>
                <div className='flex gap-3 pl-2 border-l-2 border-l-[#581c87]'>
                  <span className='text-[10px] font-black text-neutral-900 self-start mt-0.5'>10:00</span>
                  <div>
                    <h5 className='text-xs font-bold text-neutral-800 leading-tight'>UX Research</h5>
                    <p className='text-[10px] font-semibold text-neutral-400'>Sleep App</p>
                  </div>
                </div>
                <div className='flex gap-3 pl-2 border-l-2 border-l-[#0d9488]'>
                  <span className='text-[10px] font-black text-neutral-900 self-start mt-0.5'>13:20</span>
                  <div>
                    <h5 className='text-xs font-bold text-neutral-800 leading-tight'>Design</h5>
                    <p className='text-[10px] font-semibold text-neutral-400'>Task Management</p>
                  </div>
                </div>
                <div className='flex gap-3 pl-2 border-l-2 border-l-[#a3e635]'>
                  <span className='text-[10px] font-black text-neutral-900 self-start mt-0.5'>16:00</span>
                  <div>
                    <h5 className='text-xs font-bold text-neutral-800 leading-tight'>Dribbble shot</h5>
                    <p className='text-[10px] font-semibold text-neutral-400'>Meet Up</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Day 3 */}
            <div className='flex flex-col gap-3'>
              <span className='text-[10px] font-extrabold tracking-widest text-neutral-400 uppercase'>Oct 22, 2026</span>
              <div className='flex flex-col gap-2.5'>
                <div className='flex gap-3 pl-2 border-l-2 border-l-[#ea580c]'>
                  <span className='text-[10px] font-black text-neutral-900 self-start mt-0.5'>10:00</span>
                  <div>
                    <h5 className='text-xs font-bold text-neutral-800 leading-tight'>Dribbble shot</h5>
                    <p className='text-[10px] font-semibold text-neutral-400'>Meet Up</p>
                  </div>
                </div>
                <div className='flex gap-3 pl-2 border-l-2 border-l-[#581c87]'>
                  <span className='text-[10px] font-black text-neutral-900 self-start mt-0.5'>11:00</span>
                  <div>
                    <h5 className='text-xs font-bold text-neutral-800 leading-tight'>Design</h5>
                    <p className='text-[10px] font-semibold text-neutral-400'>Mobile App</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
};

export default Dashboard;
