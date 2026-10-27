import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import PasswordInput from './PasswordInput';
import Toast from './Toast';
import {
  IoPersonOutline,
  IoBriefcaseOutline,
  IoDocumentTextOutline,
  IoLockClosedOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoCloudUploadOutline,
  IoDownloadOutline,
  IoTrashOutline,
  IoArrowForwardOutline,
  IoCloseOutline
} from 'react-icons/io5';

import {
  AVAILABLE_ROLES,
  AVAILABLE_LOCATIONS,
  AVAILABLE_JOB_TYPES,
  EXPERIENCE_LEVELS
} from '../constants/preferenceConstants';

const Settings = () => {
  const { user, updateProfile, uploadCV, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Active tab state: 'profile' | 'preferences' | 'cv' | 'security' | 'danger'
  const [activeTab, setActiveTab] = useState('profile');

  // Notification Toast state
  const [toast, setToast] = useState(null);

  // Tab 1: Profile form state
  const [firstname, setFirstname] = useState(user?.firstname || '');
  const [lastname, setLastname] = useState(user?.lastname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [age, setAge] = useState(user?.age || '');
  const [linkedin, setLinkedin] = useState(user?.linkedin || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Tab 2: Job Preferences state
  const [selectedRoles, setSelectedRoles] = useState(user?.preferences?.roles || ['Software Engineer']);
  const [selectedLocations, setSelectedLocations] = useState(user?.preferences?.locations || ['Colombo', 'Remote']);
  const [selectedJobTypes, setSelectedJobTypes] = useState(user?.preferences?.jobTypes || ['Full Time']);
  const [experienceLevel, setExperienceLevel] = useState(user?.preferences?.experienceLevel || 'Mid-Level (2-5 yrs)');
  const [keywords, setKeywords] = useState(user?.preferences?.keywords || []);
  const [keywordInput, setKeywordInput] = useState('');
  const [prefSaving, setPrefSaving] = useState(false);

  // Tab 3: CV state
  const [activeCv, setActiveCv] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [cvFile, setCvFile] = useState(null);

  // Tab 4: Security (Change password) state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Tab 5: Danger Zone (Delete account) state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Synchronize state when user object updates
  useEffect(() => {
    if (user) {
      setFirstname(user.firstname || '');
      setLastname(user.lastname || '');
      setEmail(user.email || '');
      setAge(user.age || '');
      setLinkedin(user.linkedin || '');
      if (user.preferences) {
        if (user.preferences.roles?.length) setSelectedRoles(user.preferences.roles);
        if (user.preferences.locations?.length) setSelectedLocations(user.preferences.locations);
        if (user.preferences.jobTypes?.length) setSelectedJobTypes(user.preferences.jobTypes);
        if (user.preferences.experienceLevel) setExperienceLevel(user.preferences.experienceLevel);
        if (user.preferences.keywords?.length) setKeywords(user.preferences.keywords);
      }
    }
  }, [user]);

  // Fetch active CV info
  const fetchActiveCv = async () => {
    setCvLoading(true);
    try {
      const res = await api.getActiveCv();
      setActiveCv(res.cv || null);
    } catch {
      setActiveCv(null);
    } finally {
      setCvLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveCv();
  }, [user]);

  if (!user) return null;

  // Initials for avatar
  const initials = `${user.firstname?.[0] || ''}${user.lastname?.[0] || ''}`.toUpperCase() || 'U';

  // 1. Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile({
        firstname,
        lastname,
        email,
        age: Number(age),
        linkedin
      });
      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setProfileSaving(false);
    }
  };

  // 2. Handle Preferences Update
  const toggleRole = (role) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter((r) => r !== role));
      } else {
        setToast({ message: 'At least one role must be selected', type: 'info' });
      }
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const toggleLocation = (loc) => {
    if (selectedLocations.includes(loc)) {
      setSelectedLocations(selectedLocations.filter((l) => l !== loc));
    } else {
      setSelectedLocations([...selectedLocations, loc]);
    }
  };

  const toggleJobType = (jt) => {
    if (selectedJobTypes.includes(jt)) {
      setSelectedJobTypes(selectedJobTypes.filter((t) => t !== jt));
    } else {
      setSelectedJobTypes([...selectedJobTypes, jt]);
    }
  };

  const handleAddKeyword = (e) => {
    e.preventDefault();
    const clean = keywordInput.trim();
    if (clean && !keywords.includes(clean)) {
      setKeywords([...keywords, clean]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setPrefSaving(true);
    try {
      await api.updatePreferences({
        roles: selectedRoles,
        locations: selectedLocations,
        jobTypes: selectedJobTypes,
        experienceLevel,
        keywords
      });
      if (refreshProfile) await refreshProfile();
      setToast({ message: 'Job preferences saved successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to update job preferences', type: 'error' });
    } finally {
      setPrefSaving(false);
    }
  };

  // 3. Handle CV Replace / Upload
  const handleCvFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      // 4MB Vercel function limit check
      if (selected.size > 4 * 1024 * 1024) {
        setToast({
          message: 'File exceeds 4MB limit for serverless upload. Please upload a smaller file.',
          type: 'error'
        });
        e.target.value = '';
        return;
      }
      setCvFile(selected);
    }
  };

  const handleCvUpload = async (e) => {
    e.preventDefault();
    if (!cvFile) return;
    setUploadingCv(true);
    try {
      await uploadCV(cvFile);
      setCvFile(null);
      await fetchActiveCv();
      if (refreshProfile) await refreshProfile();
      setToast({ message: 'CV uploaded and updated successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to upload CV', type: 'error' });
    } finally {
      setUploadingCv(false);
    }
  };

  // 4. Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToast({ message: 'Password changed successfully!', type: 'success' });
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
      setToast({ message: err.message || 'Failed to change password', type: 'error' });
    } finally {
      setPasswordSaving(false);
    }
  };

  // 5. Handle Account Deletion
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');

    if (deleteConfirmationText.trim() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion');
      return;
    }

    if (!deletePassword) {
      setDeleteError('Please enter your current password');
      return;
    }

    setDeletingAccount(true);
    try {
      await api.deleteAccount({ password: deletePassword, confirmText: deleteConfirmationText });
      setShowDeleteModal(false);
      logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account');
      setToast({ message: err.message || 'Failed to delete account', type: 'error' });
    } finally {
      setDeletingAccount(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: IoPersonOutline },
    { id: 'preferences', label: 'Job Preferences', icon: IoBriefcaseOutline },
    { id: 'cv', label: 'CV Management', icon: IoDocumentTextOutline },
    { id: 'security', label: 'Security', icon: IoLockClosedOutline },
    { id: 'danger', label: 'Danger Zone', icon: IoWarningOutline, isDanger: true }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300 space-y-6">
      {/* Toast feedback */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
          Account <span className="text-[#84cc16]">Settings</span>
        </h2>
        <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
          Manage your personal details, job preferences, resume files, and account security.
        </p>
      </div>

      {/* Settings Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <aside className="md:col-span-1 bg-white border-2 border-neutral-900 rounded-2xl p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer text-left ${
                    isActive
                      ? tab.isDanger
                        ? 'bg-rose-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-neutral-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : tab.isDanger
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                  role="tab"
                  aria-selected={isActive}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="md:col-span-3 space-y-6">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white border-2 border-neutral-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <div className="flex items-center gap-4 border-b-2 border-neutral-900 pb-4">
                <div className="w-14 h-14 rounded-2xl bg-[#a3e635] border-2 border-neutral-900 flex items-center justify-center text-xl font-black text-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {initials}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900">
                    {user.firstname} {user.lastname}
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono">{user.email}</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-neutral-700 uppercase">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstname}
                      onChange={(e) => setFirstname(e.target.value)}
                      className="border-2 border-neutral-900 rounded-xl px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-lime-400 bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-neutral-700 uppercase">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastname}
                      onChange={(e) => setLastname(e.target.value)}
                      className="border-2 border-neutral-900 rounded-xl px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-lime-400 bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-neutral-700 uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-2 border-neutral-900 rounded-xl px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-lime-400 bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-neutral-700 uppercase">Age</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="border-2 border-neutral-900 rounded-xl px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-lime-400 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-neutral-700 uppercase">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="border-2 border-neutral-900 rounded-xl px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-lime-400 bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-2.5 bg-[#a3e635] text-neutral-950 font-extrabold border-2 border-neutral-900 rounded-xl hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-xs disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: JOB PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="bg-white border-2 border-neutral-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <div className="border-b-2 border-neutral-900 pb-3">
                <h3 className="text-base font-extrabold text-neutral-900">
                  Target Job Preferences
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  These filters power your default vacancies feed and the 10% preference fit in recommendations.
                </p>
              </div>

              <form onSubmit={handlePreferencesSubmit} className="space-y-5">
                {/* Preferred Roles */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wide block">
                    Target Roles (Select at least one)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_ROLES.map((role) => {
                      const selected = selectedRoles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleRole(role)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                            selected
                              ? 'bg-[#a3e635] text-neutral-950 border-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900'
                          }`}
                        >
                          {selected ? `✓ ${role}` : `+ ${role}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred Locations */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wide block">
                    Locations & Work Mode
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_LOCATIONS.map((loc) => {
                      const selected = selectedLocations.includes(loc);
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => toggleLocation(loc)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                            selected
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900'
                          }`}
                        >
                          {selected ? `✓ ${loc}` : `+ ${loc}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Job Types */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wide block">
                    Job Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_JOB_TYPES.map((jt) => {
                      const selected = selectedJobTypes.includes(jt);
                      return (
                        <button
                          key={jt}
                          type="button"
                          onClick={() => toggleJobType(jt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                            selected
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-900'
                          }`}
                        >
                          {selected ? `✓ ${jt}` : `+ ${jt}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Experience Level */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wide block">
                    Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full sm:w-80 text-xs px-3.5 py-2.5 bg-white border-2 border-neutral-900 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-lime-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Keywords Tag Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wide block">
                    Custom Keywords (e.g. React, Docker, Spring, Microservices)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="Add preferred keyword..."
                      className="flex-1 text-xs px-3.5 py-2.5 bg-white border-2 border-neutral-900 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-lime-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="px-4 py-2.5 bg-neutral-900 text-white font-extrabold rounded-xl text-xs hover:bg-neutral-800 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-lime-100 text-lime-900 font-bold border border-lime-300 rounded-lg text-xs"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw)}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          <IoCloseOutline className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={prefSaving}
                    className="px-6 py-2.5 bg-[#a3e635] text-neutral-950 font-extrabold border-2 border-neutral-900 rounded-xl hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-xs disabled:opacity-50"
                  >
                    {prefSaving ? 'Saving...' : 'Save Job Preferences'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CV MANAGEMENT */}
          {activeTab === 'cv' && (
            <div className="bg-white border-2 border-neutral-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <div className="border-b-2 border-neutral-900 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900">
                    Active Resume & CV
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Your active CV is parsed for matching and used as the base for tailored resumes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="text-xs font-bold text-neutral-700 hover:text-black flex items-center gap-1 underline underline-offset-2"
                >
                  <span>Full CV History</span>
                  <IoArrowForwardOutline className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Current Active CV Status Card */}
              {activeCv || user.cvPath ? (
                <div className="p-4 bg-neutral-50 border-2 border-neutral-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3">
                    <IoDocumentTextOutline className="w-6 h-6 text-lime-600 flex-shrink-0" />
                    <div>
                      <span className="font-extrabold text-neutral-900 block">
                        {activeCv?.originalName || user.cvName || 'Uploaded Resume.pdf'}
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        {activeCv?.bytes
                          ? `${Math.round(activeCv.bytes / 1024)} KB • Version ${activeCv.version || 1}`
                          : 'Active in profile'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => api.downloadOriginalCv(activeCv?._id || "active", activeCv?.originalName || user.cvName || 'Resume.pdf')}
                      className="px-3 py-1.5 bg-white text-neutral-900 font-bold border-2 border-neutral-900 rounded-xl hover:bg-neutral-100 transition-all flex items-center gap-1.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    >
                      <IoDownloadOutline className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-xl text-center space-y-2">
                  <IoDocumentTextOutline className="w-8 h-8 text-neutral-400 mx-auto" />
                  <p className="text-xs text-neutral-600 font-bold">No active CV uploaded yet</p>
                  <p className="text-[11px] text-neutral-500">
                    Upload your CV (PDF or DOCX, max 4MB) to unlock ATS job matching and tailoring.
                  </p>
                </div>
              )}

              {/* Replace / Upload Form */}
              <form onSubmit={handleCvUpload} className="space-y-3 pt-2">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wide block">
                  Replace or Upload New CV (Max 4MB)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleCvFileChange}
                    disabled={uploadingCv}
                    className="text-xs file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-2 file:border-neutral-900 file:text-xs file:font-extrabold file:bg-[#a3e635] file:text-neutral-950 hover:file:bg-lime-400 file:cursor-pointer cursor-pointer border-2 border-neutral-200 rounded-xl p-2 w-full focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!cvFile || uploadingCv}
                    className="w-full sm:w-auto px-6 py-2.5 bg-neutral-900 text-white font-extrabold rounded-xl text-xs hover:bg-neutral-800 transition-all border-2 border-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 cursor-pointer flex-shrink-0"
                  >
                    {uploadingCv ? 'Uploading...' : 'Upload & Parse'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <div className="bg-white border-2 border-neutral-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <div className="border-b-2 border-neutral-900 pb-3">
                <h3 className="text-base font-extrabold text-neutral-900">
                  Password & Security
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Change your password to keep your account safe. Minimum 8 characters.
                </p>
              </div>

              {passwordError && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-500 rounded-xl text-rose-700 text-xs font-bold">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                <PasswordInput
                  label="Current Password"
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />

                <PasswordInput
                  label="New Password (min 8 chars)"
                  required
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                />

                <PasswordInput
                  label="Confirm New Password"
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                />

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordSaving || !currentPassword || !newPassword}
                    className="px-6 py-2.5 bg-[#a3e635] text-neutral-950 font-extrabold border-2 border-neutral-900 rounded-xl hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-xs disabled:opacity-50"
                  >
                    {passwordSaving ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: DANGER ZONE */}
          {activeTab === 'danger' && (
            <div className="bg-white border-2 border-rose-500 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(244,63,94,0.4)] space-y-6">
              <div className="border-b-2 border-rose-200 pb-3">
                <div className="flex items-center gap-2 text-rose-600">
                  <IoWarningOutline className="w-5 h-5 flex-shrink-0" />
                  <h3 className="text-base font-extrabold text-neutral-900">
                    Danger Zone
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Irreversible actions concerning your account data and saved assets.
                </p>
              </div>

              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                <h4 className="font-bold text-rose-900 text-xs">Delete Entire Account</h4>
                <p className="text-xs text-rose-800 leading-relaxed font-sans">
                  Deleting your account permanently removes all tracked job applications, reminders, bookmarks, CV documents, and all stored Cloudinary files. This action cannot be undone.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteError('');
                    setDeleteConfirmationText('');
                    setDeletePassword('');
                    setShowDeleteModal(true);
                  }}
                  className="px-5 py-2.5 bg-rose-600 text-white font-extrabold rounded-xl border-2 border-rose-900 hover:bg-rose-700 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-xs"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-2 border-neutral-900 rounded-2xl w-full max-w-md p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm">
                <IoWarningOutline className="w-5 h-5" />
                <span>Confirm Account Deletion</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1 text-neutral-500 hover:text-black rounded"
              >
                <IoCloseOutline className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              This action is permanent and will delete all your CVs, Cloudinary files, applications, and recommendations.
            </p>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold rounded-lg">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Type <span className="font-mono text-rose-600 font-black">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  placeholder="DELETE"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full p-2.5 border-2 border-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono"
                />
              </div>

              <PasswordInput
                label="Enter Current Password"
                required
                placeholder="Your current password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-800 font-bold rounded-xl border border-neutral-300 hover:bg-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletingAccount || deleteConfirmationText !== 'DELETE' || !deletePassword}
                  className="px-5 py-2 bg-rose-600 text-white font-extrabold border-2 border-neutral-900 rounded-xl hover:bg-rose-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 cursor-pointer"
                >
                  {deletingAccount ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
