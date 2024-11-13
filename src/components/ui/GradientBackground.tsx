import React from 'react';
import '../../../styles/components/gradients.css';

interface GradientBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ children, className = '' }) => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden font-sans">
      {/* Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-animate gradient-primary opacity-80"></div>

      {/* Glow Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full opacity-20 blur-[100px] animate-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary rounded-full opacity-20 blur-[100px] animate-glow animation-delay-1000"></div>
      </div>

      {/* Main Content */}
      <div className={`relative min-h-screen flex flex-col items-center justify-center p-4 ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default GradientBackground;
