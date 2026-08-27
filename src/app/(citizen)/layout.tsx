import { Suspense } from "react";
import type { ReactNode } from "react";
import { AppNavigation, AppNavigationFallback } from "@/components";

export default function CitizenLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Suspense fallback={<AppNavigationFallback />}>
        <AppNavigation />
      </Suspense>
      <div className="app-main">
        <div className="prototype-banner" role="status">
          Hackathon prototype · All candidate, cutoff, vacancy, and seat data shown here is synthetic.
        </div>
        <main className="page-container">{children}</main>
      </div>
    </div>
  );
}
