import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
    hasGradient?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hasGradient = true }) => {
    return (
        <div className="min-h-screen bg-background overflow-x-hidden font-sans">
            {hasGradient && (
                <>
                    {/* Gradient Overlay */}
                    <div className="fixed inset-0 bg-gradient-to-br from-background via-primary to-secondary opacity-80" />
                    
                    {/* Glow Effects */}
                    <div className="fixed inset-0 pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full opacity-20 blur-[100px] animate-glow" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary rounded-full opacity-20 blur-[100px] animate-glow animation-delay-1000" />
                    </div>
                </>
            )}
            
            {/* Main Content */}
            <div className="relative">
                {children}
            </div>
        </div>
    );
};

export default Layout;
