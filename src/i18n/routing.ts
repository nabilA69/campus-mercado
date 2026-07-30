import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Spanish is the default (Cuban market); English is available for foreign students.
  locales: ["es", "en"],
  defaultLocale: "es",
});
