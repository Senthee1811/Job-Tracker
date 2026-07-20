import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ExploreSources from './components/ExploreSources';
import JobTable from './components/JobTable';
import DescriptionBox from './components/DescriptionBox';
import Footer from './components/Footer';
import BackgroundGradient from './components/BackgroundGradient';
import AuthModal from './components/AuthModal';
import ExploreJobs from './components/ExploreJobs';
import AutoApplyModal from './components/AutoApplyModal';
import Bookmarks from './components/Bookmarks';
import Profile from './components/Profile';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedSource, setSelectedSource] = useState('all');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Bookmarks state (persistent)
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bookmarks') || '[]');
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Clean bookmarks on user logout
  useEffect(() => {
    if (!user) {
      setBookmarks([]);
    }
  }, [user]);

  const handleToggleBookmark = (job) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === job.id);
      if (exists) {
        return prev.filter((b) => b.id !== job.id);
      } else {
        return [...prev, job];
      }
    });
  };

  const handleOpenAutoApply = (job) => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      setSelectedJob(job);
      setApplyModalOpen(true);
    }
  };

  const handleApplySuccess = () => {
    // We can trigger spreadsheet updates if needed
  };

  return (
    <div className='min-h-screen flex flex-col justify-between relative bg-neutral-50'>
      <BackgroundGradient />
      
      <div>
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenAuth={() => setAuthModalOpen(true)} 
        />

        {/* View Switcher Router */}
        {activeTab === 'home' && (
          <div className='flex flex-col gap-6 animate-in fade-in duration-300'>
            <Hero setActiveTab={setActiveTab} onOpenAuth={() => setAuthModalOpen(true)} />
            <ExploreSources setActiveTab={setActiveTab} setSelectedSource={setSelectedSource} />
            
            {/* Show Tracked jobs on Landing Page if Logged In */}
            {user && (
              <div className='py-12 bg-lime-400/5 border-y border-lime-400/10 flex flex-col items-center justify-center gap-4 text-center select-none'>
                <h3 className='text-3xl font-extrabold text-neutral-800 tracking-tight leading-tight'>
                  Your Tracked <span className='text-[#a3e635] font-playwrite font-light'>Jobs</span>
                </h3>
                <p className='text-sm text-neutral-500 font-medium max-w-lg leading-relaxed px-6'>
                  Track your job applications in one place with company details, statuses, and quick actions. Use search and filters to stay organized and in control.
                </p>
                <JobTable />
              </div>
            )}

            <DescriptionBox />
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className='py-8 animate-in fade-in duration-300 flex flex-col items-center justify-center text-center'>
            <h3 className='text-3xl font-extrabold text-neutral-800 tracking-tight leading-tight mb-2'>
              Your Tracked <span className='text-[#a3e635] font-playwrite font-light'>Jobs</span>
            </h3>
            <p className='text-xs md:text-sm text-neutral-500 font-medium max-w-lg leading-relaxed mb-6 px-6'>
              Track your job applications in one place with company details, statuses, and quick actions. Use search and filters to stay organized and in control.
            </p>
            <JobTable />
          </div>
        )}

        {activeTab === 'explore' && (
          <div className='animate-in fade-in duration-300'>
            <ExploreJobs 
              selectedSource={selectedSource} 
              setSelectedSource={setSelectedSource} 
              onAutoApply={handleOpenAutoApply}
              bookmarks={bookmarks}
              onToggleBookmark={handleToggleBookmark}
            />
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className='animate-in fade-in duration-300'>
            <Bookmarks 
              bookmarks={bookmarks} 
              onToggleBookmark={handleToggleBookmark} 
              onAutoApply={handleOpenAutoApply} 
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className='animate-in fade-in duration-300'>
            <Profile />
          </div>
        )}
      </div>

      <Footer setActiveTab={setActiveTab} />

      {/* Global Modals Overlays */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />

      <AutoApplyModal
        isOpen={applyModalOpen}
        job={selectedJob}
        onClose={() => { setApplyModalOpen(false); setSelectedJob(null); }}
        onApplySuccess={handleApplySuccess}
      />
    </div>
  );
}

export default App;
