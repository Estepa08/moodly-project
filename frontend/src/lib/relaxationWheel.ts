import type { LucideIcon } from 'lucide-react';
import { Wind, Coffee, Gift } from 'lucide-react';

export enum RelaxationWheelCategory {
  QuickRegulation = 'quickRegulation',
  SoftReset = 'softReset',
  SelfCare = 'selfCare',
}

export const RELAXATION_WHEEL_CATEGORY_ORDER: RelaxationWheelCategory[] = [
  RelaxationWheelCategory.QuickRegulation,
  RelaxationWheelCategory.SoftReset,
  RelaxationWheelCategory.SelfCare,
];

export const RELAXATION_WHEEL_CATEGORY_ICONS: Record<RelaxationWheelCategory, LucideIcon> = {
  [RelaxationWheelCategory.QuickRegulation]: Wind,
  [RelaxationWheelCategory.SoftReset]: Coffee,
  [RelaxationWheelCategory.SelfCare]: Gift,
};

export interface RelaxationWheelItemDefinition {
  key: string;
  category: RelaxationWheelCategory;
  titleKey: string;
  descriptionKey: string;
}

function def(category: RelaxationWheelCategory, key: string): RelaxationWheelItemDefinition {
  return {
    key,
    category,
    titleKey: `relaxationWheel.items.${key}.title`,
    descriptionKey: `relaxationWheel.items.${key}.description`,
  };
}

export const RELAXATION_WHEEL_CATALOG: RelaxationWheelItemDefinition[] = [
  def(RelaxationWheelCategory.QuickRegulation, 'breathing478'),
  def(RelaxationWheelCategory.QuickRegulation, 'grounding54321'),
  def(RelaxationWheelCategory.QuickRegulation, 'stretch'),
  def(RelaxationWheelCategory.QuickRegulation, 'coldWater'),
  def(RelaxationWheelCategory.QuickRegulation, 'boxBreathing'),
  def(RelaxationWheelCategory.SoftReset, 'readBook'),
  def(RelaxationWheelCategory.SoftReset, 'listenMusic'),
  def(RelaxationWheelCategory.SoftReset, 'walk'),
  def(RelaxationWheelCategory.SoftReset, 'drawDaydream'),
  def(RelaxationWheelCategory.SoftReset, 'warmShower'),
  def(RelaxationWheelCategory.SoftReset, 'slowTea'),
  def(RelaxationWheelCategory.SoftReset, 'freeJournal'),
  def(RelaxationWheelCategory.SelfCare, 'tastyFood'),
  def(RelaxationWheelCategory.SelfCare, 'favoriteMovie'),
  def(RelaxationWheelCategory.SelfCare, 'callSomeone'),
  def(RelaxationWheelCategory.SelfCare, 'cozyHome'),
];

export const DEFAULT_WHEEL_ITEM_KEYS: string[] = RELAXATION_WHEEL_CATALOG.map((item) => item.key);

export function findRelaxationWheelCatalogItem(
  key: string,
): RelaxationWheelItemDefinition | undefined {
  return RELAXATION_WHEEL_CATALOG.find((item) => item.key === key);
}
