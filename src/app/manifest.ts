import { type MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SCU Calculator — Microsoft Security Copilot pricing",
    short_name: "SCU Calculator",
    description:
      "Free Microsoft Security Copilot SCU pricing calculator built on Microsoft-published formulas.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1c22",
    theme_color: "#1a1c22",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
