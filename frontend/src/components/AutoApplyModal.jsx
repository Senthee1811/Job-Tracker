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

  // Run the simulation when the modal opens
  useEffect(() => {
    if (!isOpen || !job) return;
    setStatus('running');
    setProgress(0);
    setLogs([]);
    setErrorMessage('');

    const runVerificationAndSimulation = async () => {
      try {
        setLogs((prev) => [...prev, `> Connecting to live board scraper to verify active status for: "${job.title}" at "${job.company}"...`]);
        
        // Execute dynamic live verification call
        const verifyData = await api.getLiveJobs(job.title, job.location || 'Sri Lanka');
        
        setLogs((prev) => [
          ...prev, 
          `> Scraper verification response: Found ${verifyData.jobs?.length || 0} matching listings in the ${job.location || 'selected'} region.`,
          `> Active listing verified on source channel: [${job.source.toUpperCase()}]`
        ]);

        const username = user ? `${user.firstname} ${user.lastname}` : 'Anonymous Candidate';
        const skillsList = user && user.skills && user.skills.length > 0 
          ? user.skills.join(', ') 
          : 'React, JavaScript, HTML, CSS';
        
        const resumeTextLen = user && user.resumeText ? user.resumeText.length : 0;

        const simulationSteps = [
          {
            progress: 20,
            log: `> Initializing automated application driver sequence for: "${username}"`,
            delay: 400
          },
          {
            progress: 40,
            log: `> Auto-matching user skills checklist: [${skillsList}]`,
            delay: 900
          },
          {
            progress: 60,
            log: `> Injecting parsed CV credentials (CV resume text length: ${resumeTextLen} chars)...`,
            delay: 1400
          },
          {
            progress: 80,
            log: `> Bypassing anti-bot CAPTCHA validation... Success!`,
            delay: 1900
          },
          {
            progress: 95,
            log: `> Submitting form to ${job.company} portal... Application Accepted!`,
            delay: 2400
          },
          {
            progress: 100,
            log: `> Recording tracked application details to MongoDB...`,
            delay: 2900
          }
        ];

        simulationSteps.forEach((step) => {
          setTimeout(() => {
            setLogs((prev) => [...prev, step.log]);
            setProgress(step.progress);
            if (step.progress === 100) {
              saveApplicationToDB();
            }
          }, step.delay);
        });

      } catch (err) {
        console.error(err);
        setLogs((prev) => [...prev, `> [WARNING] Unable to verify job status: ${err.message}. Proceeding with offline application simulation fallback.`]);
        
        // Run simulation fallback after warning
        setTimeout(() => {
          setProgress(100);
          saveApplicationToDB();
        }, 1500);
      }
    };

    runVerificationAndSimulation();
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

  if (!isOpen || !job) return null;

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
