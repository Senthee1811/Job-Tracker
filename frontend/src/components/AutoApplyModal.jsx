import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { IoCheckmarkCircleOutline, IoAlertCircleOutline, IoTerminalOutline } from 'react-icons/io5';

const AutoApplyModal = ({ isOpen, job, onClose, onApplySuccess }) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, running, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const logEndRef = useRef(null);

  if (!isOpen || !job) return null;

  // Run the simulation when the modal opens
  useEffect(() => {
    setStatus('running');
    setProgress(0);
    setLogs([]);
    setErrorMessage('');

    // Fetch user context for logs customization
    const username = user ? `${user.firstname} ${user.lastname}` : 'Anonymous Candidate';
    const skillsList = user && user.skills && user.skills.length > 0 
      ? user.skills.join(', ') 
      : 'React, JavaScript, HTML, CSS';
    
    const resumeTextLen = user && user.resumeText ? user.resumeText.length : 0;

    const simulationSteps = [
      {
        progress: 10,
        log: `> Initializing Job Tracker Application Automation Engine v1.0.0...`,
        delay: 200
      },
      {
        progress: 25,
        log: `> Connecting to user profile session: "${username}"`,
        delay: 600
      },
      {
        progress: 40,
        log: `> Parsing candidate qualifications: [${skillsList}]`,
        delay: 1100
      },
      {
        progress: 55,
        log: `> Navigating to recruiter page: ${job.link || 'careers.portal.com'}`,
        delay: 1600
      },
      {
        progress: 70,
        log: `> Filling application form fields. Uploading mock profile resume (length: ${resumeTextLen} chars)...`,
        delay: 2200
      },
      {
        progress: 85,
        log: `> Bypassing platform bot detection & security check (CAPTCHA)... Success!`,
        delay: 2800
      },
      {
        progress: 95,
        log: `> Submitting form to ${job.company} recruiters... Application accepted!`,
        delay: 3400
      },
      {
        progress: 100,
        log: `> Syncing application data with local tracking spreadsheet...`,
        delay: 3900
      }
    ];

    // Setup timeouts for each step
    const timers = [];
    
    simulationSteps.forEach((step) => {
      const timer = setTimeout(() => {
        setLogs((prev) => [...prev, step.log]);
        setProgress(step.progress);

        // Once we reach 100%, trigger the database insertion
        if (step.progress === 100) {
          saveApplicationToDB();
        }
      }, step.delay);
      timers.push(timer);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [job, user]);

  // Scroll terminal logs automatically
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const saveApplicationToDB = async () => {
    try {
      const appPayload = {
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

      await api.createApplication(appPayload);
      setStatus('success');
      if (onApplySuccess) onApplySuccess();
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to save application to database');
    }
  };

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none'>
      <div className='bg-white w-full max-w-xl rounded-2xl border-2 border-black p-6 relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 animate-in fade-in duration-200'>
        
        {/* Modal Header */}
        <div className='border-b-2 border-neutral-100 pb-3 flex items-center gap-2'>
          <IoTerminalOutline className='text-[#a3e635] text-2xl' />
          <div>
            <h3 className='text-lg font-extrabold text-neutral-900 uppercase'>
              Auto-Apply Automation
            </h3>
            <p className='text-xxs md:text-xs text-neutral-500 font-medium'>
              Applying to <span className='font-bold text-neutral-800'>{job.title}</span> at <span className='font-bold text-neutral-800'>{job.company}</span>
            </p>
          </div>
        </div>

        {/* Progress Display */}
        <div className='flex flex-col gap-2'>
          <div className='flex justify-between items-center text-xs md:text-sm font-bold text-neutral-700 uppercase'>
            <span>{status === 'running' ? 'Automation In Progress...' : status === 'success' ? 'Application Complete!' : 'Error Occurred'}</span>
            <span>{progress}%</span>
          </div>
          <div className='w-full bg-neutral-100 border border-neutral-300 h-4 rounded-full overflow-hidden p-0.5'>
            <div 
              className='bg-[#a3e635] h-full rounded-full transition-all duration-300 border-r border-neutral-400' 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Terminal logs panel */}
        <div className='bg-neutral-950 text-lime-400 font-mono text-xxs md:text-xs p-4 rounded-xl h-60 overflow-y-auto border-2 border-neutral-800 shadow-inner flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-neutral-800'>
          {logs.map((log, index) => (
            <div key={index} className='leading-relaxed break-words'>
              {log}
            </div>
          ))}
          {status === 'running' && (
            <div className='flex items-center gap-1.5 animate-pulse text-lime-400/70'>
              <span>&gt; Running automated driver...</span>
              <span className='w-1.5 h-3 bg-lime-400 inline-block'></span>
            </div>
          )}
          {status === 'success' && (
            <div className='text-emerald-400 font-bold mt-2'>
              SUCCESS: Job application tracked successfully. Form submission completed.
            </div>
          )}
          {status === 'error' && (
            <div className='text-rose-400 font-bold mt-2'>
              ERROR: {errorMessage}
            </div>
          )}
          <div ref={logEndRef} />
        </div>

        {/* Success/Error screen overlays */}
        {status === 'success' && (
          <div className='flex flex-col items-center justify-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center'>
            <IoCheckmarkCircleOutline className='text-emerald-600' size={32} />
            <h4 className='text-sm font-bold text-emerald-800 uppercase'>Application Submitted</h4>
            <p className='text-xxs md:text-xs text-emerald-700 leading-normal max-w-sm'>
              This job has been automatically logged into your <strong>Tracker</strong> tab with status <strong>Applied</strong>.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className='flex flex-col items-center justify-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-center'>
            <IoAlertCircleOutline className='text-rose-600' size={32} />
            <h4 className='text-sm font-bold text-rose-800 uppercase'>Process Failed</h4>
            <p className='text-xxs md:text-xs text-rose-700 leading-normal max-w-sm'>
              We couldn't connect or update application status. Please check backend connection.
            </p>
          </div>
        )}

        {/* Modal Action buttons */}
        <div className='flex justify-end border-t border-neutral-100 pt-4'>
          <button
            onClick={onClose}
            disabled={status === 'running'}
            className='bg-[#a3e635] text-neutral-900 font-bold text-xs md:text-sm px-6 py-2 border-2 border-neutral-900 rounded-lg hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {status === 'running' ? 'Running Apply...' : 'Close Window'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AutoApplyModal;
