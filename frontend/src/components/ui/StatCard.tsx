import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number | string;
    isUp: boolean;
  };
  color?: 'primary' | 'accent' | 'orange' | 'red';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon, 
  description, 
  trend,
  color = 'primary',
  className
}) => {
  const colorMap = {
    primary: 'text-primary',
    accent: 'text-accent',
    orange: 'text-orange-400',
    red: 'text-red-500',
  };

  const bgMap = {
    primary: 'bg-primary/10',
    accent: 'bg-accent/10',
    orange: 'bg-orange-400/10',
    red: 'bg-red-500/10',
  };

  const gradientMap = {
    primary: 'stat-card-gradient-primary',
    accent: 'stat-card-gradient-accent',
    orange: '',
    red: '',
  };

  return (
    <Card className={`relative overflow-hidden ${gradientMap[color]} ${className || ''}`} hover={true}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted mb-1">{label}</p>
          <h3 className="text-2xl font-black tracking-tight text-white">{value}</h3>
        </div>
        {icon && (
          <div className={`p-3 rounded-xl ${bgMap[color]} ${colorMap[color]} border border-white/5 shadow-inner`}>
            {React.cloneElement(icon as React.ReactElement, { size: 20 })}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 mt-auto">
        {trend && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            trend.isUp ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'
          }`}>
            {trend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.value}
          </div>
        )}
        {description && <p className="text-[10px] text-foreground-muted/70 font-semibold tracking-wide uppercase">{description}</p>}
      </div>
    </Card>
  );
};
