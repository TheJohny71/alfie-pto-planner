import React from 'react';
import GradientBackground from '../ui/GradientBackground';

const WelcomePage: React.FC = () => {
  return (
    <GradientBackground>
      <div className="text-center space-y-8 max-w-5xl mx-auto px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="assets/alfie-icon.png" alt="Alfie Logo" className="h-20 w-20 animate__animated animate__fadeIn" />
        </div>
        
        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight animate__animated animate__fadeIn">
          Create moments for<br />what <span className="text-[#A78BFA]">matters</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl mx-auto animate__animated animate__fadeIn animate__delay-1s">
          Because the <span className="text-[#C4B5FD]">best stories</span> aren't written at your desk
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 animate__animated animate__fadeIn animate__delay-1s">
          <a href="calendar.html" className="inline-flex items-center px-8 py-3 text-lg font-medium text-white bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] rounded-full hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-primary/50 transform hover:scale-105">
            Get Started
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
          <button className="inline-flex items-center px-8 py-3 text-lg font-medium text-white bg-white/10 rounded-full hover:bg-white/20 transition-all duration-300">
            Learn More
          </button>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
          {/* Feature cards as before */}
          {/* ... feature cards content ... */}
        </div>
      </div>
    </GradientBackground>
  );
};

export default WelcomePage;
