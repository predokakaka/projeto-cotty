import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'cortty-theme-preference';

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly preferenceSignal = signal<ThemePreference>(this.loadPreference());
  private readonly darkSignal = signal(false);
  private mediaQuery: MediaQueryList | null = null;

  readonly preference = this.preferenceSignal.asReadonly();
  readonly isDark = this.darkSignal.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', () => {
        if (this.preferenceSignal() === 'system') {
          this.applyTheme();
        }
      });
    }

    this.applyTheme();
  }

  setPreference(preference: ThemePreference): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    }

    this.preferenceSignal.set(preference);
    this.applyTheme();
  }

  toggle(): void {
    this.setPreference(this.darkSignal() ? 'light' : 'dark');
  }

  private loadPreference(): ThemePreference {
    if (!isPlatformBrowser(this.platformId)) {
      return 'system';
    }

    const storedPreference = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(storedPreference) ? storedPreference : 'system';
  }

  private applyTheme(): void {
    const isDark =
      this.preferenceSignal() === 'dark' ||
      (this.preferenceSignal() === 'system' && this.mediaQuery?.matches === true);
    this.darkSignal.set(isDark);

    if (isPlatformBrowser(this.platformId)) {
      this.document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  }
}
