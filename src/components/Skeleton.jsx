import React from 'react';

export function Skeleton({
  className = '',
  width,
  height,
  circle = false,
  count = 1,
}) {
  const baseStyles = `
    bg-light-300
    animate-pulse
    ${circle ? 'rounded-full' : 'rounded-lg'}
  `;

  const style = {
    width: width,
    height: height,
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${baseStyles} ${className}`}
          style={style}
        />
      ))}
    </>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton circle width={48} height={48} />
        <div className="flex-1">
          <Skeleton width="60%" height={20} className="mb-2" />
          <Skeleton width="40%" height={16} />
        </div>
      </div>
      <Skeleton width="100%" height={80} className="mb-3" />
      <div className="flex gap-2">
        <Skeleton width={80} height={32} className="rounded-full" />
        <Skeleton width={80} height={32} className="rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3"
        >
          <Skeleton circle width={40} height={40} />
          <div className="flex-1">
            <Skeleton width="70%" height={18} className="mb-2" />
            <Skeleton width="50%" height={14} />
          </div>
          <Skeleton width={24} height={24} circle />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton width="60%" height={24} />
      <Skeleton width="40%" height={16} className="mb-6" />
      
      <SkeletonCard />
      
      <Skeleton width="50%" height={20} className="mt-6 mb-4" />
      <SkeletonList count={3} />
    </div>
  );
}

export default Skeleton;
