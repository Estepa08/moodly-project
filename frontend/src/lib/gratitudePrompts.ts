export const GRATITUDE_PROMPT_CATEGORIES = ["person", "moment", "body", "anything"] as const;

export type GratitudePromptCategory = (typeof GRATITUDE_PROMPT_CATEGORIES)[number];
