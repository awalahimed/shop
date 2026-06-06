/** Tiny classnames helper — avoids installing clsx for just this */
export const cn = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(' ');
