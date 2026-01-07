import React from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { PrimaryButton, GhostButton } from '@/components/ui/button';

export function Hero({ onCta }: { onCta: () => void }) {
  return (
    <header className="bg-paper border-b-2 border-ink">
      <Container className="py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-title text-ink">Emblém</span>
            <span className="text-label font-mono text-ink">Studio</span>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-ink">
            <a href="#services" className="nav-link">
              Services
            </a>
            <a href="#work" className="nav-link">
              Work
            </a>
            <a href="#contact" className="nav-link">
              Contact
            </a>
          </nav>
        </div>
      </Container>

      <Container className="py-12 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="grid gap-8 md:grid-cols-2"
        >
          <div className="stack-lg">
            <span className="badge">Booking Q2 2026 · 2–6 week sprints</span>
            <h1 className="font-display text-hero text-ink">
              Editorial-grade digital experiences for teams who demand clarity and edge.
            </h1>
            <p className="text-lead text-muted max-w-3xl">
              Emblém is a small studio blending identity, product UX, and front-end build.
              We ship sharp systems that stay minimal, fast, and unmistakably yours.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton onClick={onCta}>Start a project</PrimaryButton>
              <GhostButton
                onClick={() =>
                  document.getElementById('work')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }
              >
                View selected work
              </GhostButton>
            </div>
            <div className="flex flex-wrap gap-6 text-xs font-mono text-soft">
              <span>Remote · UTC+1</span>
              <span>Design + development</span>
              <span>Built for launch speed</span>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="card p-6">
              <p className="text-label text-ink mb-3">Capabilities</p>
              <p className="text-sm text-muted">
                Brand systems, product UI, and marketing sites that feel like they were
                designed in-house.
              </p>
            </div>
            <div className="card p-6">
              <p className="text-label text-ink mb-3">Approach</p>
              <p className="text-sm text-muted">
                Tight sprints, a single team, and weekly checkpoints. Fewer decks, more
                working pages.
              </p>
            </div>
            <div className="card p-6">
              <p className="text-label text-ink mb-3">Availability</p>
              <p className="text-sm text-muted">
                Taking on two new partnerships for 2026. First response in 48 hours.
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </header>
  );
}
