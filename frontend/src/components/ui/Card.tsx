import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  onClick,
  hover = true
}) => {
  return (
    <div 
      onClick={onClick}
      className={`glass-card p-6 ${onClick ? 'cursor-pointer' : ''} ${hover ? 'hover:bg-card-secondary hover:-translate-y-1 transition-all duration-300' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
