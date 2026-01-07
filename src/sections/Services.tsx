'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { SectionHeading, Card } from '@/components/ui/Section';
import { motion } from 'framer-motion';

type ServiceItem = {
  id: number | string;
  title: string;
  desc: string;
  meta: string;
};

export function Services({ items }: { items: ServiceItem[] }) {
  return (
    <section id="services" className="py-12 md:py-32 border-b-2 border-ink bg-paper-strong">
      <Container>
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <div className="stack-sm">
            <SectionHeading>Services</SectionHeading>
            <p className="font-display text-title text-ink">
              A compact menu, built for founders and teams who move fast.
            </p>
          </div>
          <div className="stack-sm text-sm text-muted">
            <p>
              Every engagement starts with a working prototype, not a 50-slide strategy deck.
              We scope the essentials, ship fast, and iterate with precision.
            </p>
            <p>Most projects run in two to six weeks with a clear, shared schedule.</p>
          </div>
        </div>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {items.map(({ id, title, desc, meta }, i) => (
            <Card key={id} delay={i * 0.05} className="stack-sm">
              <p className="text-label text-ink">{meta}</p>
              <h3 className="font-display text-base text-ink">{title}</h3>
              <p className="text-sm text-muted">{desc}</p>
            </Card>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
