import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { ExternalLink } from "lucide-react";

export default async function ResourcesPage() {
  await requireAuth();

  const resources = await db.careerResource.findMany({
    where: { isPublished: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  const grouped = resources.reduce<
    Record<string, typeof resources>
  >((acc, resource) => {
    if (!acc[resource.category]) acc[resource.category] = [];
    acc[resource.category].push(resource);
    return acc;
  }, {});

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-bold text-stone-900 md:text-3xl">Career resources</h1>
      <p className="mt-1 text-sm text-stone-600 md:mt-2 md:text-base">
        Explore career paths and job search skills to support your placement
        journey.
      </p>

      <div className="mt-6 space-y-8 md:space-y-10">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-800 md:mb-4 md:text-base">
              {category}
            </h2>
            <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
              {items.map((resource) => (
                <Card key={resource.id}>
                  <CardTitle>{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                  {resource.content && (
                    <p className="mt-3 text-sm leading-relaxed text-stone-700">
                      {resource.content}
                    </p>
                  )}
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-800 hover:underline"
                    >
                      Learn more
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
