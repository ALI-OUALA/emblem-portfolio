import React from 'react';
import { motion } from 'framer-motion';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function PrimaryButton({ children, className = '', type = 'button', ...props }: Props) {
  return (
    <motion.button
      type={type}
      whileHover={{ x: 3, y: -3 }}
      whileTap={{ x: 0, y: 0 }}
      className={`btn btn-primary ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function GhostButton({ children, className = '', type = 'button', ...props }: Props) {
  return (
    <motion.button
      type={type}
      whileHover={{ x: 3, y: -3 }}
      whileTap={{ x: 0, y: 0 }}
      className={`btn btn-ghost ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
