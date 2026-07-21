import { useTranslation } from "react-i18next";
import {
  testTitleRu,
  testDescriptionRu,
  questionRu,
  optionRu,
  interpretationRu,
  recommendationRu,
  cdInterpretationTemplates,
  cdRecommendationTemplates,
} from "../i18n/test-content";
import type { TFunction } from "i18next";

export function useTestTranslation() {
  const { i18n, t } = useTranslation();
  const isRu = i18n.language.startsWith("ru");

  function buildCDText(templateKey: string, keys: string[], templates: Record<string, string>, fallback: string): string {
    if (!isRu) return fallback;
    const template = templates[templateKey];
    if (!template) return fallback;
    const names = keys.map((k) => t(`cognitiveDistortions.${k}`));
    return template
      .replace("{{high}}", names.length > 0 ? `${names.join(", ")}. ` : "")
      .replace("{{moderate}}", names.length > 0 ? `${names.join(", ")}. ` : "");
  }

  return {
    tTestTitle: (title: string) => (isRu ? testTitleRu[title] : undefined) ?? title,
    tTestDescription: (description: string) =>
      (isRu ? testDescriptionRu[description] : undefined) ?? description,
    tQuestion: (id: string, fallback: string) =>
      (isRu ? questionRu[id] : undefined) ?? fallback,
    tOption: (id: string, fallback: string) =>
      (isRu ? optionRu[id] : undefined) ?? fallback,
    tInterpretation: (text: string) =>
      (isRu ? interpretationRu[text] : undefined) ?? text,
    tRecommendation: (text: string) =>
      (isRu ? recommendationRu[text] : undefined) ?? text,
    tCDInterpretation: (templateKey: string, highKeys: string[], moderateKeys: string[], fallback: string) =>
      buildCDText(templateKey, [...highKeys, ...moderateKeys], cdInterpretationTemplates, fallback),
    tCDRecommendation: (recommendationKey: string, fallback: string) =>
      isRu && cdRecommendationTemplates[recommendationKey] ? cdRecommendationTemplates[recommendationKey] : fallback,
  };
}
