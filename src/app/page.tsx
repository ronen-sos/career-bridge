import Link from "next/link";
import { ArrowRight, Briefcase, ClipboardCheck, MapPin } from "lucide-react";

import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-emerald-50 to-stone-50">
      <header className="px-6 py-8">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">
          Bridge to Thrive
        </p>
        <h1 className="mt-2 text-4xl font-bold leading-tight text-stone-900">
          Career Bridge
        </h1>
        <p className="mt-3 max-w-md text-lg text-stone-600">
          Accountability and resources for your job search journey in St. Paul.
        </p>
      </header>

      <main className="flex-1 px-6 pb-12">
        <div className="mx-auto max-w-md space-y-4">
          <Feature
            icon={ClipboardCheck}
            title="Track your progress"
            description="Log applications, networking, and interviews. Your program manager sees your weekly activity."
          />
          <Feature
            icon={Briefcase}
            title="Explore career paths"
            description="Learn about trades, warehouse, hospitality, and other entry-level opportunities."
          />
          <Feature
            icon={MapPin}
            title="Local job listings"
            description="Curated opportunities in the St. Paul area and Twin Cities metro."
          />

          <Link href="/login" className="block pt-4">
            <Button size="lg" className="w-full gap-2">
              Sign in to get started
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
          </Link>

          <p className="text-center text-xs text-stone-500">
            A program of{" "}
            <a
              href="https://bridgetothrive.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-stone-700"
            >
              Bridge to Thrive
            </a>
            , supporting men in recovery on the path to meaningful careers.
          </p>
        </div>
      </main>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <h2 className="font-semibold text-stone-900">{title}</h2>
        <p className="mt-1 text-sm text-stone-600">{description}</p>
      </div>
    </div>
  );
}
