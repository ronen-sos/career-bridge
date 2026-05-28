import Link from "next/link";
import { ArrowRight, Briefcase, ClipboardCheck, MapPin } from "lucide-react";

import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-emerald-50 to-stone-50">
      <div className="mx-auto w-full max-w-lg md:max-w-5xl lg:max-w-6xl">
        <header className="px-6 py-8 md:px-10 md:py-12 lg:py-16">
          <div className="md:max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">
              Bridge to Thrive
            </p>
            <h1 className="mt-2 text-4xl font-bold leading-tight text-stone-900 md:text-5xl lg:text-6xl">
              Career Bridge
            </h1>
            <p className="mt-3 max-w-md text-lg text-stone-600 md:mt-4 md:max-w-xl md:text-xl">
              Accountability and resources for your job search journey in St. Paul.
            </p>
          </div>
        </header>

        <main className="flex-1 px-6 pb-12 md:px-10 md:pb-16">
          <div className="space-y-4 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
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
          </div>

          <div className="mx-auto mt-8 max-w-md md:mt-10 md:max-w-sm">
            <Link href="/login" className="block">
              <Button size="lg" className="w-full gap-2">
                Sign in to get started
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Button>
            </Link>

            <p className="mt-4 text-center text-xs text-stone-500 md:text-sm">
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
    <div className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:flex-col md:p-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 md:h-12 md:w-12">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <h2 className="font-semibold text-stone-900 md:text-lg">{title}</h2>
        <p className="mt-1 text-sm text-stone-600 md:mt-2">{description}</p>
      </div>
    </div>
  );
}
