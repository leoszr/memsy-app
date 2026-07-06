import { Settings } from './types';

export type InitialRoute = 'onboarding' | 'tabs';

export const hasCompletedOnboarding = (settings: Settings): boolean =>
  !!settings.nativeLanguage &&
  parseLearningLanguages(settings.learningLanguages).length > 0;

export function getInitialRoute(settings: Settings): InitialRoute {
  return hasCompletedOnboarding(settings) ? 'tabs' : 'onboarding';
}

export function setActiveLearningLanguage(
  settings: Settings,
  languageCode: string,
): Settings {
  const learning = parseLearningLanguages(settings.learningLanguages);
  if (!settings.nativeLanguage || !learning.includes(languageCode)) return {};
  return {
    activeLearningLanguage: languageCode,
    activeLangFrom: languageCode,
    activeLangTo: settings.nativeLanguage,
  };
}

export function parseLearningLanguages(value?: string): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((v) => typeof v === 'string')
      : [];
  } catch {
    return [];
  }
}
