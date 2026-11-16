import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en-IN", "hi-IN"],
  defaultLocale: "en-IN",
  localePrefix: "as-needed",
  localeDetection: false,
});
