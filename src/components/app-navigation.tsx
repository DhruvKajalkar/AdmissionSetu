"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdmissionSetuMark } from "./admission-setu-mark";
import { usePreferenceShortlist } from "./preference-shortlist";

const navigation = [
  { label: "Overview", shortLabel: "Overview", href: "/dashboard", index: "01" },
  { label: "Explore Colleges", shortLabel: "Explore", href: "/explore", index: "02" },
  { label: "My Preferences", shortLabel: "Preferences", href: "/preferences", index: "03" },
  { label: "My Admission", shortLabel: "Admission", href: "/admission", index: "04" },
  { label: "Live Vacancies", shortLabel: "Vacancies", href: "/vacancies", index: "05" },
  { label: "Spot Rounds", shortLabel: "Spot Rounds", href: "/spot-rounds", index: "06" },
  { label: "Operations", shortLabel: "Operations", href: "/operations", index: "07" },
] as const;

function isRouteActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export function AppNavigation() {
  const pathname = usePathname();
  const { count } = usePreferenceShortlist();

  return (
    <>
      <aside className="app-sidebar" aria-label="Primary navigation">
        <Link className="brand sidebar-brand" href="/dashboard" aria-label="AdmissionSetu dashboard">
          <AdmissionSetuMark className="brand-mark" />
          <span>AdmissionSetu</span>
        </Link>

        <nav className="sidebar-links">
          {navigation.map((item) => {
            const active = isRouteActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                className={active ? "sidebar-link active" : "sidebar-link"}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-index" aria-hidden="true">{item.index}</span>
                <span>{item.href === "/preferences" ? `${item.label} · ${count}` : item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-profile">
          <span className="profile-avatar" aria-hidden="true">AD</span>
          <span>
            <strong>Aarya Deshmukh</strong>
            <small>Synthetic demo student</small>
          </span>
        </div>
      </aside>

      <header className="mobile-app-header">
        <Link className="brand" href="/dashboard" aria-label="AdmissionSetu dashboard">
          <AdmissionSetuMark className="brand-mark" />
          <span>AdmissionSetu</span>
        </Link>
        <span className="profile-avatar" aria-label="Aarya Deshmukh">AD</span>
      </header>
      <nav className="mobile-nav" aria-label="Primary navigation">
        {navigation.map((item) => {
          const active = isRouteActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              className={active ? "mobile-nav-link active" : "mobile-nav-link"}
              href={item.href}
              aria-current={active ? "page" : undefined}
            >
              {item.href === "/preferences" ? `${item.shortLabel} · ${count}` : item.shortLabel}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function AppNavigationFallback() {
  return <div className="navigation-fallback" aria-hidden="true" />;
}
