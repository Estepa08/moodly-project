// Вертикальная (9:16) карточка стрика для Instagram/TikTok Stories (Сессия 9,
// three-personas-design-gaps.md). Картинка рендерится на бэкенде тем же
// пайплайном, что и обычная OG-карточка (services/og-card.ts), только с
// query-параметром format=story — см. backend/src/routes/share.ts.
//
// В отличие от существующего Web Share MVP в StreakMilestoneMoment.tsx и
// InviteFriendCard.tsx (там `navigator.share({ text, url })` — просто
// ссылка), сюда нужно передать саму картинку файлом, чтобы её можно было
// сохранить прямо в Stories одним действием, а не переходить по ссылке.
// Web Share API поддерживает шеринг файлов через `files` в объекте, если
// `navigator.canShare({ files })` возвращает true (iOS Safari, Android
// Chrome — да; десктоп — как правило нет, там срабатывает fallback).
export async function shareStoryCard(
  days: number,
  petType: string,
): Promise<'shared' | 'downloaded' | 'failed'> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mymoodly.ru';
  const imageUrl = `${origin}/api/share/streak/card.png?days=${days}&pet=${encodeURIComponent(petType)}&format=story`;

  let blob: Blob;
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`card.png ${res.status}`);
    blob = await res.blob();
  } catch {
    return 'failed';
  }

  const file = new File([blob], 'moodly-streak-story.png', { type: 'image/png' });
  const shareText = `${days} 🔥 mymoodly.ru`;

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] }) &&
    navigator.share
  ) {
    try {
      await navigator.share({ files: [file], text: shareText });
      return 'shared';
    } catch {
      // Пользователь отменил шеринг или платформа отказала — падаем на
      // сохранение файла ниже, а не молчим.
    }
  }

  // Фоллбэк для десктопа/браузеров без поддержки files в Web Share API:
  // сохраняем PNG на устройство, чтобы пользователь мог сам загрузить его в
  // сторис.
  try {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'moodly-streak-story.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
