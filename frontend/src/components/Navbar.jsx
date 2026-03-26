import React from 'react'
import logo from "../assets/logo.svg";

const Navbar = () => {
  return (
    <nav className='flex justify-between items-center'>
        <div>
            <img src={logo} alt="logo" className='w-32 h-32 object-fit'/>
        </div>
        <div className='flex gap-4 items-center justify-center bg-green-600/80 px-6 py-2 rounded-3xl'>
          <ul className='flex gap-4 items-center justify-center'>
            <li>Home</li>
            <li>Tracker</li>
            <li>Explored</li>
            <li>Bookmarks</li>
          </ul>
          <button className='bg-green-400/50 px-4 py-2 outline outline-black rounded-lg'>Login</button>
        </div>
    </nav>
  )
}

export default Navbar