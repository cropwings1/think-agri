export type Language = "en" | "te" | "kn" | "hi";
export type CategoryId =
  | "agriculture"
  | "dairy"
  | "poultry"
  | "goat"
  | "fishery"
  | "beekeeping"
  | "organic"
  | "farm-machinery";

export const languages = [
  {
    id: "te",
    native: "తెలుగు",
    english: "Telugu",
    mark: "తె",
  },
  {
    id: "en",
    native: "English",
    english: "English",
    mark: "EN",
  },
  {
    id: "kn",
    native: "ಕನ್ನಡ",
    english: "Kannada",
    mark: "ಕ",
  },
  {
    id: "hi",
    native: "हिन्दी",
    english: "Hindi",
    mark: "हि",
  },
] as const;

export const categories = [
  {
    id: "agriculture",
    icon: "🌾",
    color: "sage",
  },
  {
    id: "dairy",
    icon: "🐄",
    color: "butter",
  },
  {
    id: "poultry",
    icon: "🐓",
    color: "peach",
  },
  {
    id: "goat",
    icon: "🐐",
    color: "lilac",
  },
  {
    id: "fishery",
    icon: "🐟",
    color: "blue",
  },
  {
    id: "beekeeping",
    icon: "🐝",
    color: "butter",
  },
  {
    id: "organic",
    icon: "🌱",
    color: "sage",
  },
  {
    id: "farm-machinery",
    icon: "🚜",
    color: "peach",
  },
] as const;

// Add verified WhatsApp invite URLs before launch.
export const communities = [
  {
    id: "agriculture",
    members: "—",
    url: "",
  },
  {
    id: "dairy",
    members: "—",
    url: "",
  },
  {
    id: "poultry",
    members: "—",
    url: "",
  },
  {
    id: "goat",
    members: "—",
    url: "",
  },
  {
    id: "fishery",
    members: "—",
    url: "",
  },
  {
    id: "beekeeping",
    members: "—",
    url: "",
  },
  {
    id: "organic",
    members: "—",
    url: "",
  },
  {
    id: "farm-machinery",
    members: "—",
    url: "",
  },
] as const;
