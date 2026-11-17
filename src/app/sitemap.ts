import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = "https://snapzila.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  const staticPages = [
    "",
    "/opportunities",
    "/govt-jobs",
    "/admissions",
    "/scholarships",
    "/govt-schemes",
    "/news",
    "/articles",
    "/institutions",
    "/helpline",
    "/contact",
    "/exam-calendar",
    "/employment-news",
    "/login",
    "/signup",
  ];

  for (const path of staticPages) {
    entries.push({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: path === "" ? 1 : 0.8,
      alternates: {
        languages: {
          "en-IN": `${BASE_URL}${path}`,
          "hi-IN": `${BASE_URL}/hi-in${path}`,
          "x-default": `${BASE_URL}${path}`,
        },
      },
    });
  }

  // Dynamic event pages
  const { data: events } = await supabase
    .from("events")
    .select("type, slug, updated_at")
    .eq("status", "published")
    .is("deleted_at", null)
    .limit(500);

  for (const event of events ?? []) {
    const path = `/${event.type}/${event.slug}`;
    entries.push({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(event.updated_at),
      changeFrequency: "weekly",
      priority: 0.6,
      alternates: {
        languages: {
          "en-IN": `${BASE_URL}${path}`,
          "hi-IN": `${BASE_URL}/hi-in${path}`,
          "x-default": `${BASE_URL}${path}`,
        },
      },
    });
  }

  // Institution category pages
  const categories = [
    "exams", "courses", "universities", "iits", "nits", "iims",
    "aiims", "iiits", "nifts", "schools", "colleges", "coaching",
    "training-skill-centres", "iti", "fake-universities", "law-universities",
  ];
  for (const cat of categories) {
    const path = `/institutions/${cat}`;
    entries.push({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
      alternates: {
        languages: {
          "en-IN": `${BASE_URL}${path}`,
          "hi-IN": `${BASE_URL}/hi-in${path}`,
        },
      },
    });
  }

  return entries;
}
