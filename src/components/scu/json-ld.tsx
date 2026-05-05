interface JsonLdProps {
  id: string;
  data: unknown;
}

const escape = (raw: string): string =>
  raw
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

export const JsonLd = ({ id, data }: JsonLdProps) => {
  const serialized = escape(JSON.stringify(data));
  return (
    <script
      id={id}
      type="application/ld+json"
      suppressHydrationWarning
    >
      {serialized}
    </script>
  );
};
