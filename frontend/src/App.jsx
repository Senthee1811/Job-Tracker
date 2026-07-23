import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import Dashboard from './components/Dashboard';
import AutomationPanel from './components/AutomationPanel';
import { useAuth } from './contexts/AuthContext';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[50vh] text-neutral-500 font-mono text-sm'>
        Verifying secure session...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedSource, setSelectedSource] = useState('all');
  
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

  // Redirect authenticated user away from landing page
  useEffect(() => {
    if (user && location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [user, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 relative overflow-hidden">
        <BackgroundGradient />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

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

  return (
    <div className='min-h-screen flex flex-col justify-between relative bg-neutral-50'>
      <BackgroundGradient />
      
      <div>
        <Navbar 
          onOpenAuth={() => setAuthModalOpen(true)} 
        />

        {/* View Routes */}
        <Routes>
          {/* Landing page */}
          <Route path="/" element={
            user ? <Navigate to="/dashboard" replace /> : (
              <div className='flex flex-col gap-6 animate-in fade-in duration-300'>
                <Hero 
                  setActiveTab={(tab) => navigate(`/${tab}`)} 
                  onOpenAuth={() => setAuthModalOpen(true)} 
                />
                <ExploreSources 
                  setActiveTab={(tab) => navigate(`/${tab}`)} 
                  setSelectedSource={setSelectedSource} 
                />
                <DescriptionBox />
              </div>
            )
          } />

          {/* Authenticated Dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard setActiveTab={(tab) => navigate(`/${tab}`)} />
            </ProtectedRoute>
          } />

          {/* Job tracking spreadsheet */}
          <Route path="/tracker" element={
            <ProtectedRoute>
              <div className='py-8 animate-in fade-in duration-300 flex flex-col items-center justify-center text-center'>
                <h3 className='text-3xl font-extrabold text-neutral-800 tracking-tight leading-tight mb-2'>
                  Your Tracked <span className='text-[#a3e635] font-playwrite font-light'>Jobs</span>
                </h3>
                <p className='text-xs md:text-sm text-neutral-500 font-medium max-w-lg leading-relaxed mb-6 px-6'>
                  Track your job applications in one place with company details, statuses, and quick actions.
                </p>
                <JobTable />
              </div>
            </ProtectedRoute>
          } />

          {/* Batch Automation cockpit */}
          <Route path="/automation" element={
            <ProtectedRoute>
              <AutomationPanel />
            </ProtectedRoute>
          } />

          {/* Explore job vacancies */}
          <Route path="/explore" element={
            <ProtectedRoute>
              <ExploreJobs 
                selectedSource={selectedSource} 
                setSelectedSource={setSelectedSource} 
                onAutoApply={handleOpenAutoApply}
                bookmarks={bookmarks}
                onToggleBookmark={handleToggleBookmark}
              />
            </ProtectedRoute>
          } />

          {/* Bookmarked listings */}
          <Route path="/bookmarks" element={
            <ProtectedRoute>
              <Bookmarks 
                bookmarks={bookmarks} 
                onToggleBookmark={handleToggleBookmark} 
                onAutoApply={handleOpenAutoApply} 
              />
            </ProtectedRoute>
          } />

          {/* Candidate Profile Details & CV Uploader */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Default fallback redirects home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {!user && <Footer setActiveTab={(tab) => navigate(`/${tab}`)} />}

      {/* Global Modals Overlays */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />

      <AutoApplyModal
        isOpen={applyModalOpen}
        job={selectedJob}
        onClose={() => { setApplyModalOpen(false); setSelectedJob(null); }}
      />
    </div>
  );
}

export default App;
