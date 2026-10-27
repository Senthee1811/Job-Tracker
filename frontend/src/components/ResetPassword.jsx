import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import PasswordInput from './PasswordInput';
import {
  IoShieldCheckmarkOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoArrowForwardOutline,
  IoKeyOutline
} from 'react-icons/io5';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-neutral-900 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center space-y-4">
          <IoAlertCircleOutline className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-neutral-900">
            Missing Reset Token
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            This password reset link is invalid because no security token was provided. Please request a fresh reset link.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-5 py-2.5 bg-[#a3e635] text-neutral-950 font-extrabold rounded-xl border-2 border-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs hover:bg-lime-400"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({ token, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="bg-white border-2 border-neutral-900 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#a3e635] border-2 border-neutral-900 flex items-center justify-center mx-auto text-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <IoShieldCheckmarkOutline className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs text-neutral-500 font-medium">
            Choose a new strong password for your Job Tracker account (min 8 chars).
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border-2 border-rose-500 rounded-xl text-rose-700 text-xs font-bold space-y-2">
            <div className="flex items-center gap-2">
              <IoAlertCircleOutline className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            {error.toLowerCase().includes('expired') && (
              <div className="pt-1">
                <Link
                  to="/forgot-password"
                  className="text-rose-900 underline font-extrabold hover:text-black block text-[11px]"
                >
                  Request a new password reset link →
                </Link>
              </div>
            )}
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-lime-50 border-2 border-lime-500 rounded-xl text-lime-900 text-xs font-medium space-y-2">
              <IoCheckmarkCircleOutline className="w-8 h-8 text-lime-700 mx-auto" />
              <p className="font-bold text-sm text-lime-950">Password Reset Successfully</p>
              <p className="leading-relaxed">
                Your password has been securely updated and previous sessions have been cleared. You can now log in.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3 bg-[#a3e635] text-neutral-950 font-black rounded-xl border-2 border-neutral-900 hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>Go to Login</span>
              <IoArrowForwardOutline className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              label="New Password"
              required
              placeholder="Minimum 8 characters"
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

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full py-3 bg-[#a3e635] text-neutral-950 font-black rounded-xl border-2 border-neutral-900 hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/"
                className="text-xs font-bold text-neutral-500 hover:text-black transition-colors"
              >
                Cancel and return to home
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ResetPassword;
