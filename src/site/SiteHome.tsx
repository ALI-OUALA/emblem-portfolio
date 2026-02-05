"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Hero } from '@/sections/Hero';
import { Services } from '@/sections/Services';
import { Work } from '@/sections/Work';
import { Contact } from '@/sections/Contact';
import { Footer } from '@/sections/Footer';
import { apiFetch } from '@/lib/api';
import { defaultProjects, defaultServices, defaultSettings } from './content';

type ContentState = {
  settings: typeof defaultSettings;
  services: typeof defaultServices;
  projects: typeof defaultProjects;
};

export function SiteHome() {
  const [content, setContent] = useState<ContentState>({
    settings: defaultSettings,
    services: defaultServices,
    projects: defaultProjects,
  });
  useEffect(() => {
    let active = true;
    apiFetch('/api/public/content')
      .then((data) => {
        if (!active) return;
        setContent({
          settings: { ...defaultSettings, ...data.settings },
          services: data.services ?? defaultServices,
          projects: data.projects ?? defaultProjects,
        });
      })
      .catch(() => {
        if (!active) return;
        setContent({
          settings: defaultSettings,
          services: defaultServices,
          projects: defaultProjects,
        });
      })
      .finally(() => {});
    return () => {
      active = false;
    };
  }, []);

  const scrollToContact = useMemo(
    () => () => {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    },
    []
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Hero
        onCta={scrollToContact}
        badge={content.settings.heroBadge}
        title={content.settings.heroTitle}
        subtitle={content.settings.heroSubtitle}
        notes={content.settings.heroNotes}
      />
      <Services items={content.services} />
      <Work projects={content.projects} />
      <Contact
        title={content.settings.contactTitle}
        subtitle={content.settings.contactSubtitle}
        notes={content.settings.contactNotes}
        email={content.settings.contactEmail}
      />
      <Footer
        footerBlurb={content.settings.footerBlurb}
        email={content.settings.contactEmail}
        socials={content.settings.socials}
      />
    </div>
  );
}
