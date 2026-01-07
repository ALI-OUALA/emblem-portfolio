'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="section-label text-ink mb-6"
    >
      {children}
    </motion.h2>
  );
}

export function Card({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      whileHover={{ x: 3, y: -3 }}
      className={`card card-hover p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}
