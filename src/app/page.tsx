import {
  ArrowRight,
  ExternalLink,
  Hash,
  Link2,
  Sparkles,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  // Signed-in visitors skip the marketing copy and land on their dashboard.
  // The proxy doesn't enforce this — `/` is public — so we do it inline.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Hero />
        <Features />
        <CtaStrip />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="border-border/40 border-b">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-1.5">
          <Sparkles className="text-primary h-4 w-4" />
          <span className="text-sm font-semibold tracking-tight">briefly</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/login">
              Try it free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32">
      {/* Soft violet gradient halo behind the headline — pure CSS, no images. */}
      <div
        aria-hidden
        className="bg-primary/20 pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
      />
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-muted-foreground mb-6 font-mono text-[11px] tracking-widest uppercase">
          AI summaries · powered by Claude
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          The shorter way to{" "}
          <span className="text-primary">read the web.</span>
        </h1>
        <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-base sm:text-lg">
          Paste any article URL. Get a 3-sentence TL;DR, 5 key points, and tags
          — in seconds. Your reading list, finally readable.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link href="/login">
              Try briefly
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="gap-2">
            <a
              href="https://github.com/StasKaidash/briefly-ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              View source
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: Link2,
    title: "Paste a URL",
    body: "Drop in any article — blog post, paper, longform essay. We fetch the page and strip away the cruft.",
  },
  {
    icon: Wand2,
    title: "Claude reads it",
    body: "Sonnet 4.6 turns the article into a 3-sentence TL;DR, 5 punchy key points, and reading-time estimate.",
  },
  {
    icon: Hash,
    title: "You file it",
    body: "Edit tags, search by title or #tag, open the original anytime. Your second brain for the web.",
  },
];

function Features() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Three steps. Zero friction.
          </h2>
          <p className="text-muted-foreground mt-3 text-sm">
            briefly does the reading so you can do the thinking.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Link2;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1 transition-shadow hover:ring-foreground/20">
      <div className="bg-primary/10 text-primary mb-4 grid h-10 w-10 place-items-center rounded-lg">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {body}
      </p>
    </div>
  );
}

function CtaStrip() {
  return (
    <section className="px-6 py-20">
      <div className="bg-card ring-foreground/10 mx-auto max-w-3xl rounded-2xl p-10 text-center ring-1">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Ready to read less?
        </h2>
        <p className="text-muted-foreground mt-3 text-sm">
          Sign in with a magic link — no password, no credit card.
        </p>
        <Button asChild size="lg" className="mt-6 gap-2">
          <Link href="/login">
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-border/40 border-t px-6 py-8">
      <div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 text-xs sm:flex-row">
        <p>
          Built by{" "}
          <a
            href="https://github.com/StasKaidash"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Stas Kaidash
          </a>{" "}
          · Next.js + Supabase + Claude
        </p>
        <p className="font-mono">© {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
