import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />
  );
};

export const SkeletonStatCard = () => (
  <div className="glass-card p-6 h-32 flex flex-col justify-between animate-pulse">
    <div className="flex justify-between items-start">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-3 w-16" />
  </div>
);

export const SkeletonMemberCard = () => (
  <div className="glass-card p-4 flex items-center justify-between animate-pulse">
    <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20 rounded-lg" />
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center space-x-4 py-4 px-6 animate-pulse border-b border-border/50">
    <Skeleton className="h-4 w-1/4" />
    <Skeleton className="h-4 w-1/4" />
    <Skeleton className="h-4 w-1/6" />
    <Skeleton className="h-4 w-1/6" />
    <Skeleton className="h-4 w-1/12" />
  </div>
);
