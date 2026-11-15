import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const supportedLocales = ["en", "te", "kn", "hi"] as const;
type Locale = (typeof supportedLocales)[number];
type Dictionary = { [key: string]: string | Dictionary };

function withEnglishFallback(
  english: Dictionary,
  translated: Dictionary
): Dictionary {
  const result: Dictionary = { ...english };
  for (const [key, value] of Object.entries(translated)) {
    const englishValue = english[key];
    result[key] =
      value && typeof value === "object" && !Array.isArray(value)
        ? withEnglishFallback(
            englishValue && typeof englishValue === "object"
              ? englishValue
              : {},
            value as Dictionary
          )
        : value;
  }
  return result;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: Locale = supportedLocales.includes(savedLocale as Locale)
    ? (savedLocale as Locale)
    : "en";

  const [englishMessages, selectedMessages] = await Promise.all([
    import("../../messages/en.json"),
    locale === "en"
      ? import("../../messages/en.json")
      : import(`../../messages/${locale}.json`),
  ]);

  return {
    locale,
    messages: withEnglishFallback(
      englishMessages.default as Dictionary,
      selectedMessages.default as Dictionary
    ),
  };
});
