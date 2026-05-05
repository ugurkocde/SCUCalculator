import Link from "next/link";

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Calculator" },
  { href: "/agents", label: "Agents" },
  { href: "/methodology", label: "Methodology" },
  { href: "/faq", label: "FAQ" },
];

const GITHUB_URL = "https://github.com/ugurkocde/scucalculator";

export const SiteHeader = () => {
  return (
    <header className="border-b border-[color:var(--color-hairline)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3.5">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-semibold text-[color:var(--color-text)] hover:text-[color:var(--color-accent-fg)]"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 font-mono text-[10px] font-bold tracking-tight text-[color:var(--color-accent-fg)]">
            SCU
          </span>
          <span>SCU Calculator</span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 text-sm text-[color:var(--color-text-muted)] md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-[color:var(--color-accent-fg)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener"
            aria-label="View source on GitHub"
            className="hidden items-center justify-center rounded-md p-1.5 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-accent-fg)] md:inline-flex"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="h-4 w-4"
              fill="currentColor"
            >
              <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.39v-1.36c-2.22.49-2.7-1.07-2.7-1.07-.36-.92-.89-1.16-.89-1.16-.73-.5.06-.49.06-.49.8.06 1.22.83 1.22.83.72 1.23 1.88.87 2.34.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.96 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.28.82 2.15 0 3.08-1.87 3.76-3.65 3.96.29.25.55.74.55 1.5v2.22c0 .22.15.46.55.39A8 8 0 0 0 8 0Z" />
            </svg>
          </a>

          <details className="relative md:hidden [&_summary::-webkit-details-marker]:hidden">
            <summary
              aria-label="Open navigation menu"
              className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[color:var(--color-hairline)] p-1.5 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-accent-fg)]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </summary>
            <div
              className="absolute right-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-lg border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] shadow-[0_24px_60px_-24px_oklch(0_0_0_/_0.6)]"
              role="menu"
            >
              <nav aria-label="Primary mobile" className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    className="border-b border-[color:var(--color-hairline)] px-4 py-3 text-sm text-[color:var(--color-text-muted)] last:border-b-0 hover:bg-white/[0.02] hover:text-[color:var(--color-accent-fg)]"
                  >
                    {link.label}
                  </Link>
                ))}
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener"
                  role="menuitem"
                  className="border-t border-[color:var(--color-hairline)] px-4 py-3 text-sm text-[color:var(--color-text-muted)] hover:bg-white/[0.02] hover:text-[color:var(--color-accent-fg)]"
                >
                  GitHub
                </a>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
};
