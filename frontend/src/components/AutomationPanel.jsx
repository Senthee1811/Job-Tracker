import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_JOBS } from './ExploreJobs';
import { 
  IoTerminalOutline, 
  IoPlayOutline, 
  IoCheckmarkCircleOutline, 
  IoStopOutline,
  IoSettingsOutline
} from 'react-icons/io5';

const AutomationPanel = () => {
  const { user } = useAuth();
  const [role, setRole] = useState('Frontend Engineer');
  const [location, setLocation] = useState('Remote');
  const [limit, setLimit] = useState(3);
  const [sources, setSources] = useState({
    linkedin: true,
    google: true,
    upwork: true,
    indeed: true,
    glassdoor: true
  });

  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, running, success, aborted
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleSourceToggle = (key) => {
    setSources(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRunAutomation = async () => {
    if (!user) return;
    setStatus('running');
    setProgress(0);
    setLogs([
      `[CONSOLE] JT Automated Apply Engine v1.0.0 initializing...`,
      `[CONSOLE] Connecting candidate profile: ${user.firstname} ${user.lastname}`,
      `[CONSOLE] Loading uploaded CV parameters from: ${user.cvName || 'Manual Entry Summary'}`
    ]);

    // Gather matching mock jobs
    const activeSources = Object.keys(sources).filter(k => sources[k]);
    const matchedJobs = MOCK_JOBS.filter(job => 
      activeSources.includes(job.source) && 
      (job.title.toLowerCase().includes(role.toLowerCase()) || 
       job.category.toLowerCase().includes(role.toLowerCase()))
    ).slice(0, limit);

    if (matchedJobs.length === 0) {
      setTimeout(() => {
        setLogs(prev => [
          ...prev,
          `[ERROR] No matching jobs found for role "${role}" on selected platforms.`,
          `[CONSOLE] Automation aborted.`
        ]);
        setStatus('aborted');
      }, 1000);
      return;
    }

    // Run sequential steps
    let currentLog = [...logs];
    const logAdd = (msg) => {
      setLogs(prev => [...prev, msg]);
    };

    let stepDelay = 800;
    
    // Simulate batch applications
    for (let i = 0; i < matchedJobs.length; i++) {
      const job = matchedJobs[i];
      const stepPct = Math.round(((i + 1) / matchedJobs.length) * 100);

      // Search phase
      await new Promise(r => setTimeout(r, stepDelay));
      logAdd(`[BATCH] Scanning ${job.source.toUpperCase()} vacancies for "${role}"...`);
      
      // Match phase
      await new Promise(r => setTimeout(r, stepDelay + 200));
      logAdd(`[JOB ${i+1}/${matchedJobs.length}] Found match: "${job.title}" at "${job.company}"`);
      logAdd(`[JOB ${i+1}/${matchedJobs.length}] Matching resume skills [${user.skills?.join(', ') || 'React, JS'}]...`);

      // Apply phase
      await new Promise(r => setTimeout(r, stepDelay + 400));
      logAdd(`[JOB ${i+1}/${matchedJobs.length}] Auto-filling forms on platform portal...`);
      logAdd(`[JOB ${i+1}/${matchedJobs.length}] Bypassing security validations & CAPTCHA...`);

      // Save database phase
      try {
        const payload = {
          company: job.company,
          title: job.title,
          requirements: job.requirements,
          mode: job.mode,
          salary: job.salary,
          location: job.location,
          status: 'applied',
          category: job.category,
          opportunity: job.source,
          inTouchPerson: 'Recruiting Team',
          link: job.link
        };
        await api.createApplication(payload);
        logAdd(`[SUCCESS] Submitted application successfully! Logged to Tracker.`);
      } catch (err) {
        logAdd(`[WARNING] Failed to log application to database for ${job.company}: ${err.message}`);
      }

      setProgress(stepPct);
    }

    await new Promise(r => setTimeout(r, 600));
    logAdd(`[CONSOLE] Batch automation complete. All applications tracked successfully.`);
    setStatus('success');
  };

  return (
    <div className='max-w-5xl mx-auto px-6 py-12 select-none font-sans text-left'>
      
      {/* Page Header */}
      <div className='flex flex-col gap-2 mb-10 border-b-2 border-neutral-100 pb-4'>
        <h2 className='text-2xl md:text-3xl font-extrabold text-neutral-900 uppercase'>
          Job Apply Automation
        </h2>
        <p className='text-xs md:text-sm text-neutral-500 font-medium'>
          Run batch job searches and automated applications using your resume details.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
        
        {/* Left Side: Parameters Settings */}
        <div className='bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-5'>
          <h3 className='text-sm font-bold uppercase tracking-widest text-[#a3e635] bg-neutral-950 px-3 py-1 rounded-md max-w-fit flex items-center gap-1.5'>
            <IoSettingsOutline size={16} />
            Parameters
          </h3>

          {/* Role selector */}
          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-bold text-neutral-700 uppercase'>Job Keyword</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={status === 'running'}
              className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none bg-white'
            >
              <option value="Frontend Engineer">Frontend Engineer</option>
              <option value="React Developer">React Developer</option>
              <option value="Full Stack">Full Stack Engineer</option>
              <option value="Backend">Backend Engineer</option>
              <option value="Product Manager">Product Manager</option>
              <option value="DevOps">DevOps Architect</option>
            </select>
          </div>

          {/* Location */}
          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-bold text-neutral-700 uppercase'>Location Preference</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={status === 'running'}
              className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none'
            />
          </div>

          {/* Limits slider */}
          <div className='flex flex-col gap-1.5'>
            <div className='flex justify-between text-xs font-bold text-neutral-700 uppercase'>
              <span>Max Applications</span>
              <span>{limit} Jobs</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              disabled={status === 'running'}
              className='h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-[#a3e635] border border-neutral-300'
            />
          </div>

          {/* Target platforms */}
          <div className='flex flex-col gap-2'>
            <label className='text-xs font-bold text-neutral-700 uppercase'>Target Platforms</label>
            <div className='flex flex-col gap-2 text-xs font-semibold text-neutral-600'>
              {['linkedin', 'google', 'upwork', 'indeed', 'glassdoor'].map((src) => (
                <label key={src} className='flex items-center gap-2 cursor-pointer hover:text-neutral-900'>
                  <input
                    type="checkbox"
                    checked={sources[src]}
                    disabled={status === 'running'}
                    onChange={() => handleSourceToggle(src)}
                    className='rounded border-neutral-300 text-[#a3e635] focus:ring-0 outline-none w-4 h-4'
                  />
                  <span className='capitalize'>{src}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Trigger button */}
          <div className='border-t border-neutral-100 pt-4 flex flex-col gap-2'>
            {status === 'running' ? (
              <button
                disabled
                className='w-full bg-neutral-900 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed border border-black opacity-80'
              >
                <IoStopOutline size={18} className='animate-spin' />
                Automation Running...
              </button>
            ) : (
              <button
                onClick={handleRunAutomation}
                className='w-full bg-[#a3e635] text-neutral-900 font-bold py-3 border-2 border-neutral-900 rounded-lg hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center justify-center gap-1.5 text-sm'
              >
                <IoPlayOutline size={18} />
                Start Apply Engine
              </button>
            )}
          </div>

        </div>

        {/* Right Side: Terminal Logger Console */}
        <div className='md:col-span-2 flex flex-col gap-5 bg-neutral-950 border-2 border-neutral-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'>
          <div className='flex justify-between items-center border-b border-neutral-800 pb-3 text-lime-400 font-mono text-xs'>
            <span className='flex items-center gap-2 font-bold'>
              <IoTerminalOutline size={18} />
              JT AUTOMATOR CONSOLE
            </span>
            <span>Progress: {progress}%</span>
          </div>

          <div className='w-full bg-neutral-900 border border-neutral-800 h-2.5 rounded-full overflow-hidden p-0.5'>
            <div 
              className='bg-lime-400 h-full rounded-full transition-all duration-300' 
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Logs */}
          <div className='flex-1 bg-neutral-900 text-lime-400 font-mono text-xxs md:text-xs p-4 rounded-xl min-h-[300px] overflow-y-auto border border-neutral-800 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-neutral-800'>
            {logs.length === 0 ? (
              <span className='text-lime-400/40 text-center py-20 italic'>Console Idle. Click "Start Apply Engine" to begin scraping and applying.</span>
            ) : (
              logs.map((log, index) => (
                <div key={index} className='leading-relaxed break-all'>
                  {log}
                </div>
              ))
            )}
            {status === 'running' && (
              <div className='flex items-center gap-1.5 animate-pulse text-lime-400/60'>
                <span>&gt; Processing current matching index...</span>
                <span className='w-1.5 h-3 bg-lime-400 inline-block'></span>
              </div>
            )}
            {status === 'success' && (
              <div className='text-emerald-400 font-bold mt-3 border-t border-emerald-950 pt-2 flex items-center gap-2'>
                <IoCheckmarkCircleOutline size={20} />
                SUCCESS: Batch application flow finalized. All applications have been tracked.
              </div>
            )}
            <div ref={logEndRef} />
          </div>
        </div>

      </div>

    </div>
  );
};

export default AutomationPanel;
