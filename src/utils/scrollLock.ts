/**
 * Centralized scroll lock manager.
 * Prevents the "double lock" bug where multiple modals/bottom-sheets
 * each set body.style.overflow = 'hidden' independently, and the first
 * one to close accidentally unlocks scrolling while another is still open.
 *
 * Uses a reference counter: lock increments, unlock decrements.
 * Body scroll is only restored when the counter reaches 0.
 */

let lockCount = 0;
let savedScrollY = 0;

export function lockScroll() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';
  }
  lockCount++;
}

export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    document.body.style.width = '';
    window.scrollTo(0, savedScrollY);
  }
}

/** Force-reset everything (safety valve, e.g. on route change). */
export function forceUnlockScroll() {
  const scrollY = savedScrollY;
  lockCount = 0;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.overflow = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollY);
}
