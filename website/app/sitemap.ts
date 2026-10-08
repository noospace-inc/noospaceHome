import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://noospace.in/",
      lastModified: new Date(),
    },
  ];
}
