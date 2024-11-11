import React from 'react';
import GradientBackground from '../ui/GradientBackground';
import Button from '../ui/Button';
import Card from '../ui/Card';

const WelcomePage: React.FC = () => {
  const features = [
    {
      title: 'Smart Calendar',
      description: 'Intelligent scheduling with conflict prevention and multi-year planning',
      icon: '📅'
    },
    {
      title: 'Auto-Tracking',
      description: 'Real-time PTO tracking with intelligent analytics and reporting',
      icon: '📊'
    },
    {
      title: 'Team Sync',
      description: 'Seamless department-wide coordination and leave management',
      icon: '🤝'
    }
  ];

  return (
    <GradientBackground>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white space-y-2">
            Create moments for{' '}
            <span className="text-[#A78BFA] inline-block animate-pulse">
              matters
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-white/90">
            Because the best stories aren't written at your desk
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {features.map((feature) => (
              <Card key={feature.title} className="transform hover:scale-105 transition-transform duration-300">
                <div className="p-6 text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-12 space-x-4">
            <Button 
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
              onClick={() => window.location.href = '/calendar.html'}
            >
              Get Started
            </Button>
            <Button 
              className="bg-white text-purple-600 hover:bg-gray-50"
              variant="outline"
              onClick={() => window.location.href = '#learn-more'}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
};

export default WelcomePage;
