import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IoCloseOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [firstname, setFirstname] = useState(user?.firstname || '');
  const [lastname, setLastname] = useState(user?.lastname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [age, setAge] = useState(user?.age || '');
  const [resumeText, setResumeText] = useState(user?.resumeText || '');
  const [skills, setSkills] = useState(user?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  
  // Notice / Success states
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        resumeText
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
        <div className='bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm p-4 rounded-xl mb-6 font-semibold flex items-center gap-2'>
          <IoCheckmarkCircleOutline size={20} className='text-emerald-600' />
          Profile and resume details saved successfully!
        </div>
      )}

      {error && (
        <div className='bg-rose-50 border border-rose-200 text-rose-800 text-xs md:text-sm p-4 rounded-xl mb-6 font-semibold'>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className='flex flex-col gap-6 bg-white border-2 border-neutral-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'>
        
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
              <span className='text-xs text-neutral-400 font-medium pl-1 self-center'>No skills added. Add tags to feed the resume matching engine!</span>
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
          <label className='text-xs font-bold text-neutral-700 uppercase'>Paste Resume / Professional Summary</label>
          <textarea
            placeholder="Paste your resume or details about your academic and professional history here..."
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
