// Классический режим (docs/plans/three-personas-design-gaps.md, Сессия 1)
// должен гасить игровые тосты/анимации (celebrateReward и т.п.), которые
// срабатывают из хуков вроде useCompleteExercise/useRewardPractice — эти хуки
// вызываются из практик (дыхание, дневник мыслей и т.д.), доступных в обоих
// режимах. celebration.tsx — не React-компонент и не может звать хуки
// напрямую, поэтому текущее значение режима зеркалится сюда через
// useInterfaceMode() (см. useInterfaceMode.ts) — тот хук уже смонтирован почти
// везде в защищённой части приложения (Sidebar/BottomNav и т.д.).
let classicMode = false;

export function isClassicMode(): boolean {
  return classicMode;
}

export function setClassicMode(value: boolean) {
  classicMode = value;
}
