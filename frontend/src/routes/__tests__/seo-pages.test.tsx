import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { renderWithProviders, screen } from '../../test/test-utils';
import MoodDiaryPage from '../seo/mood-diary';
import AnxietyTestPage from '../seo/anxiety-test';
import ThinkingHabitsTestPage from '../seo/thinking-habits-test';
import SleepHygieneGuidePage from '../seo/sleep-hygiene-guide';
import AnxietySelfHelpPage from '../seo/anxiety-self-help';

function clearHead() {
  document.head.querySelectorAll('meta[name="description"]').forEach((el) => el.remove());
  document.head.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove());
  document.title = '';
}

function canonicalHref(): string | null | undefined {
  return document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');
}

describe('MoodDiaryPage', () => {
  beforeEach(clearHead);
  afterEach(clearHead);

  it('renders H1 heading and CTA', () => {
    renderWithProviders(<MoodDiaryPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mood diary');
    expect(screen.getByRole('link', { name: /start journaling free/i })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('sets canonical and title', () => {
    renderWithProviders(<MoodDiaryPage />);
    expect(canonicalHref()).toBe('https://mymoodly.ru/mood-diary');
    expect(document.title).toContain('Mood Diary');
  });
});

describe('AnxietyTestPage', () => {
  beforeEach(clearHead);
  afterEach(clearHead);

  it('renders H1 heading and CTA', () => {
    renderWithProviders(<AnxietyTestPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Anxiety test');
    const ctas = screen.getAllByRole('link', { name: /take the test free/i });
    expect(ctas.length).toBeGreaterThanOrEqual(2);
    expect(ctas[0]).toHaveAttribute('href', '/tests');
  });

  it('sets canonical', () => {
    renderWithProviders(<AnxietyTestPage />);
    expect(canonicalHref()).toBe('https://mymoodly.ru/anxiety-test');
  });
});

describe('ThinkingHabitsTestPage', () => {
  beforeEach(clearHead);
  afterEach(clearHead);

  it('renders H1 and sets canonical', () => {
    renderWithProviders(<ThinkingHabitsTestPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Thinking habits test');
    expect(canonicalHref()).toBe('https://mymoodly.ru/thinking-habits-test');
  });
});

describe('SleepHygieneGuidePage', () => {
  beforeEach(clearHead);
  afterEach(clearHead);

  it('renders H1 and sets canonical', () => {
    renderWithProviders(<SleepHygieneGuidePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sleep hygiene');
    expect(canonicalHref()).toBe('https://mymoodly.ru/sleep-hygiene-guide');
  });
});

describe('AnxietySelfHelpPage', () => {
  beforeEach(clearHead);
  afterEach(clearHead);

  it('renders H1 and sets canonical', () => {
    renderWithProviders(<AnxietySelfHelpPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Anxiety');
    expect(canonicalHref()).toBe('https://mymoodly.ru/anxiety-self-help');
  });
});
