import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StreetO Business",
    short_name: "StreetO",
    description: "Manage StreetO orders and your business.",
    start_url: "/business-admin",
    display: "standalone",
    background_color: "#fff8f2",
    theme_color: "#f97316",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
