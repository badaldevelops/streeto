import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Qtoo",
    short_name: "Qtoo",
    description: "Order food from nearby businesses with Qtoo.",
    start_url: "/",
    display: "standalone",
    scope: "/",
    background_color: "#f7f8f4",
    theme_color: "#f3222b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
