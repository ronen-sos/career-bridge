import { DesktopNav } from "@/components/DesktopNav";
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
      {session?.user && <DesktopNav role={session.user.role} />}
      <div className="min-h-full bg-stone-50 pb-24 md:pl-64 md:pb-8">
        <div className="mx-auto w-full max-w-lg md:max-w-4xl lg:max-w-6xl">
          {children}
        </div>
        {session?.user && <MobileNav role={session.user.role} />}
      </div>
    </Providers>
  );
}
