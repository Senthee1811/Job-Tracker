import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IoCloseOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [age, setAge] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!firstname || !lastname || !email || !age || !password) {
          throw new Error('All fields are required');
        }
        await register({
          firstname,
          lastname,
          email,
          age: Number(age),
          password
        });
      }
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none'>
      <div className='bg-white w-full max-w-lg rounded-2xl border-2 border-black p-6 relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-200'>

        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-neutral-500 hover:text-neutral-900 border border-neutral-200 hover:border-black rounded-lg p-1 transition-all cursor-pointer'
        >
          <IoCloseOutline size={20} />
        </button>

        {/* Tab Headers */}
        <div className='flex gap-4 border-b border-neutral-200 mb-6'>
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`pb-2.5 text-lg font-bold transition-all cursor-pointer ${isLogin ? 'border-b-2 border-[#a3e635] text-neutral-900' : 'text-neutral-400'
              }`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`pb-2.5 text-lg font-bold transition-all cursor-pointer ${!isLogin ? 'border-b-2 border-[#a3e635] text-neutral-900' : 'text-neutral-400'
              }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-600 text-xs md:text-sm p-3 rounded-lg mb-4 font-semibold'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          {!isLogin && (
            <div className='flex gap-3'>
              <div className='flex-1 flex flex-col gap-1.5'>
                <label className='text-xs font-bold text-neutral-700 uppercase'>First Name</label>
                <input
                  type="text"
                  required
                  placeholder="John"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none transition-colors'
                />
              </div>
              <div className='flex-1 flex flex-col gap-1.5'>
                <label className='text-xs font-bold text-neutral-700 uppercase'>Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="Doe"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none transition-colors'
                />
              </div>
            </div>
          )}

          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-bold text-neutral-700 uppercase'>Email Address</label>
            <input
              type="email"
              required
              placeholder="john.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none transition-colors'
            />
          </div>

          {!isLogin && (
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-bold text-neutral-700 uppercase'>Age</label>
              <input
                type="number"
                required
                min="1"
                placeholder="22"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none transition-colors'
              />
            </div>
          )}

          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-bold text-neutral-700 uppercase'>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='border border-neutral-300 focus:border-black rounded-lg px-3 py-2 text-sm outline-none transition-colors'
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className='bg-[#a3e635] text-neutral-900 font-bold py-2.5 border-2 border-neutral-900 rounded-lg hover:bg-lime-400 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer mt-2 disabled:opacity-50 flex items-center justify-center gap-2'
          >
            {loading ? 'Processing...' : isLogin ? 'Log In' : 'Register Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
