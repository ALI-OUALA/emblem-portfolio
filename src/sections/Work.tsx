import React from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/Section';

type ProjectItem = {
  id: number | string;
  title: string;
  role: string;
  summary: string;
  year: string;
  focus: string;
};

export function Work({ projects }: { projects: ProjectItem[] }) {
  return (
    <section id="work" className="py-12 md:py-32 border-b-2 border-ink bg-paper">
      <Container>
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <div className="stack-sm">
            <SectionHeading>Selected Work</SectionHeading>
            <p className="font-display text-title text-ink">
              Studies and concepts that map how Emblém thinks about structure and rhythm.
            </p>
          </div>
          <div className="stack-sm text-sm text-muted">
            <p>
              These are internal explorations and concept builds. New real-world work appears
              as projects ship.
            </p>
            <p>Every piece is designed as a reusable system, not a one-off page.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <motion.button
              key={project.id}
              type="button"
              onClick={() =>
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.05 }}
              className="card card-hover text-left overflow-hidden focus:ring-2"
            >
              <div className="p-4 border-b-2 border-ink bg-paper-strong">
                <div className="h-12 border-2 border-ink bg-accent" />
              </div>
              <div className="p-6 stack-sm">
                <div className="flex items-center justify-between text-label text-ink">
                  <span>{project.year}</span>
                  <span>{project.focus}</span>
                </div>
                <h3 className="font-display text-base text-ink">{project.title}</h3>
                <p className="text-xs text-muted">{project.role}</p>
                <p className="text-sm text-muted">{project.summary}</p>
                <span className="text-kicker text-soft">Discuss a similar project</span>
              </div>
            </motion.button>
          ))}
        </div>
      </Container>
    </section>
  );
}
