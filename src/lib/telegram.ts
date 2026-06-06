/**
 * Telegram WebApp SDK helpers.
 * Always access via these helpers — never access window.Telegram directly
 * throughout the app so we can handle the non-Telegram (browser) fallback.
 */

export const tg = (): TelegramWebApp | null => {
  return window.Telegram?.WebApp ?? null;
};

/** Call once at app startup */
export const initTelegram = () => {
  const webapp = tg();
  if (!webapp) return;
  webapp.ready();
  webapp.expand();
};

/** Current color scheme */
export const getColorScheme = (): 'light' | 'dark' => {
  return tg()?.colorScheme ?? 'light';
};

/** Current Telegram user from initData */
export const getTelegramUser = () => {
  return tg()?.initDataUnsafe?.user ?? null;
};

/** Raw initData string for server-side verification */
export const getInitData = (): string => {
  return tg()?.initData ?? '';
};

// ─── Main Button ─────────────────────────────────────────────────────────────

export const showMainButton = (text: string, onClick: () => void) => {
  const btn = tg()?.MainButton;
  if (!btn) return;
  btn.setText(text).show().enable().onClick(onClick);
};

export const hideMainButton = (onClick?: () => void) => {
  const btn = tg()?.MainButton;
  if (!btn) return;
  if (onClick) btn.offClick(onClick);
  btn.hide();
};

export const setMainButtonLoading = (loading: boolean) => {
  const btn = tg()?.MainButton;
  if (!btn) return;
  loading ? btn.showProgress(false).disable() : btn.hideProgress().enable();
};

// ─── Back Button ─────────────────────────────────────────────────────────────

export const showBackButton = (onClick: () => void) => {
  const btn = tg()?.BackButton;
  if (!btn) return;
  btn.onClick(onClick).show();
};

export const hideBackButton = (onClick?: () => void) => {
  const btn = tg()?.BackButton;
  if (!btn) return;
  if (onClick) btn.offClick(onClick);
  btn.hide();
};

// ─── Haptics ─────────────────────────────────────────────────────────────────

export const haptic = {
  light: () => tg()?.HapticFeedback.impactOccurred('light'),
  medium: () => tg()?.HapticFeedback.impactOccurred('medium'),
  success: () => tg()?.HapticFeedback.notificationOccurred('success'),
  error: () => tg()?.HapticFeedback.notificationOccurred('error'),
  selection: () => tg()?.HapticFeedback.selectionChanged(),
};

// ─── Cloud Storage ────────────────────────────────────────────────────────────

export const cloudStorage = {
  set: (key: string, value: string): Promise<boolean> =>
    new Promise((resolve) => {
      tg()?.CloudStorage.setItem(key, value, (err, stored) => resolve(!err && stored));
    }),

  get: (key: string): Promise<string | null> =>
    new Promise((resolve) => {
      tg()?.CloudStorage.getItem(key, (err, value) => resolve(err ? null : value));
    }),

  remove: (key: string): Promise<boolean> =>
    new Promise((resolve) => {
      tg()?.CloudStorage.removeItem(key, (err, removed) => resolve(!err && removed));
    }),
};
