import { MetadataRoute } from "next";
import { env } from "@/lib/env";
import * as productsApi from "@/lib/api/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXTAUTH_URL || "https://baefikra.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const conn = await productsApi.listProducts({ first: 200, status: "published" });
    productPages = conn.edges.map(({ node }) => ({
      url: `${baseUrl}/products/${node.slug}`,
      lastModified: new Date(node.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Error generating sitemap:", error);
  }

  return [...staticPages, ...productPages];
}
