'use client';

import React from 'react';
import { Instagram, Linkedin, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';

type FooterProps = {
  footerBlurb: string;
  email: string;
  socials: {
    linkedin: string;
    instagram: string;
  };
};

export function Footer({ footerBlurb, email, socials }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="py-6 border-t-2 border-ink bg-paper">
      <Container className="flex flex-wrap items-center justify-between gap-4">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-xs font-mono text-soft"
        >
          © {year} {footerBlurb}
        </motion.p>
        <div className="flex flex-wrap items-center gap-4 text-soft">
          <a
            href={`mailto:${email}`}
            aria-label="Email"
            className="hover-ink flex items-center gap-2 text-sm"
          >
            <Mail size={18} />
            <span>{email}</span>
          </a>
          <a
            href={socials.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="hover-ink"
          >
            <Linkedin size={18} />
          </a>
          <a
            href={socials.instagram}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="hover-ink"
          >
            <Instagram size={18} />
          </a>
        </div>
      </Container>
    </footer>
  );
}
