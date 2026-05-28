import { MobileNav } from "@/components/MobileNav";
import { Providers } from "@/components/Providers";
import { requireAuth } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <Providers session={session}>
      <div className="mx-auto min-h-full max-w-lg bg-stone-50 pb-24">
        {children}
        {session?.user && <MobileNav role={session.user.role} />}
      </div>
    </Providers>
  );
}
