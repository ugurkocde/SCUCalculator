const AUTHOR_NAME = "Ugur Koc";
const AUTHOR_BIO =
  "This calculator is open source and accepts pull requests.";
const GITHUB_URL = "https://github.com/ugurkocde/scucalculator";
const LINKEDIN_URL = "https://www.linkedin.com/in/ugurkocde/";

export const SiteFooter = () => {
  return (
    <footer className="rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-bg-raised)] p-5 text-sm text-[color:var(--color-text-muted)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-[color:var(--color-text)]">
            <span>
              Built by <span className="font-semibold">{AUTHOR_NAME}</span>.
            </span>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener"
              aria-label={`${AUTHOR_NAME} on LinkedIn`}
              className="inline-flex items-center justify-center rounded p-1 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-accent-fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
              >
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
              </svg>
            </a>
          </p>
          <p className="mt-1 text-[color:var(--color-text-muted)]">{AUTHOR_BIO}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener"
            className="rounded-md border border-[color:var(--color-hairline)] bg-white/[0.02] px-3 py-1.5 font-medium text-[color:var(--color-text-muted)] hover:border-[color:var(--color-accent)]/50 hover:text-[color:var(--color-accent-fg)]"
          >
            View source on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};
