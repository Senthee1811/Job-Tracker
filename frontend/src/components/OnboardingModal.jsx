import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  AVAILABLE_ROLES,
  AVAILABLE_LOCATIONS,
  AVAILABLE_JOB_TYPES,
  EXPERIENCE_LEVELS
} from '../constants/preferenceConstants';
import {
  IoSparklesOutline,
  IoCheckmarkCircleOutline,
  IoArrowForwardOutline,
  IoBriefcaseOutline,
  IoLocationOutline
} from 'react-icons/io5';

const OnboardingModal = ({ isOpen, onComplete }) => {
  const { user, refreshProfile } = useAuth();

  const [selectedRoles, setSelectedRoles] = useState(
    user?.preferences?.roles?.length ? user.preferences.roles : ['Software Engineer']
  );
  const [selectedLocations, setSelectedLocations] = useState(
    user?.preferences?.locations?.length ? user.preferences.locations : ['Colombo', 'Remote']
  );
  const [selectedJobTypes, setSelectedJobTypes] = useState(
    user?.preferences?.jobTypes?.length ? user.preferences.jobTypes : ['Full Time']
  );
  const [experienceLevel, setExperienceLevel] = useState(
    user?.preferences?.experienceLevel || 'Mid-Level (2-5 yrs)'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleRole = (role) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter((r) => r !== role));
      } else {
        setError('Please keep at least one target role selected.');
        setTimeout(() => setError(''), 3000);
      }
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const toggleLocation = (loc) => {
    if (selectedLocations.includes(loc)) {
      if (selectedLocations.length > 1) {
        setSelectedLocations(selectedLocations.filter((l) => l !== loc));
      }
    } else {
      setSelectedLocations([...selectedLocations, loc]);
    }
  };

  const toggleJobType = (type) => {
    if (selectedJobTypes.includes(type)) {
      if (selectedJobTypes.length > 1) {
        setSelectedJobTypes(selectedJobTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedJobTypes([...selectedJobTypes, type]);
    }
  };

  const handleSave = async (isSkip = false) => {
    setLoading(true);
    setError('');

    const payload = isSkip
      ? {
          roles: ['Software Engineer'],
          locations: ['Colombo', 'Remote'],
          jobTypes: ['Full Time'],
          experienceLevel: 'Mid-Level (2-5 yrs)',
          keywords: [],
          onboardingCompleted: true
        }
      : {
          roles: selectedRoles.length ? selectedRoles : ['Software Engineer'],
          locations: selectedLocations.length ? selectedLocations : ['Colombo', 'Remote'],
          jobTypes: selectedJobTypes.length ? selectedJobTypes : ['Full Time'],
          experienceLevel,
          keywords: user?.preferences?.keywords || [],
          onboardingCompleted: true
        };

    try {
      await api.updatePreferences(payload);
      if (refreshProfile) await refreshProfile();
      if (onComplete) onComplete();
    } catch (err) {
      setError(err.message || 'Failed to save job preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white border-2 border-neutral-900 rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b-2 border-neutral-900 pb-4">
          <div className="inline-flex p-2.5 bg-lime-100 border-2 border-neutral-900 rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-lime-700 mb-1">
            <IoSparklesOutline className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-neutral-900 tracking-tight">
            What jobs are you looking for?
          </h3>
          <p className="text-xs text-neutral-500 font-medium max-w-md mx-auto">
            Personalize your daily vacancy radar. We will curate "Today's Vacancies" and match scores to fit your profile.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border-2 border-rose-500 rounded-xl text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* 1. Target Roles (Required) */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-neutral-900 uppercase tracking-wide flex items-center gap-1.5">
              <IoBriefcaseOutline className="w-4 h-4 text-lime-600" />
              <span>Target Roles (Select at least one) *</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ROLES.map((role) => {
                const selected = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
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

          {/* 2. Preferred Locations */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-neutral-900 uppercase tracking-wide flex items-center gap-1.5">
              <IoLocationOutline className="w-4 h-4 text-lime-600" />
              <span>Locations & Work Mode</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LOCATIONS.map((loc) => {
                const selected = selectedLocations.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleLocation(loc)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
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

          {/* 3. Job Types & Seniority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-neutral-900 uppercase tracking-wide block">
                Job Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_JOB_TYPES.map((jt) => {
                  const selected = selectedJobTypes.includes(jt);
                  return (
                    <button
                      key={jt}
                      type="button"
                      onClick={() => toggleJobType(jt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        selected
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-900'
                      }`}
                    >
                      {selected ? `✓ ${jt}` : jt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-neutral-900 uppercase tracking-wide block">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border-2 border-neutral-900 rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-lime-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t-2 border-neutral-900 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSave(true)}
            className="text-xs font-bold text-neutral-500 hover:text-neutral-900 underline underline-offset-2 cursor-pointer"
          >
            Skip for now (use sensible defaults)
          </button>

          <button
            type="button"
            disabled={loading || selectedRoles.length === 0}
            onClick={() => handleSave(false)}
            className="w-full sm:w-auto px-6 py-3 bg-[#a3e635] text-neutral-950 font-black rounded-xl border-2 border-neutral-900 hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-40"
          >
            <span>{loading ? 'Saving...' : 'Save & Show Matching Jobs'}</span>
            <IoArrowForwardOutline className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default OnboardingModal;
