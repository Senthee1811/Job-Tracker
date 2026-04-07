  import React from 'react'


  const Navbar = () => {
    return (
      <nav className='flex justify-between items-center px-8 py-4'>
          <div>
            <h1 className='text-2xl font-bold'>Job Tracker</h1>
          </div>
          <div className='flex gap-4 items-center justify-center bg-lime-400/20 px-6 py-2 rounded-3xl'>
            <ul className='flex gap-4 items-center justify-center'>
              <li>Home</li>
              <li>Tracker</li>
              <li>Explored</li>
              <li>Bookmarks</li>
            </ul>
            <button className='bg-green-500/80 px-4 py-2 outline outline-black rounded-lg'>Login</button>
          </div>
      </nav>
    )
  }

  export default Navbar