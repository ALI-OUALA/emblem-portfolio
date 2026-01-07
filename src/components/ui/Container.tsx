import React from 'react';

type Props = { children: React.ReactNode; className?: string };

export function Container({ children, className = '' }: Props) {
  return <div className={`max-w-7xl mx-auto px-edge ${className}`}>{children}</div>;
}
