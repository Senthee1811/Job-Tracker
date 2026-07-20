import React from 'react';

const BackgroundGradient = () => {
  return (
    <div className='absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-neutral-50/50'>
      {/* Top Left Blob */}
      <div className='absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] max-w-[500px] rounded-full bg-lime-300/35 blur-[80px] md:blur-[120px]'></div>
      
      {/* Middle Right Blob */}
      <div className='absolute top-[30%] right-[-10%] w-[35vw] h-[35vw] max-w-[400px] rounded-full bg-lime-400/20 blur-[90px] md:blur-[130px]'></div>
      
      {/* Bottom Left Blob */}
      <div className='absolute bottom-[-10%] left-[5%] w-[45vw] h-[45vw] max-w-[600px] rounded-full bg-lime-300/30 blur-[100px] md:blur-[150px]'></div>
    </div>
  );
};

export default BackgroundGradient;