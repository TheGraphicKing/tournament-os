import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tournament OS",
    short_name: "Tournament OS",
    description: "Run tournaments end to end — registrations, payments, comms, match day.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF8",
    theme_color: "#F16C1D",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
