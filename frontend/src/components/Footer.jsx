import React from 'react'; 
import { FaFacebook, FaInstagram, FaGithub, FaWhatsapp } from 'react-icons/fa';

const Footer = ({ setActiveTab }) => {
  return (
    <footer className='bg-[#0c3d19] text-white py-16 px-6 md:px-12 select-none font-sans'>
      <div className='max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12'>
        
        {/* Left Side: Slogan & Sub-links */}
        <div className='flex-1 flex flex-col justify-between h-full min-h-[160px] gap-8'>
          <div>
            <p className='text-xl md:text-2xl font-light italic leading-relaxed text-lime-100 max-w-sm'>
              "Simplify your job <br className='hidden md:inline'/> 
              application journey <br className='hidden md:inline'/> 
              and stay organized <br className='hidden md:inline'/> 
              with <span className='text-[#a3e635] font-playwrite font-light not-italic'>ease</span>."
            </p>
          </div>
          
          <div className='flex flex-wrap gap-4 text-xs font-semibold text-lime-200/60 uppercase tracking-wider'>
            <a href="#about" className='hover:text-[#a3e635] transition-colors'>About Us</a>
            <a href="#contact" className='hover:text-[#a3e635] transition-colors'>Contact Us</a>
            <a href="#help" className='hover:text-[#a3e635] transition-colors'>Help</a>
            <a href="#privacy" className='hover:text-[#a3e635] transition-colors'>Privacy Policy</a>
            <a href="#disclaimer" className='hover:text-[#a3e635] transition-colors'>Disclaimer</a>
          </div>
        </div>

        {/* Right Side: Navigation & Social Columns */}
        <div className='flex gap-16 md:gap-24 items-start'>
          
          {/* Navigation Column */}
          <div className='flex flex-col gap-4'>
            <span className='text-xs font-bold tracking-widest text-[#a3e635] uppercase'>Navigation</span>
            <ul className='flex flex-col gap-2.5 text-sm text-lime-100/80 font-medium'>
              <li onClick={() => setActiveTab('home')} className='hover:text-[#a3e635] transition-colors cursor-pointer'>Home</li>
              <li onClick={() => setActiveTab('tracker')} className='hover:text-[#a3e635] transition-colors cursor-pointer'>Tracker</li>
              <li onClick={() => setActiveTab('explore')} className='hover:text-[#a3e635] transition-colors cursor-pointer'>Explore</li>
              <li onClick={() => setActiveTab('bookmarks')} className='hover:text-[#a3e635] transition-colors cursor-pointer'>Bookmarks</li>
              <li onClick={() => setActiveTab('profile')} className='hover:text-[#a3e635] transition-colors cursor-pointer'>Profile</li>
            </ul>
          </div>

          {/* Social Icons Column */}
          <div className='flex flex-col gap-4'>
            <span className='text-xs font-bold tracking-widest text-[#a3e635] uppercase'>About Us</span>
            <ul className='flex flex-col gap-4 text-lime-100/80'>
              <li>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className='hover:text-[#a3e635] transition-colors flex items-center gap-2'>
                  <FaFacebook size={18} />
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className='hover:text-[#a3e635] transition-colors flex items-center gap-2'>
                  <FaInstagram size={18} />
                </a>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className='hover:text-[#a3e635] transition-colors flex items-center gap-2'>
                  <FaGithub size={18} />
                </a>
              </li>
              <li>
                <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className='hover:text-[#a3e635] transition-colors flex items-center gap-2'>
                  <FaWhatsapp size={18} />
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      <div className='max-w-5xl mx-auto border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-lime-100/40'>
        <p>&copy; {new Date().getFullYear()} JT Tracker. All rights reserved.</p>
        <p>Built with Passion for Fresh Graduates</p>
      </div>
    </footer>
  );
};

export default Footer;