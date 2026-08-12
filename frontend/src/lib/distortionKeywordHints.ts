import { DistortionKey } from './distortionsQuiz';

const KEYWORD_MAP: Record<DistortionKey, string[]> = {
  [DistortionKey.AllOrNothing]: [
    'always fail',
    'total failure',
    'ruined everything',
    'complete disaster',
    'полный провал',
    'всё испортил',
    'сплошная катастрофа',
    'всё безнадёжно',
  ],
  [DistortionKey.Overgeneralization]: [
    'always',
    'never',
    'every time',
    'everyone',
    'nobody',
    'всегда',
    'никогда',
    'каждый раз',
    'вечно',
    'никто',
    'постоянно',
  ],
  [DistortionKey.MentalFilter]: [
    'only thing',
    "can't stop thinking",
    'one bad',
    'just focus on',
    'только одно',
    'только плохое',
    'не могу забыть',
    'одна проблема',
  ],
  [DistortionKey.DiscountingPositive]: [
    "doesn't count",
    "wasn't real",
    'just luck',
    'anyone could',
    'не считается',
    'просто повезло',
    'это не заслуга',
    'любой бы смог',
  ],
  [DistortionKey.JumpingToConclusions]: [
    'they think',
    'must hate',
    'going to fail',
    'knows i',
    'думают',
    'ненавидят',
    'обязательно провалю',
    'уверен что',
  ],
  [DistortionKey.Magnification]: [
    'ruin',
    'disaster',
    'terrible',
    'catastrophe',
    'the end of',
    'катастрофа',
    'ужасно',
    'кошмар',
    'конец света',
    'непереживу',
  ],
  [DistortionKey.EmotionalReasoning]: [
    'i feel like',
    'must be true because i feel',
    'feels like i am',
    'чувствую значит',
    'раз так чувствую',
    'значит так и есть',
  ],
  [DistortionKey.ShouldStatements]: [
    'should have',
    'must be',
    'have to be',
    'ought to',
    'должен',
    'обязан',
    'нужно',
    'надо',
    'следовало бы',
  ],
  [DistortionKey.Labeling]: [
    "i'm such a",
    'i am a failure',
    "i'm stupid",
    "i'm a loser",
    'я неудачник',
    'я глупый',
    'я никчёмный',
    'я ужасный',
  ],
  [DistortionKey.Personalization]: [
    'my fault',
    'because of me',
    'i caused',
    "i'm to blame",
    'моя вина',
    'из-за меня',
    'я виноват',
    'это я',
  ],
};

export function suggestDistortion(text: string): DistortionKey | null {
  const lower = text.toLowerCase();
  for (const [key, phrases] of Object.entries(KEYWORD_MAP) as [DistortionKey, string[]][]) {
    if (phrases.some((phrase) => lower.includes(phrase))) {
      return key;
    }
  }
  return null;
}
