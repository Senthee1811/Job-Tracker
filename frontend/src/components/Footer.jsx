import React from 'react'

const Footer = () => {
  return (
    <footer className='flex items-center justify-center'>
        <div>
            <p>"Simplify your job application journey and stay organized with ease."</p>
        </div>
        <div>
            <span>Navigation</span>
            <ul>
                <li>Home</li>
                <li>Tracker</li>
                <li>Explored</li>
                <li>Bookmarks</li>
                <li>Profile</li>
            </ul>
        </div>
        <div>
            <span>ABOUT US</span>
            {/* 5 Icons */}
        </div>
    </footer>
  )
}

export default Footer