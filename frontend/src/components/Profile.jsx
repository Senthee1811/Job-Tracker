import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  IoCloseOutline, 
  IoCheckmarkCircleOutline, 
  IoCloudUploadOutline, 
  IoDocumentTextOutline 
} from 'react-icons/io5';

const Profile = () => {
  const { user, updateProfile, uploadCV } = useAuth();
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      setUploadProgress(70);
      const updatedUser = await uploadCV(file);
      setUploadProgress(100);
      
      // Update form states with mock-parsed results
      if (updatedUser) {
        setSkills(updatedUser.skills || []);
        setResumeText(updatedUser.resumeText || '');
      }
      
      setFile(null);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setUploadProgress(0);
      }, 3000);
    } catch (err) {
      setError(err.message || 'CV Upload failed');
    } finally {
      setUploading(false);
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
      setError(err.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-3xl mx-auto px-6 py-12 select-none'>
      
      <div className='flex flex-col gap-2 mb-10 text-left border-b-2 border-neutral-100 pb-4'>
        <h2 className='text-2xl md:text-3xl font-extrabold text-neutral-900 uppercase'>
          User Profile & Resume
        </h2>
        <p className='text-xs md:text-sm text-neutral-500 font-medium'>
          Configure your details to feed the job application automation engine.
        </p>
      </div>

      {success && (
        <div className='bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm p-4 rounded-xl mb-6 font-semibold flex items-center gap-2 text-left'>
          <IoCheckmarkCircleOutline size={20} className='text-emerald-600' />
          Profile saved and dynamic parser extraction synchronized successfully!
        </div>
      )}

      {error && (
        <div className='bg-rose-50 border border-rose-200 text-rose-800 text-xs md:text-sm p-4 rounded-xl mb-6 font-semibold text-left'>
          {error}
        </div>
      )}

      {/* CV UPLOADER SECTION */}
      <div className='bg-[#e4ffd4]/20 border-2 border-neutral-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex flex-col gap-4 mb-8'>
        <h3 className='text-sm font-bold tracking-widest text-[#a3e635] bg-neutral-950 px-3 py-1 rounded-md max-w-fit uppercase flex items-center gap-1.5'>
          <IoCloudUploadOutline size={16} />
          CV / Resume Upload Facility
        </h3>

        <form onSubmit={handleFileUpload} className='flex flex-col md:flex-row gap-4 items-center'>
          <div className='flex-1 w-full border-2 border-dashed border-neutral-300 hover:border-black rounded-xl p-6 text-center cursor-pointer relative bg-white transition-all'>
            <input 
              type="file" 
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              disabled={uploading}
              className='absolute inset-0 opacity-0 cursor-pointer w-full h-full' 
            />
            <div className='flex flex-col items-center gap-2 text-neutral-500'>
              <IoDocumentTextOutline size={32} className='text-neutral-400' />
              <span className='text-xs md:text-sm font-bold text-neutral-700'>
                {file ? file.name : 'Select or drop your CV file'}
              </span>
              <span className='text-[10px] text-neutral-400'>
                Accepts PDF, DOCX, TXT up to 10MB
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className='w-full md:w-auto bg-[#a3e635] text-neutral-900 font-bold px-6 py-4 border-2 border-neutral-900 rounded-lg hover:bg-lime-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all'
          >
            {uploading ? `Parsing ${uploadProgress}%...` : 'Upload & Parse'}
          </button>
        </form>

        {user.cvName && (
          <div className='text-xxs font-bold text-neutral-500 bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-lg max-w-fit'>
            Active Document: {user.cvName}
          </div>
        )}
      </div>

      {/* DETAILED PROFILE FORM */}
      <form onSubmit={handleSubmit} className='flex flex-col gap-6 bg-white border-2 border-neutral-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left'>
        
        {/* Personal Details */}
        <h3 className='text-sm font-bold tracking-widest text-[#a3e635] bg-neutral-950 px-3 py-1 rounded-md max-w-fit uppercase'>
          1. Personal Details
        </h3>
        
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-bold text-neutral-700 uppercase'>First Name</label>
            <input
              type="text"
              required
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none'
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-bold text-neutral-700 uppercase'>Last Name</label>
            <input
              type="text"
              required
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none'
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-bold text-neutral-700 uppercase'>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none'
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-bold text-neutral-700 uppercase'>Age</label>
            <input
              type="number"
              required
              min="1"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none'
            />
          </div>
          <div className='flex flex-col gap-1.5 md:col-span-2'>
            <label className='text-xs font-bold text-neutral-700 uppercase'>LinkedIn Profile URL</label>
            <input
              type="url"
              placeholder="e.g. https://www.linkedin.com/in/username"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none'
            />
          </div>
        </div>

        <hr className='border-neutral-100 my-2' />

        {/* Skills Tag Builder */}
        <h3 className='text-sm font-bold tracking-widest text-[#a3e635] bg-neutral-950 px-3 py-1 rounded-md max-w-fit uppercase'>
          2. Skills Profile
        </h3>
        
        <div className='flex flex-col gap-3'>
          <label className='text-xs font-bold text-neutral-700 uppercase'>Add Skills Tags</label>
          <div className='flex gap-2'>
            <input
              type="text"
              placeholder="e.g. React, Node.js, Python, Git"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill(e);
                }
              }}
              className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none flex-1'
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className='bg-neutral-900 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer border border-black'
            >
              Add
            </button>
          </div>
          
          {/* Active Skills tags */}
          <div className='flex flex-wrap gap-2 mt-1.5 min-h-[40px] p-2 bg-neutral-50 rounded-xl border border-neutral-200'>
            {skills.length === 0 ? (
              <span className='text-xs text-neutral-400 font-medium pl-1 self-center'>No skills added. Upload your CV to extract them automatically!</span>
            ) : (
              skills.map((skill) => (
                <span 
                  key={skill}
                  className='bg-lime-100 text-lime-900 border border-lime-200 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5'
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className='text-lime-700 hover:text-red-600 rounded-full hover:bg-lime-200 p-0.5 transition-all cursor-pointer'
                  >
                    <IoCloseOutline size={14} />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        <hr className='border-neutral-100 my-2' />

        {/* Resume Text */}
        <h3 className='text-sm font-bold tracking-widest text-[#a3e635] bg-neutral-950 px-3 py-1 rounded-md max-w-fit uppercase'>
          3. Resume / Profile text
        </h3>
        
        <div className='flex flex-col gap-1.5'>
          <label className='text-xs font-bold text-neutral-700 uppercase'>Resume Summary Text</label>
          <textarea
            placeholder="Upload a resume file above or paste your resume content directly here..."
            rows="6"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none resize-none font-sans leading-relaxed text-neutral-700'
          />
        </div>

        {/* Save button */}
        <div className='border-t border-neutral-100 pt-4 flex justify-end mt-2'>
          <button
            type="submit"
            disabled={loading}
            className='bg-[#a3e635] text-neutral-900 font-bold px-8 py-3 border-2 border-neutral-900 rounded-lg hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-sm disabled:opacity-50'
          >
            {loading ? 'Saving Details...' : 'Save Profile Changes'}
          </button>
        </div>

      </form>

    </div>
  );
};

export default Profile;
