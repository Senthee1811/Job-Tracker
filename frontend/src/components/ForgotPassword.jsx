import React, { useState } from 'react';
import { api } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import {
  IoKeyOutline,
  IoMailOutline,
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline
} from 'react-icons/io5';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit reset request');
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
            <IoKeyOutline className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            Forgot Password?
          </h2>
          <p className="text-xs text-neutral-500 font-medium">
            Enter the email linked with your Job Tracker account and we will send you a reset link.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border-2 border-rose-500 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
            <IoAlertCircleOutline className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-lime-50 border-2 border-lime-500 rounded-xl text-lime-900 text-xs font-medium space-y-2">
              <IoCheckmarkCircleOutline className="w-8 h-8 text-lime-700 mx-auto" />
              <p className="font-bold text-sm text-lime-950">Reset Instructions Sent</p>
              <p className="leading-relaxed">
                If an account with <strong className="font-mono">{email}</strong> exists, you will receive an email shortly with a secure reset link valid for 30 minutes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-neutral-900 text-white font-extrabold rounded-xl text-xs hover:bg-neutral-800 transition-all border-2 border-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              Back to Home / Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative flex items-center">
                <IoMailOutline className="absolute left-3.5 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border-2 border-neutral-900 rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-lime-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-[#a3e635] text-neutral-950 font-black rounded-xl border-2 border-neutral-900 hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-black transition-colors"
              >
                <IoArrowBackOutline className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
