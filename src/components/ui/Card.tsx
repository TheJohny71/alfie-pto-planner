// src/components/ui/Card.tsx
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

const Card: React.FC<CardProps> = ({ 
    children, 
    className = '',
    hover = true 
}) => {
    const baseStyles = 'bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-white/10';
    const hoverStyles = hover ? 'hover:bg-white/10 transition-all duration-300' : '';

    return (
        <div className={`${baseStyles} ${hoverStyles} ${className}`}>
            {children}
        </div>
    );
};

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
    children,
    className = '' 
}) => (
    <h3 className={`text-xl font-semibold text-white mb-3 ${className}`}>
        {children}
    </h3>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
    children,
    className = '' 
}) => (
    <div className={`text-purple-200 ${className}`}>
        {children}
    </div>
);

export const CardIcon: React.FC<{ icon: React.ReactNode; className?: string }> = ({ 
    icon,
    className = '' 
}) => (
    <div className={`text-white text-3xl mb-4 ${className}`}>
        {icon}
    </div>
);

export default Card;
