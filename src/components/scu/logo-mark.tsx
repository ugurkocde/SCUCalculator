interface LogoMarkProps {
  size?: number;
  className?: string;
  title?: string;
}

export const LogoMark = ({ size = 28, className, title }: LogoMarkProps) => {
  const labelled = Boolean(title);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
    >
      {labelled ? <title>{title}</title> : null}
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="6.5"
        ry="6.5"
        fill="var(--color-bg-raised)"
        stroke="var(--color-accent)"
        strokeOpacity="0.45"
      />
      <rect
        x="7"
        y="8"
        width="8"
        height="4"
        rx="2"
        fill="var(--color-accent-fg)"
        opacity="0.35"
      />
      <rect
        x="7"
        y="14"
        width="12"
        height="4"
        rx="2"
        fill="var(--color-accent-fg)"
        opacity="0.65"
      />
      <rect
        x="7"
        y="20"
        width="18"
        height="4"
        rx="2"
        fill="var(--color-accent-fg)"
        opacity="1"
      />
    </svg>
  );
};
