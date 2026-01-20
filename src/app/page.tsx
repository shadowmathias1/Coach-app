'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { useTheme } from '@/components/shared/ThemeProvider';
import { useLanguage } from '@/components/shared/LanguageProvider';
import MorphingDumbbell from '@/components/landing/MorphingDumbbell';
import FloatingDumbbells from '@/components/landing/FloatingDumbbells';
import ParticleBackground from '@/components/landing/ParticleBackground';
import Globe from '@/components/landing/Globe';
import WordPullUp from '@/components/ui/WordPullUp';
import MovingButton from '@/components/ui/MovingButton';
import SpinningText from '@/components/ui/SpinningText';
import MagicCard from '@/components/ui/MagicCard';
import AnimatedThemeToggler from '@/components/ui/AnimatedThemeToggler';

type Language = 'fr' | 'en';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

const bodyFont = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

const copy: Record<Language, {
  brand: string;
  brandTagline: string;
  nav: {
    values: string;
    benefits: string;
    process: string;
    testimonials: string;
  };
  buttons: {
    login: string;
    start: string;
    demo: string;
    themeLight: string;
    themeDark: string;
  };
  hero: {
    badge: string;
    title: string;
    accent: string;
    description: string;
    bullets: string[];
  };
  impact: {
    label: string;
    title: string;
    badge: string;
    items: string[];
    retentionTitle: string;
    retentionValue: string;
    retentionNote: string;
    calmTitle: string;
    calmValue: string;
    calmNote: string;
    exampleLabel: string;
    exampleNote: string;
  };
  values: {
    label: string;
    cards: { title: string; text: string }[];
  };
  beforeAfter: {
    label: string;
    title: string;
    text: string;
    beforeTitle: string;
    afterTitle: string;
    beforeList: string[];
    afterList: string[];
  };
  process: {
    label: string;
    title: string;
    text: string;
    steps: { title: string; text: string }[];
  };
  testimonial: {
    label: string;
    quote: string;
    author: string;
    sideTitle: string;
    sideText: string;
    cta: string;
  };
  final: {
    title: string;
    text: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  footer: {
    rights: string;
    benefits: string;
    process: string;
    login: string;
  };
}> = {
  fr: {
    brand: 'Coach App',
    brandTagline: 'Fidelisation & suivi',
    nav: {
      values: 'Valeurs',
      benefits: 'Benefices',
      process: 'Process',
      testimonials: 'Temoignages',
    },
    buttons: {
      login: 'Connexion',
      start: 'Demarrer gratuitement',
      demo: 'Voir la demo',
      themeLight: 'Clair',
      themeDark: 'Sombre',
    },
    hero: {
      badge: 'Simplifie ton coaching',
      title: "L'app qui fidelise tes clients,",
      accent: 'securise ton business et libere ton esprit.',
      description:
        'Fini les notes dispersees, les tableaux Excel et les messages WhatsApp qui empietent sur ta vie privee. Tout est centralise dans une seule app, claire et humaine, pour un suivi qui donne envie de rester.',
      bullets: ['Sans engagement', 'App coach + app client', 'Support humain'],
    },
    impact: {
      label: "Tableau d'impact",
      title: 'Clients fideles, business en paix',
      badge: 'Temps gagne',
      items: [
        'Suivi personnalise sans relance manuelle',
        'Check-ins automatises, transparents, clairs',
        'Messages pro dans un espace dedie',
      ],
      retentionTitle: 'Retention',
      retentionValue: 'Solide',
      retentionNote: 'clients qui restent engages',
      calmTitle: 'Serenite',
      calmValue: 'Temps libere',
      calmNote: 'pour coacher et creer',
      exampleLabel: 'Exemple client',
      exampleNote: 'Unites adaptees automatiquement selon la langue.',
    },
    values: {
      label: 'Valeurs',
      cards: [
        {
          title: 'Pro sans sacrifier ta vie privee',
          text: "Tes echanges clients restent dans l'app. Pas de WhatsApp tard le soir, pas de confusion entre perso et boulot.",
        },
        {
          title: 'Une relation qui donne envie de rester',
          text: 'Des programmes clairs, des check-ins simples, des objectifs visibles. Tes clients sentent que tu es present.',
        },
        {
          title: 'Une image premium',
          text: 'Fini le bricolage. Tu offres une vraie experience, coherente et moderne, qui inspire confiance.',
        },
      ],
    },
    beforeAfter: {
      label: 'Avant / Apres',
      title: 'Tout centraliser pour gagner en clarte et en impact.',
      text:
        'On arrete les feuilles dispersees, les relances manuelles, les messages perdus. On garde une seule source de verite, accessible et elegante.',
      beforeTitle: 'Sans Coach App',
      afterTitle: 'Avec Coach App',
      beforeList: [
        'Notes eparpillees, Excel, PDF.',
        'Relances manuelles pour les paiements.',
        'WhatsApp qui deborde sur le perso.',
        'Suivi flou et temps perdu.',
      ],
      afterList: [
        'Programmes, check-ins et progres au meme endroit.',
        'Rappels et automatisations simples.',
        "Messages pros centralises dans l'app.",
        'Clients plus engages et fideles.',
      ],
    },
    process: {
      label: 'Demarrage simple',
      title: '3 etapes pour transformer ton coaching.',
      text:
        'On cree ton espace, on invite tes clients, puis on lance ton premier programme. Tu es pret en quelques minutes.',
      steps: [
        {
          title: '1. Cree ton espace',
          text: 'Branding, objectifs et methodes.',
        },
        {
          title: '2. Invite tes clients',
          text: 'Acces immediat a leur app.',
        },
        {
          title: '3. Lance ton programme',
          text: 'Suivi automatique et clair.',
        },
      ],
    },
    testimonial: {
      label: 'Temoignage',
      quote:
        "J'ai enfin une vraie experience client. Mes coachings sont clairs, mes clients se sentent suivis, et je n'ai plus les messages persos tard le soir.",
      author: 'Amira L. - Coach sportif, Lyon',
      sideTitle: "Plus qu'une app : un cadre qui rassure.",
      sideText:
        'Les clients sentent la difference : suivi fluide, objectifs clairs, et une communication professionnelle. Toi, tu recuperes du temps et de l energie pour coacher.',
      cta: 'Commencer maintenant',
    },
    final: {
      title: 'On centralise tout pour toi.',
      text:
        'Une app pour tes clients, une app pour toi. Un suivi pro, une relation humaine, et un business qui grandit sans te deborder.',
      ctaPrimary: 'Demarrer gratuitement',
      ctaSecondary: 'Se connecter',
    },
    footer: {
      rights: 'Coach App (c) 2026. Tous droits reserves.',
      benefits: 'Benefices',
      process: 'Process',
      login: 'Connexion',
    },
  },
  en: {
    brand: 'Coach App',
    brandTagline: 'Retention & clarity',
    nav: {
      values: 'Values',
      benefits: 'Benefits',
      process: 'Process',
      testimonials: 'Testimonials',
    },
    buttons: {
      login: 'Sign in',
      start: 'Start free',
      demo: 'See the demo',
      themeLight: 'Light',
      themeDark: 'Dark',
    },
    hero: {
      badge: 'Simplify your coaching',
      title: 'The app that keeps clients loyal,',
      accent: 'protects your business and clears your mind.',
      description:
        'No more scattered notes, Excel sheets, or WhatsApp messages that invade your private life. Everything is centralized in one clean, human app so clients stay engaged.',
      bullets: ['No commitment', 'Coach app + client app', 'Human support'],
    },
    impact: {
      label: 'Impact dashboard',
      title: 'Loyal clients, calm business',
      badge: 'Time saved',
      items: [
        'Personalized follow-up without manual reminders',
        'Automated, transparent check-ins',
        'Professional messaging in one place',
      ],
      retentionTitle: 'Retention',
      retentionValue: 'Strong',
      retentionNote: 'clients stay engaged longer',
      calmTitle: 'Peace of mind',
      calmValue: 'Time regained',
      calmNote: 'to coach and create',
      exampleLabel: 'Client example',
      exampleNote: 'Units adapt automatically with language.',
    },
    values: {
      label: 'Values',
      cards: [
        {
          title: 'Pro without losing your private life',
          text: 'Your client messages stay inside the app. No late WhatsApp, no blurred boundaries.',
        },
        {
          title: 'A relationship that makes clients stay',
          text: 'Clear programs, simple check-ins, visible goals. Clients feel your presence.',
        },
        {
          title: 'A premium image',
          text: 'No more patchwork. You deliver a consistent, modern experience that builds trust.',
        },
      ],
    },
    beforeAfter: {
      label: 'Before / After',
      title: 'Centralize everything for clarity and impact.',
      text:
        'Stop the scattered files, manual reminders, and lost messages. Keep a single source of truth that is elegant and accessible.',
      beforeTitle: 'Without Coach App',
      afterTitle: 'With Coach App',
      beforeList: [
        'Scattered notes, Excel, PDF.',
        'Manual payment reminders.',
        'WhatsApp mixing work and personal life.',
        'Blurred follow-up and wasted time.',
      ],
      afterList: [
        'Programs, check-ins, and progress in one place.',
        'Simple reminders and automations.',
        'Professional messaging inside the app.',
        'More engaged and loyal clients.',
      ],
    },
    process: {
      label: 'Simple start',
      title: '3 steps to transform your coaching.',
      text:
        'We set up your space, invite clients, then launch your first program. You are ready in minutes.',
      steps: [
        {
          title: '1. Build your space',
          text: 'Branding, goals, and methods.',
        },
        {
          title: '2. Invite clients',
          text: 'Instant access to their app.',
        },
        {
          title: '3. Launch your program',
          text: 'Automatic and clear follow-up.',
        },
      ],
    },
    testimonial: {
      label: 'Testimonial',
      quote:
        'I finally deliver a real client experience. Sessions are clear, clients feel supported, and no more late personal messages.',
      author: 'Amira L. - Fitness coach, Lyon',
      sideTitle: 'More than an app: a framework that reassures.',
      sideText:
        'Clients feel the difference: fluid follow-up, clear goals, and professional communication. You regain time and energy to coach.',
      cta: 'Start now',
    },
    final: {
      title: 'We centralize it all for you.',
      text:
        'One app for your clients, one app for you. A pro follow-up, a human relationship, and a business that grows without overflow.',
      ctaPrimary: 'Start free',
      ctaSecondary: 'Sign in',
    },
    footer: {
      rights: 'Coach App (c) 2026. All rights reserved.',
      benefits: 'Benefits',
      process: 'Process',
      login: 'Sign in',
    },
  },
};

const toLbs = (kg: number) => Math.round(kg * 2.20462);
const toFeetInches = (cm: number) => {
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches - feet * 12;
  return { feet, inches };
};

export default function HomePage() {
  const { resolvedMode } = useTheme();
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const isDark = resolvedMode === 'dark';
  const t = copy[language];

  const sampleWeightKg = 78;
  const sampleHeightCm = 182;
  const sampleWeightLb = toLbs(sampleWeightKg);
  const height = toFeetInches(sampleHeightCm);
  const exampleValue =
    language === 'fr'
      ? `${sampleWeightKg} kg - ${sampleHeightCm} cm`
      : `${sampleWeightLb} lb - ${height.feet} ft ${height.inches} in`;
  const marqueeText =
    language === 'fr'
      ? 'SUIVI PRO - CHECK-INS - MESSAGES - PROGRAMMES - OBJECTIFS - '
      : 'PRO FOLLOW-UP - CHECK-INS - MESSAGES - PROGRAMS - GOALS - ';
  const marqueeLoop = marqueeText.repeat(6);

  const themeStyles = {
    '--landing-bg': 'rgb(var(--color-background))',
    '--landing-surface': 'rgb(var(--color-background-surface))',
    '--landing-elevated': 'rgb(var(--color-background-elevated))',
    '--landing-ink': 'rgb(var(--color-text-primary))',
    '--landing-muted': 'rgb(var(--color-text-secondary))',
    '--landing-soft': 'rgb(var(--color-text-tertiary))',
    '--landing-accent': 'rgb(var(--color-primary))',
    '--landing-accent-strong': 'rgb(var(--color-primary-dark))',
    '--landing-accent-light': 'rgb(var(--color-primary-light))',
    '--landing-accent-2': 'rgb(var(--color-secondary))',
    '--landing-border': 'rgb(var(--color-border))',
    '--landing-glow': isDark
      ? 'rgb(var(--color-primary) / 0.35)'
      : 'rgb(var(--color-primary) / 0.2)',
    '--landing-glow-2': isDark
      ? 'rgb(var(--color-secondary) / 0.25)'
      : 'rgb(var(--color-secondary) / 0.12)',
  } as CSSProperties;

  return (
    <div
      className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-[color:var(--landing-bg)] text-[color:var(--landing-ink)] relative overflow-hidden`}
      style={themeStyles}
    >
      {/* Animated background elements */}
      <ParticleBackground />
      <FloatingDumbbells />
      <MorphingDumbbell />
      <div className="relative overflow-hidden">
        {/* Enhanced gradient orbs with animations */}
        <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,var(--landing-glow),transparent_65%)] blur-3xl motion-safe:animate-pulse-soft opacity-80" />
        <div className="pointer-events-none absolute right-0 top-0 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle_at_center,var(--landing-glow-2),transparent_65%)] blur-3xl motion-safe:animate-float opacity-70" />
        <div className="pointer-events-none absolute left-1/2 top-[30rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,var(--landing-glow),transparent_65%)] blur-3xl opacity-60" />

        {/* Additional ambient orbs for depth */}
        <div className="pointer-events-none absolute right-1/4 top-[50rem] h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,var(--landing-glow-2),transparent_70%)] blur-3xl motion-safe:animate-pulse-soft opacity-40" />
        <div className="pointer-events-none absolute left-1/4 top-[70rem] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,var(--landing-glow),transparent_70%)] blur-3xl opacity-30" />

        <header className="relative z-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--landing-soft)]">{t.brand}</p>
              <p className="text-lg font-semibold">{t.brandTagline}</p>
            </div>
            <nav className="hidden items-center gap-6 text-sm text-[color:var(--landing-muted)] lg:flex">
              <a href="#values" className="hover:text-[color:var(--landing-ink)]">{t.nav.values}</a>
              <a href="#benefits" className="hover:text-[color:var(--landing-ink)]">{t.nav.benefits}</a>
              <a href="#process" className="hover:text-[color:var(--landing-ink)]">{t.nav.process}</a>
              <a href="#testimonials" className="hover:text-[color:var(--landing-ink)]">{t.nav.testimonials}</a>
            </nav>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setLanguage('fr')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  language === 'fr'
                    ? 'bg-[color:var(--landing-accent)] text-white'
                    : 'border border-[color:var(--landing-border)] text-[color:var(--landing-muted)]'
                }`}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  language === 'en'
                    ? 'bg-[color:var(--landing-accent)] text-white'
                    : 'border border-[color:var(--landing-border)] text-[color:var(--landing-muted)]'
                }`}
              >
                EN
              </button>
              <AnimatedThemeToggler
                className="rounded-full border border-[color:var(--landing-border)] px-3 py-1 text-[color:var(--landing-muted)]"
              />
              <Link
                href="/auth/login"
                className="rounded-full border border-[color:var(--landing-border)] px-4 py-2 text-sm font-semibold text-[color:var(--landing-muted)] hover:text-[color:var(--landing-ink)]"
              >
                {t.buttons.login}
              </Link>
            </div>
          </div>
        </header>

        <main className="relative z-10">
          <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-16 pt-10 lg:flex-row lg:items-center">
            <div className="relative flex-1 text-center lg:text-left motion-safe:animate-fade-in">
              <span className="inline-flex items-center rounded-full border border-[color:var(--landing-border)] bg-[color:var(--landing-surface)]/50 backdrop-blur-md px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--landing-muted)] shadow-lg motion-safe:animate-slide-down">
                {t.hero.badge}
              </span>
              <div className="mt-8">
                <WordPullUp
                  words={t.hero.title}
                  className="text-5xl font-bold leading-tight md:text-6xl lg:text-7xl text-center lg:text-left text-[color:var(--landing-ink)]"
                />
                <span className="block mt-2 bg-gradient-to-r from-[color:var(--landing-accent)] via-[color:var(--landing-accent-2)] to-[color:var(--landing-accent-light)] bg-clip-text text-transparent text-5xl font-bold leading-tight md:text-6xl lg:text-7xl text-center lg:text-left">
                  {t.hero.accent}
                </span>
              </div>
              <p className="mt-8 text-lg leading-relaxed text-[color:var(--landing-muted)] max-w-2xl motion-safe:animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
                {t.hero.description}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-[color:var(--landing-soft)] lg:justify-start motion-safe:animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
                {t.hero.bullets.map((bullet, idx) => (
                  <span
                    key={bullet}
                    className="rounded-full border border-[color:var(--landing-border)] bg-[color:var(--landing-surface)]/30 backdrop-blur-sm px-4 py-2 hover:bg-[color:var(--landing-surface)]/50 hover:scale-105 transition-all duration-300"
                    style={{ animationDelay: `${0.4 + idx * 0.1}s` }}
                  >
                    {bullet}
                  </span>
                ))}
              </div>
              <div className="mt-10 flex flex-wrap justify-center gap-4 lg:justify-start motion-safe:animate-slide-up" style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}>
                <MovingButton
                  text={t.buttons.start}
                  onClick={() => router.push('/auth/register')}
                  className="w-full sm:w-auto min-w-[280px] text-base font-semibold"
                />
                <MovingButton
                  text={t.buttons.demo}
                  onClick={() => router.push('/auth/login')}
                  className="w-full sm:w-auto min-w-[200px] text-sm font-semibold"
                />
              </div>
            </div>

            <div className="flex-1 motion-safe:animate-scale-in" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
              <div className="relative rounded-3xl border-2 border-[color:var(--landing-border)] bg-gradient-to-br from-[color:var(--landing-surface)] to-[color:var(--landing-elevated)] p-8 shadow-2xl backdrop-blur-xl overflow-hidden group hover:border-[color:var(--landing-accent)]/30 transition-all duration-500">
                {/* Decorative gradient orb */}
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-[color:var(--landing-accent)]/20 to-[color:var(--landing-accent-2)]/20 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--landing-soft)] font-bold">{t.impact.label}</p>
                    <span className="rounded-full bg-gradient-to-r from-[color:var(--landing-accent)] to-[color:var(--landing-accent-2)] px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                      {t.impact.badge}
                    </span>
                  </div>
                  <h2 className="mt-6 text-3xl font-bold bg-gradient-to-r from-[color:var(--landing-ink)] to-[color:var(--landing-accent)] bg-clip-text text-transparent">{t.impact.title}</h2>
                  <ul className="mt-6 space-y-4 text-base text-[color:var(--landing-muted)]">
                    {t.impact.items.map((item, idx) => (
                      <li key={item} className="flex items-start gap-3 group/item">
                        <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-[color:var(--landing-accent)] to-[color:var(--landing-accent-2)] shadow-lg group-hover/item:scale-125 transition-transform" />
                        <span className="group-hover/item:text-[color:var(--landing-ink)] transition-colors">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border-2 border-[color:var(--landing-border)] bg-[color:var(--landing-elevated)]/50 p-5 backdrop-blur-md">
                      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--landing-soft)] font-bold">{t.impact.retentionTitle}</p>
                      <p className="mt-3 text-3xl font-bold bg-gradient-to-r from-[color:var(--landing-accent)] to-[color:var(--landing-accent-2)] bg-clip-text text-transparent">{t.impact.retentionValue}</p>
                      <p className="text-xs text-[color:var(--landing-muted)] mt-1">{t.impact.retentionNote}</p>
                    </div>
                    <div className="rounded-2xl border-2 border-[color:var(--landing-border)] bg-[color:var(--landing-elevated)]/50 p-5 backdrop-blur-md">
                      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--landing-soft)] font-bold">{t.impact.calmTitle}</p>
                      <p className="mt-3 text-3xl font-bold bg-gradient-to-r from-[color:var(--landing-accent-2)] to-[color:var(--landing-accent)] bg-clip-text text-transparent">{t.impact.calmValue}</p>
                      <p className="text-xs text-[color:var(--landing-muted)] mt-1">{t.impact.calmNote}</p>
                    </div>
                  </div>
                  <MagicCard className="mt-6 rounded-2xl border-2 border-[color:var(--landing-border)] bg-gradient-to-br from-[color:var(--landing-elevated)] to-[color:var(--landing-surface)] p-5 backdrop-blur-md">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--landing-soft)] font-bold">{t.impact.exampleLabel}</p>
                    <p className="mt-3 text-xl font-bold text-[color:var(--landing-ink)]">{exampleValue}</p>
                    <p className="text-xs text-[color:var(--landing-muted)] mt-1">{t.impact.exampleNote}</p>
                  </MagicCard>
                </div>
              </div>
            </div>
          </section>

          <section className="relative py-6">
            <div className="scroll-container border-y border-[color:var(--landing-border)] bg-[color:var(--landing-surface)]/40 backdrop-blur-md">
              <div className="scroll-content min-w-full py-3 text-base md:text-lg font-bold uppercase tracking-[0.45em] bg-gradient-to-r from-[color:var(--landing-accent)] via-[color:var(--landing-accent-2)] to-[color:var(--landing-accent-light)] bg-clip-text text-transparent">
                <span className="px-6">{marqueeLoop}</span>
              </div>
              <div className="scroll-content min-w-full py-3 text-base md:text-lg font-bold uppercase tracking-[0.45em] bg-gradient-to-r from-[color:var(--landing-accent)] via-[color:var(--landing-accent-2)] to-[color:var(--landing-accent-light)] bg-clip-text text-transparent">
                <span className="px-6">{marqueeLoop}</span>
              </div>
            </div>
          </section>

          {/* Globe section - Global reach */}
          <section className="relative py-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1 text-center lg:text-left">
                  <span className="inline-flex items-center rounded-full border border-[color:var(--landing-border)] bg-[color:var(--landing-surface)]/50 backdrop-blur-md px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--landing-muted)] shadow-lg mb-6">
                    {language === 'fr' ? 'Portee mondiale' : 'Global reach'}
                  </span>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    {language === 'fr' ? 'Gerez vos clients' : 'Manage your clients'}
                    <span className="block mt-2 bg-gradient-to-r from-[color:var(--landing-accent)] via-[color:var(--landing-accent-2)] to-[color:var(--landing-accent-light)] bg-clip-text text-transparent">
                      {language === 'fr' ? 'partout dans le monde' : 'anywhere in the world'}
                    </span>
                  </h2>
                  <p className="text-lg text-[color:var(--landing-muted)] mb-8 max-w-xl">
                    {language === 'fr'
                      ? "Peu importe ou vous etes, accedez a votre tableau de bord, suivez vos clients et gerez vos programmes d'entrainement. Coaching sans frontieres, disponible 24/7."
                      : 'No matter where you are, access your dashboard, track your clients, and manage your training programs. Coaching without borders, available 24/7.'}
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[color:var(--landing-surface)]/50 backdrop-blur-sm border border-[color:var(--landing-border)]">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[color:var(--landing-accent)] to-[color:var(--landing-accent-2)] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{language === 'fr' ? 'Acces 24/7' : '24/7 Access'}</p>
                        <p className="text-xs text-[color:var(--landing-muted)]">{language === 'fr' ? 'Toujours disponible' : 'Always available'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[color:var(--landing-surface)]/50 backdrop-blur-sm border border-[color:var(--landing-border)]">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[color:var(--landing-accent-2)] to-[color:var(--landing-accent)] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{language === 'fr' ? 'Multi-fuseaux' : 'Multi-timezone'}</p>
                        <p className="text-xs text-[color:var(--landing-muted)]">{language === 'fr' ? 'Synchronise' : 'Synchronized'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2 relative flex items-center justify-center">
                  <div className="relative flex h-[500px] w-full max-w-[500px] items-center justify-center overflow-hidden rounded-3xl border-2 border-[color:var(--landing-border)] bg-gradient-to-br from-[color:var(--landing-surface)] to-[color:var(--landing-elevated)] shadow-2xl backdrop-blur-xl">
                    <span className="pointer-events-none absolute top-8 z-10 select-none whitespace-pre-wrap bg-gradient-to-b from-[color:var(--landing-ink)] to-[color:var(--landing-muted)] bg-clip-text text-center text-7xl font-black leading-none text-transparent opacity-30">
                      {language === 'fr' ? 'COACHING' : 'GLOBAL'}
                    </span>
                    <SpinningText
                      duration={18}
                      reverse
                      className="pointer-events-none absolute bottom-6 right-6 h-56 w-56 text-[14px] font-extrabold uppercase tracking-[0.45em] text-[color:var(--landing-soft)] opacity-80"
                    >
                      {language === 'fr'
                        ? 'GLOBAL - 24/7 - COACHING - CLIENTS - '
                        : 'GLOBAL - 24/7 - COACHING - CLIENTS - '}
                    </SpinningText>
                    <Globe className="top-28" />
                    <div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_50%_200%,rgba(99,102,241,0.1),rgba(255,255,255,0))]" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Trust bar with stats */}
          <section className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 bg-[color:var(--landing-surface)]" />
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-[color:var(--landing-accent)]/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[color:var(--landing-accent-2)]/20 rounded-full blur-3xl" />
            </div>
            <div className="relative mx-auto w-full max-w-7xl px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center group">
                  <div className="relative inline-block mb-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--landing-accent)] to-[color:var(--landing-accent-2)] opacity-20 blur-2xl group-hover:opacity-30 transition-opacity" />
                    <p
                      className="relative text-6xl md:text-7xl font-black group-hover:scale-110 transition-transform duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgb(var(--landing-accent)) 0%, rgb(var(--landing-accent-2)) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      500+
                    </p>
                  </div>
                  <p className="text-[color:var(--landing-muted)] text-sm font-semibold uppercase tracking-wider">Coachs actifs</p>
                </div>
                <div className="text-center group">
                  <div className="relative inline-block mb-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--landing-accent-2)] to-[color:var(--landing-accent)] opacity-20 blur-2xl group-hover:opacity-30 transition-opacity" />
                    <p
                      className="relative text-6xl md:text-7xl font-black group-hover:scale-110 transition-transform duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgb(var(--landing-accent-2)) 0%, rgb(var(--landing-accent)) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      92%
                    </p>
                  </div>
                  <p className="text-[color:var(--landing-muted)] text-sm font-semibold uppercase tracking-wider">Taux de rétention</p>
                </div>
                <div className="text-center group">
                  <div className="relative inline-block mb-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-success)] to-[color:var(--landing-accent)] opacity-20 blur-2xl group-hover:opacity-30 transition-opacity" />
                    <p
                      className="relative text-6xl md:text-7xl font-black group-hover:scale-110 transition-transform duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgb(var(--color-success)) 0%, rgb(var(--landing-accent)) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      15h
                    </p>
                  </div>
                  <p className="text-[color:var(--landing-muted)] text-sm font-semibold uppercase tracking-wider">Gagnées/semaine</p>
                </div>
                <div className="text-center group">
                  <div className="relative inline-block mb-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--landing-accent)] to-[color:var(--landing-accent-2)] opacity-20 blur-2xl group-hover:opacity-30 transition-opacity" />
                    <p
                      className="relative text-6xl md:text-7xl font-black group-hover:scale-110 transition-transform duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgb(var(--landing-accent)) 0%, rgb(var(--landing-accent-2)) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      4.9/5
                    </p>
                  </div>
                  <p className="text-[color:var(--landing-muted)] text-sm font-semibold uppercase tracking-wider">Satisfaction</p>
                </div>
              </div>
            </div>
          </section>

          <section id="values" className="mx-auto w-full max-w-7xl px-6 py-20">
            <div className="text-center mb-12">
              <span className="inline-block rounded-full border border-[color:var(--landing-border)] bg-[color:var(--landing-surface)]/50 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[color:var(--landing-soft)]">{t.values.label}</span>
            </div>
            <div className="mt-10 grid gap-8 lg:grid-cols-3">
              {t.values.cards.map((card, idx) => (
                <MagicCard
                  key={card.title}
                  className="group relative rounded-3xl border-2 border-[color:var(--landing-border)] bg-gradient-to-br from-[color:var(--landing-surface)] to-[color:var(--landing-elevated)] p-8 shadow-xl hover:shadow-2xl hover:border-[color:var(--landing-accent)]/40 transition-all duration-500 hover:scale-105 overflow-hidden"
                  gradientColor="rgb(var(--color-primary) / 0.35)"
                  gradientOpacity={0.8}
                >
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[color:var(--landing-accent)]/10 to-[color:var(--landing-accent-2)]/10 blur-2xl group-hover:scale-150 transition-transform duration-700" />

                  <div className="relative z-10">
                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--landing-accent)] to-[color:var(--landing-accent-2)] shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-[color:var(--landing-ink)] group-hover:text-[color:var(--landing-accent)] transition-colors">{card.title}</h3>
                    <p className="mt-4 text-base leading-relaxed text-[color:var(--landing-muted)]">{card.text}</p>
                  </div>
                </MagicCard>
              ))}
            </div>
          </section>

          <section id="benefits" className="mx-auto w-full max-w-7xl px-6 py-14">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--landing-soft)]">{t.beforeAfter.label}</p>
            <h2 className="mt-4 text-3xl font-semibold">{t.beforeAfter.title}</h2>
            <p className="mt-3 max-w-3xl text-sm text-[color:var(--landing-muted)]">{t.beforeAfter.text}</p>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <MagicCard className="rounded-3xl border border-[color:var(--landing-border)] bg-[color:var(--landing-surface)] p-6">
                <h3 className="text-lg font-semibold">{t.beforeAfter.beforeTitle}</h3>
                <ul className="mt-4 space-y-2 text-sm text-[color:var(--landing-muted)]">
                  {t.beforeAfter.beforeList.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </MagicCard>
              <MagicCard className="rounded-3xl border border-[color:var(--landing-border)] bg-[color:var(--landing-elevated)] p-6">
                <h3 className="text-lg font-semibold">{t.beforeAfter.afterTitle}</h3>
                <ul className="mt-4 space-y-2 text-sm text-[color:var(--landing-muted)]">
                  {t.beforeAfter.afterList.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </MagicCard>
            </div>
          </section>

          <section id="process" className="mx-auto w-full max-w-7xl px-6 py-14">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--landing-soft)]">{t.process.label}</p>
            <h2 className="mt-4 text-3xl font-semibold">{t.process.title}</h2>
            <p className="mt-3 max-w-3xl text-sm text-[color:var(--landing-muted)]">{t.process.text}</p>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {t.process.steps.map((step) => (
                <MagicCard key={step.title} className="rounded-3xl border border-[color:var(--landing-border)] bg-[color:var(--landing-surface)] p-6">
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-[color:var(--landing-muted)]">{step.text}</p>
                </MagicCard>
              ))}
            </div>
          </section>

          <section id="testimonials" className="mx-auto w-full max-w-7xl px-6 py-14">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--landing-soft)]">{t.testimonial.label}</p>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <MagicCard className="rounded-3xl border border-[color:var(--landing-border)] bg-[color:var(--landing-elevated)] p-6">
                <p className="text-2xl font-semibold leading-relaxed">&ldquo;{t.testimonial.quote}&rdquo;</p>
                <p className="mt-4 text-sm text-[color:var(--landing-muted)]">{t.testimonial.author}</p>
              </MagicCard>
              <MagicCard className="rounded-3xl border border-[color:var(--landing-border)] bg-[color:var(--landing-surface)] p-6">
                <h3 className="text-lg font-semibold">{t.testimonial.sideTitle}</h3>
                <p className="mt-3 text-sm text-[color:var(--landing-muted)]">{t.testimonial.sideText}</p>
                <Link
                  href="/auth/register"
                  className="mt-6 inline-flex items-center justify-center rounded-full border border-[color:var(--landing-border)] px-5 py-2 text-sm font-semibold text-[color:var(--landing-muted)]"
                >
                  {t.testimonial.cta}
                </Link>
              </MagicCard>
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-10">
            <MagicCard className="rounded-[32px] border border-[color:var(--landing-border)] bg-[color:var(--landing-surface)] p-10 text-center shadow-xl">
              <h2 className="text-3xl font-semibold">{t.final.title}</h2>
              <p className="mt-4 text-sm text-[color:var(--landing-muted)]">{t.final.text}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/auth/register"
                  className="rounded-full bg-[color:var(--landing-accent)] px-6 py-3 text-sm font-semibold text-white"
                >
                  {t.final.ctaPrimary}
                </Link>
                <Link
                  href="/auth/login"
                  className="rounded-full border border-[color:var(--landing-border)] px-6 py-3 text-sm font-semibold text-[color:var(--landing-muted)]"
                >
                  {t.final.ctaSecondary}
                </Link>
              </div>
            </MagicCard>
          </section>
        </main>
      </div>

      <footer className="border-t border-[color:var(--landing-border)] bg-[color:var(--landing-surface)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-[color:var(--landing-muted)] md:flex-row md:items-center md:justify-between">
          <p>{t.footer.rights}</p>
          <div className="flex flex-wrap gap-4">
            <a href="#benefits" className="hover:text-[color:var(--landing-ink)]">{t.footer.benefits}</a>
            <a href="#process" className="hover:text-[color:var(--landing-ink)]">{t.footer.process}</a>
            <Link href="/auth/login" className="hover:text-[color:var(--landing-ink)]">{t.footer.login}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
