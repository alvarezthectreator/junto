import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  variant?: 'card' | 'avatar' | 'text' | 'line' | 'image';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

export function Skeleton({
  variant = 'card',
  width = '100%',
  height = 'auto',
  className = '',
  count = 1
}: SkeletonProps) {
  const baseClass =
    'bg-white/5 skeleton rounded-lg animate-pulse';

  const variantClass = {
    card: `${baseClass} rounded-2xl h-64 w-full`,
    avatar: `${baseClass} rounded-full w-12 h-12`,
    text: `${baseClass} rounded-md h-4 w-3/4`,
    line: `${baseClass} rounded-md h-6 w-full`,
    image: `${baseClass} rounded-xl h-48 w-full`
  };

  const skeletons = Array(count)
    .fill(0)
    .map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: i * 0.1
        }}
        style={{ width, height }}
        className={`${variantClass[variant]} ${className} ${i > 0 ? 'mt-3' : ''}`}
      />
    ));

  return <>{skeletons}</>;
}

export function CardSkeleton() {
  return (
    <div className="bg-[#1A1A21] rounded-3xl border border-white/5 p-6 space-y-4">
      <Skeleton variant="image" />
      <div className="space-y-3">
        <Skeleton variant="line" />
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="80%" />
      </div>
      <Skeleton variant="line" height="40px" />
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-4">
      {Array(3)
        .fill(0)
        .map((_, i) => (
          <CardSkeleton key={i} />
        ))}
    </div>
  );
}
