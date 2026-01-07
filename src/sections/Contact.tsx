import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/Section';
import { PrimaryButton } from '@/components/ui/button';
import { apiFetch, API_BASE } from '@/lib/api';

type ContactProps = {
  title: string;
  subtitle: string;
  notes: string[];
  email: string;
};

export function Contact({ title, subtitle, notes, email }: ContactProps) {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      if (!API_BASE) {
        setStatus('success');
        setForm({ name: '', email: '', company: '', message: '' });
        return;
      }
      await apiFetch('/api/public/inquiries', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setStatus('success');
      setForm({ name: '', email: '', company: '', message: '' });
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="py-12 md:py-32 border-b-2 border-ink bg-paper-strong">
      <Container>
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <div className="stack-sm">
            <SectionHeading>Let&apos;s talk</SectionHeading>
            <p className="font-display text-title text-ink">{title}</p>
            <div className="stack-sm text-sm text-muted">
              <p>{subtitle}</p>
              {notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </div>
          <div className="stack-sm text-sm text-muted">
            <p className="text-label text-ink">Direct email</p>
            <a href={`mailto:${email}`} className="font-mono text-ink">
              {email}
            </a>
            <div className="stack-sm text-xs text-soft">
              <p>Preferred start windows: May – July 2026</p>
              <p>Typical engagements: 2–6 weeks, 1–2 calls per week</p>
            </div>
          </div>
        </div>
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          onSubmit={submit}
          className="card p-6 stack-md"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              className="field"
            />
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="field"
            />
          </div>
          <input
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="Company or project name (optional)"
            className="field"
          />
          <textarea
            required
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Share a few lines about goals, timeline, and any links."
            rows={5}
            className="field"
          />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <PrimaryButton type="submit">Send message</PrimaryButton>
            <p className="text-xs text-soft">
              {status === 'success'
                ? 'Thanks — we will get back to you shortly.'
                : status === 'error'
                  ? 'Something went wrong. Please try again or email us.'
                  : 'No newsletters, no automated follow-ups — just a reply from the studio.'}
            </p>
          </div>
        </motion.form>
      </Container>
    </section>
  );
}
