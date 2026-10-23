import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ExploreSources from './components/ExploreSources';
import DescriptionBox from './components/DescriptionBox';
import Footer from './components/Footer';
import BackgroundGradient from './components/BackgroundGradient';
import AuthModal from './components/AuthModal';
import AutoApplyModal from './components/AutoApplyModal';
import TailorCvModal from './components/TailorCvModal';
import { useAuth } from './contexts/AuthContext';

// Route-level code splitting with React.lazy
const Dashboard = lazy(() => import('./components/Dashboard'));
const JobTable = lazy(() => import('./components/JobTable'));
const AutomationPanel = lazy(() => import('./components/AutomationPanel'));
const ExploreJobs = lazy(() => import('./components/ExploreJobs'));
const Bookmarks = lazy(() => import('./components/Bookmarks'));
const Profile = lazy(() => import('./components/Profile'));

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

// Route Suspense Loading Fallback
const RouteLoading = () => (
  <div className='flex flex-col items-center justify-center min-h-[50vh] space-y-3 animate-in fade-in duration-200'>
    <div className='animate-spin rounded-full h-10 w-10 border-4 border-neutral-200 border-t-neutral-900' />
    <span className='text-xs font-bold text-neutral-500 font-mono'>Loading view...</span>
  </div>
);

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [tailorModalOpen, setTailorModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedTailoredCvId, setSelectedTailoredCvId] = useState(null);
  const [selectedSource, setSelectedSource] = useState('all');
  
  // Bookmarks state (persistent)
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bookmarks') || '[]');
    } catch {
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
  }, [user, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 relative overflow-hidden">
        <BackgroundGradient />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  const handleToggleBookmark = (job) => {
    const jobId = job._id || job.id || job.dedupeHash;
    setBookmarks((prev) => {
      const exists = prev.some((b) => (b._id || b.id || b.dedupeHash) === jobId);
      if (exists) {
        return prev.filter((b) => (b._id || b.id || b.dedupeHash) !== jobId);
      } else {
        return [...prev, job];
      }
    });
  };

  const handleOpenAutoApply = (job, tailoredCvId = null) => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      setSelectedJob(job);
      setSelectedTailoredCvId(tailoredCvId);
      setApplyModalOpen(true);
    }
  };

  const handleOpenTailorCv = (job) => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      setSelectedJob(job);
      setTailorModalOpen(true);
    }
  };

  return (
    <div className='min-h-screen flex flex-col justify-between relative bg-neutral-50'>
      <BackgroundGradient />
      
      <div>
        <Navbar 
          onOpenAuth={() => setAuthModalOpen(true)} 
        />

        {/* View Routes wrapped in Suspense for route-level code splitting */}
        <Suspense fallback={<RouteLoading />}>
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
                    Your Tracked <span className='text-[#a3e635]'>Jobs</span>
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
        </Suspense>
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
        tailoredCvId={selectedTailoredCvId}
        onClose={() => { setApplyModalOpen(false); setSelectedJob(null); setSelectedTailoredCvId(null); }}
      />

      <TailorCvModal
        isOpen={tailorModalOpen}
        job={selectedJob}
        onClose={() => { setTailorModalOpen(false); setSelectedJob(null); }}
        onApplyAssisted={(job, tailoredCvId) => {
          setTailorModalOpen(false);
          handleOpenAutoApply(job, tailoredCvId);
        }}
      />
    </div>
  );
}

export default App;
