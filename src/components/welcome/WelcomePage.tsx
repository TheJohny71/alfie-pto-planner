import React from 'react';
import { Calendar, Sparkles, Users } from 'lucide-react';

const WelcomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
      <div className="container mx-auto px-4 py-16 text-center">
        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-full shadow-lg"></div>
          <img 
            src="/assets/logo.png" 
            alt="PTO Manager Logo" 
            className="relative w-full h-full object-contain p-4"
          />
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-6">
            The modern way to manage time off
          </h1>
          
          <p className="text-xl text-purple-200 mb-12">
            Plan, track, and coordinate team time off with ease using our intelligent PTO management system
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4 mb-20">
            <button className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-medium transition-all transform hover:scale-105">
              Get Started →
            </button>
            <button className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-all">
              Learn More
            </button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Calendar className="w-8 h-8" />}
              title="Smart Calendar"
              description="Intelligent scheduling with team availability insights and conflict detection"
            />
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8" />}
              title="Auto-Tracking"
              description="Automated PTO balance calculations and smart notifications for your team"
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8" />}
              title="Team Sync"
              description="Seamless coordination with integrated approval workflows and team calendars"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
    <div className="text-white mb-4">
      {icon}
    </div>
    <h3 className="text-white text-lg font-semibold mb-2">
      {title}
    </h3>
    <p className="text-purple-200 text-sm">
      {description}
    </p>
  </div>
);

export default WelcomePage;
