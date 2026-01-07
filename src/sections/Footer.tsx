import React from 'react';
import { Instagram, Linkedin, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';

export function Footer() {
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
          © {year} Emblém studio · design and dev studio · open for new projects.
        </motion.p>
        <div className="flex flex-wrap items-center gap-4 text-soft">
          <a
            href="mailto:hello@emblem.studio"
            aria-label="Email"
            className="hover-ink flex items-center gap-2 text-sm"
          >
            <Mail size={18} />
            <span>hello@emblem.studio</span>
          </a>
          <a
            href="https://www.linkedin.com"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="hover-ink"
          >
            <Linkedin size={18} />
          </a>
          <a
            href="https://www.instagram.com"
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
