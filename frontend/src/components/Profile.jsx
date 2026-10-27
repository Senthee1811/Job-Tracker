import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { 
  IoCloseOutline, 
  IoCheckmarkCircleOutline, 
  IoCloudUploadOutline, 
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoTrashOutline,
  IoTimeOutline,
  IoShieldCheckmarkOutline,
  IoFlashOutline,
  IoSparklesOutline
} from 'react-icons/io5';
import AiCvAuditCard from './AiCvAuditCard';

const Profile = () => {
  const { user, updateProfile, uploadCV, refreshProfile } = useAuth();
  const [firstname, setFirstname] = useState(user?.firstname || '');
  const [lastname, setLastname] = useState(user?.lastname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [age, setAge] = useState(user?.age || '');
  const [resumeText, setResumeText] = useState(user?.resumeText || '');
  const [skills, setSkills] = useState(user?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [linkedin, setLinkedin] = useState(user?.linkedin || '');
  
  // Notice / Success / File states
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Skill Parsing states
  const [parsingSkills, setParsingSkills] = useState(false);
  const [detectedSkills, setDetectedSkills] = useState([]);

  // CV Version History state
  const [cvHistory, setCvHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchCvHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const data = await api.getCvHistory();
      setCvHistory(data.cvs || []);
    } catch (err) {
      console.error('Error fetching CV history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchCvHistory();
  }, [user]);

  if (!user) return null;

  const handleAddSkill = (e) => {
    e.preventDefault();
    const cleanInput = skillInput.trim();
    if (cleanInput && !skills.includes(cleanInput)) {
      setSkills([...skills, cleanInput]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadProgress(30);
    setError('');
    setSuccess(false);

    try {
      setUploadProgress(60);
      const updatedUser = await uploadCV(file);
      setUploadProgress(100);
      
      if (updatedUser) {
        setSkills(updatedUser.skills || []);
        setResumeText(updatedUser.resumeText || '');
        if (updatedUser.extractedSkills?.length > 0) {
          setDetectedSkills(updatedUser.extractedSkills);
          setSuccessMsg(`CV uploaded & parsed ${updatedUser.extractedSkills.length} skills into your profile!`);
        } else {
          setSuccessMsg('CV uploaded and processed successfully!');
        }
      }
      
      setFile(null);
      setSuccess(true);
      fetchCvHistory();
      if (refreshProfile) refreshProfile();

      setTimeout(() => {
        setSuccess(false);
        setSuccessMsg('');
        setUploadProgress(0);
      }, 4000);
    } catch (err) {
      setError(err.message || 'CV Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleParseCvSkills = async () => {
    if (!user.cvPath && !resumeText.trim()) {
      setError('Please upload a CV or paste your resume text first to parse skills.');
      return;
    }
    setParsingSkills(true);
    setError('');
    try {
      const res = await api.parseCvSkills(true);
      const newSkills = res.extractedSkills || [];
      setDetectedSkills(newSkills);
      if (res.user?.skills) {
        setSkills(res.user.skills);
      } else {
        setSkills(prev => Array.from(new Set([...prev, ...newSkills])));
      }
      setSuccessMsg(`Successfully parsed ${newSkills.length} skills from your CV!`);
      setSuccess(true);
      if (refreshProfile) refreshProfile();
      setTimeout(() => {
        setSuccess(false);
        setSuccessMsg('');
      }, 4000);
    } catch (err) {
      setError(err.message || 'Failed to parse skills from CV');
    } finally {
      setParsingSkills(false);
    }
  };

  const handleAddDetectedSkill = (skill) => {
    if (!skills.includes(skill)) {
      setSkills(prev => [...prev, skill]);
    }
  };

  const handleAddAllDetectedSkills = () => {
    setSkills(prev => Array.from(new Set([...prev, ...detectedSkills])));
  };

  const handleDeleteCvVersion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this CV version?')) return;
    try {
      await api.deleteCvVersion(id);
      fetchCvHistory();
      if (refreshProfile) refreshProfile();
    } catch (err) {
      setError(err.message || 'Failed to delete CV version');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError('');
    setLoading(true);

    try {
      await updateProfile({
        firstname,
        lastname,
        email,
        age: Number(age),
        skills,
        resumeText,
        linkedin
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='py-8 px-4 max-w-4xl mx-auto animate-in fade-in duration-300 space-y-8'>
      
      {/* Header */}
      <div className='text-center space-y-2'>
        <h3 className='text-3xl font-extrabold text-neutral-800 tracking-tight leading-tight'>
          Candidate <span className='text-[#a3e635]'>Profile</span> & Credentials
        </h3>
        <p className='text-xs md:text-sm text-neutral-500 font-medium max-w-lg mx-auto leading-relaxed'>
          Manage your resume, skills checklist, version history, and Cloudinary storage link.
        </p>
      </div>

      {error && (
        <div className='bg-rose-50 border-2 border-rose-500 text-rose-700 text-xs font-bold p-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'>
          {error}
        </div>
      )}

      {success && (
        <div className='bg-lime-50 border-2 border-[#a3e635] text-lime-800 text-xs font-bold p-4 rounded-xl flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'>
          <IoCheckmarkCircleOutline className='text-lg flex-shrink-0' />
          <span>{successMsg || 'Profile updated successfully!'}</span>
        </div>
      )}

      {/* 1. CV Upload & Cloudinary Card */}
      <div className='bg-white border-2 border-neutral-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4'>
        <div className='flex items-center gap-3 border-b-2 border-neutral-900 pb-3'>
          <IoCloudUploadOutline className='text-2xl text-lime-600' />
          <div>
            <h4 className='font-extrabold text-neutral-800 text-base'>
              Upload Resume / CV (PDF or DOCX)
            </h4>
            <p className='text-xs text-neutral-500'>
              Parsed into structured credentials and backed by Cloudinary storage. Max 5MB.
            </p>
          </div>
        </div>

        <form onSubmit={handleFileUpload} className='space-y-4'>
          <div className='flex flex-col sm:flex-row items-center gap-3'>
            <input 
              type="file" 
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              disabled={uploading}
              className='text-xs file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-2 file:border-neutral-900 file:text-xs file:font-extrabold file:bg-[#a3e635] file:text-neutral-950 hover:file:bg-lime-400 file:cursor-pointer cursor-pointer border-2 border-neutral-200 rounded-xl p-2 w-full focus:outline-none'
            />
            <button
              type="submit"
              disabled={!file || uploading}
              className='w-full sm:w-auto px-6 py-2.5 bg-neutral-900 text-white font-extrabold rounded-xl text-xs hover:bg-neutral-800 transition-all border-2 border-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 cursor-pointer flex-shrink-0'
            >
              {uploading ? `Processing... ${uploadProgress}%` : 'Upload & Parse CV'}
            </button>
          </div>

          {uploading && (
            <div className='w-full bg-neutral-100 rounded-full h-2 overflow-hidden border border-neutral-200'>
              <div 
                className='bg-lime-500 h-2 transition-all duration-300' 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </form>

        {/* Current Active CV Status */}
        {user.cvPath && (
          <div className='p-3.5 bg-neutral-50 border-2 border-neutral-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'>
            <div className='flex items-center gap-2.5'>
              <IoDocumentTextOutline className='w-5 h-5 text-lime-600 flex-shrink-0' />
              <div>
                <span className='font-bold text-neutral-800'>Active CV: </span>
                <span className='text-neutral-600 font-medium'>{user.cvName || 'Resume.pdf'}</span>
              </div>
            </div>
            <div className='flex items-center gap-2.5 flex-wrap'>
              <button
                type="button"
                onClick={handleParseCvSkills}
                disabled={parsingSkills}
                className='px-3 py-1.5 bg-[#a3e635] text-neutral-950 font-extrabold border-2 border-neutral-900 rounded-lg hover:bg-lime-400 transition-all flex items-center gap-1.5 text-[11px] cursor-pointer disabled:opacity-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                title="Extract skills directly from this CV"
              >
                <IoFlashOutline className={`w-3.5 h-3.5 ${parsingSkills ? 'animate-spin' : ''}`} />
                <span>{parsingSkills ? 'Extracting Skills...' : 'Parse Skills from CV'}</span>
              </button>
              <button
                type="button"
                onClick={() => api.downloadOriginalCv("active", user.cvName || 'Resume.pdf')}
                className='font-bold text-neutral-700 hover:text-black underline flex items-center gap-1 text-[11px] px-2 py-1 cursor-pointer bg-transparent border-0'
              >
                <IoDownloadOutline className='w-3.5 h-3.5' />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. AI CV Audit & ATS Readiness Card */}
      <AiCvAuditCard 
        activeCv={cvHistory.find(c => c.isActive) || cvHistory[0] || (user.cvPath ? { originalName: user.cvName } : null)}
        onAddSkill={handleAddDetectedSkill}
        userSkills={skills}
      />

      {/* 3. CV Version History Table */}
      {cvHistory.length > 0 && (
        <div className='bg-white border-2 border-neutral-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4'>
          <div className='flex items-center gap-2 border-b-2 border-neutral-900 pb-3'>
            <IoTimeOutline className='text-xl text-neutral-800' />
            <h4 className='font-extrabold text-neutral-800 text-base'>
              CV Version History
            </h4>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full text-xs text-left'>
              <thead>
                <tr className='border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10px]'>
                  <th className='py-2 px-3'>Version</th>
                  <th className='py-2 px-3'>Filename</th>
                  <th className='py-2 px-3'>Size</th>
                  <th className='py-2 px-3'>Uploaded</th>
                  <th className='py-2 px-3 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-neutral-100'>
                {cvHistory.map((cvItem) => (
                  <tr key={cvItem._id} className='hover:bg-neutral-50 transition-colors'>
                    <td className='py-2.5 px-3 font-bold'>
                      <div className='flex items-center gap-1.5'>
                        <span>v{cvItem.version}</span>
                        {cvItem.isActive && (
                          <span className='px-1.5 py-0.5 bg-lime-100 text-lime-800 font-bold rounded text-[9px] border border-lime-300'>
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className='py-2.5 px-3 text-neutral-700 font-medium'>
                      {cvItem.originalName}
                    </td>
                    <td className='py-2.5 px-3 text-neutral-500 font-mono'>
                      {cvItem.bytes ? `${Math.round(cvItem.bytes / 1024)} KB` : 'N/A'}
                    </td>
                    <td className='py-2.5 px-3 text-neutral-500'>
                      {new Date(cvItem.createdAt).toLocaleDateString()}
                    </td>
                    <td className='py-2.5 px-3 text-right space-x-2'>
                      {cvItem.secureUrl && (
                        <button
                          type="button"
                          onClick={() => api.downloadOriginalCv(cvItem._id, cvItem.originalName)}
                          className='inline-block p-1 text-neutral-700 hover:text-black cursor-pointer bg-transparent border-0'
                          title="Download"
                        >
                          <IoDownloadOutline className='w-4 h-4' />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCvVersion(cvItem._id)}
                        className='p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer'
                        title="Delete Version"
                      >
                        <IoTrashOutline className='w-4 h-4' />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Candidate Profile Details Form */}
      <form onSubmit={handleSubmit} className='bg-white border-2 border-neutral-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6'>
        <div className='border-b-2 border-neutral-900 pb-3'>
          <h4 className='font-extrabold text-neutral-800 text-base'>
            Personal & Career Information
          </h4>
          <p className='text-xs text-neutral-500'>
            This information guides the RAG matching engine and tailored CV generation.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-xs'>
          <div>
            <label className='block font-bold text-neutral-700 mb-1'>First Name</label>
            <input 
              type="text" 
              value={firstname} 
              onChange={(e) => setFirstname(e.target.value)}
              className='w-full p-2.5 border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 font-sans'
              required
            />
          </div>

          <div>
            <label className='block font-bold text-neutral-700 mb-1'>Last Name</label>
            <input 
              type="text" 
              value={lastname} 
              onChange={(e) => setLastname(e.target.value)}
              className='w-full p-2.5 border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 font-sans'
              required
            />
          </div>

          <div>
            <label className='block font-bold text-neutral-700 mb-1'>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className='w-full p-2.5 border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 font-sans'
              required
            />
          </div>

          <div>
            <label className='block font-bold text-neutral-700 mb-1'>Age</label>
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(e.target.value)}
              className='w-full p-2.5 border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 font-sans'
              required
            />
          </div>

          <div className='md:col-span-2'>
            <label className='block font-bold text-neutral-700 mb-1'>LinkedIn Profile URL</label>
            <input 
              type="url" 
              value={linkedin} 
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className='w-full p-2.5 border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 font-sans'
            />
          </div>
        </div>

        {/* Skills Tag Input */}
        <div className='space-y-3 text-xs'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2'>
            <div>
              <label className='block font-bold text-neutral-800 text-sm'>
                Verified Skills Checklist ({skills.length})
              </label>
              <p className='text-[11px] text-neutral-500'>
                Parsed from your CV and used for 0–100 ATS hybrid recommendations.
              </p>
            </div>
            <button
              type="button"
              onClick={handleParseCvSkills}
              disabled={parsingSkills || (!user.cvPath && !resumeText.trim())}
              className='px-3.5 py-1.5 bg-lime-100 hover:bg-[#a3e635] text-neutral-950 font-extrabold border-2 border-neutral-900 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer disabled:opacity-40 self-start sm:self-auto text-xs'
              title="Scan active CV text and extract technical skills automatically"
            >
              <IoFlashOutline className={`w-3.5 h-3.5 ${parsingSkills ? 'animate-spin' : 'text-lime-700'}`} />
              <span>{parsingSkills ? 'Extracting Skills...' : '⚡ Auto-Parse from CV'}</span>
            </button>
          </div>

          {/* Detected Skills from CV Preview Tray */}
          {detectedSkills.length > 0 && (
            <div className='p-3.5 bg-lime-50 border-2 border-lime-500 rounded-xl space-y-2 shadow-[2px_2px_0px_0px_rgba(163,230,53,0.3)]'>
              <div className='flex items-center justify-between gap-2 flex-wrap'>
                <span className='font-bold text-lime-900 text-xs flex items-center gap-1.5'>
                  <IoSparklesOutline className='text-sm text-lime-700' />
                  Detected {detectedSkills.length} skills from your resume:
                </span>
                <button
                  type="button"
                  onClick={handleAddAllDetectedSkills}
                  className='text-[11px] font-extrabold text-lime-900 underline hover:text-black cursor-pointer'
                >
                  + Add All to Checklist
                </button>
              </div>
              <div className='flex flex-wrap gap-1.5'>
                {detectedSkills.map((ds, idx) => {
                  const alreadyAdded = skills.includes(ds);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddDetectedSkill(ds)}
                      disabled={alreadyAdded}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 ${
                        alreadyAdded
                          ? 'bg-lime-200 border-lime-400 text-lime-900 opacity-80 cursor-default'
                          : 'bg-white border-lime-600 text-neutral-900 hover:bg-lime-300 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                    >
                      <span>{ds}</span>
                      <span className='text-[10px]'>{alreadyAdded ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className='flex gap-2'>
            <input 
              type="text" 
              value={skillInput} 
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Add skill (e.g. React, Node.js, Docker, MongoDB)..."
              className='w-full p-2.5 border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 font-sans'
            />
            <button 
              onClick={handleAddSkill}
              type="button"
              className='px-5 py-2.5 bg-[#a3e635] text-neutral-950 font-extrabold border-2 border-neutral-900 rounded-xl hover:bg-lime-400 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex-shrink-0'
            >
              Add
            </button>
          </div>

          <div className='flex flex-wrap gap-2 pt-1'>
            {skills.map((skill, idx) => (
              <span 
                key={idx} 
                className='inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-900 font-bold border border-neutral-300 rounded-lg text-xs'
              >
                {skill}
                <button 
                  type="button" 
                  onClick={() => handleRemoveSkill(skill)}
                  className='hover:text-rose-600 cursor-pointer'
                >
                  <IoCloseOutline className='w-4 h-4' />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Parsed Resume Text */}
        <div className='space-y-1 text-xs'>
          <label className='block font-bold text-neutral-700'>
            Extracted Plain Text Resume / Summary
          </label>
          <textarea 
            rows={5}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className='w-full p-3 border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400 font-mono text-[11px]'
            placeholder="Parsed plain text extracted from your uploaded resume..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className='w-full py-3 bg-[#a3e635] text-neutral-950 font-extrabold border-2 border-neutral-900 rounded-xl hover:bg-lime-400 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider'
        >
          {loading ? 'Saving Changes...' : 'Save Profile Details'}
        </button>
      </form>

    </div>
  );
};

export default Profile;
