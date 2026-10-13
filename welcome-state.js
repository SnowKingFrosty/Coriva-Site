// Track onboarding locally per browser, without requiring an account.
const key = 'aethelWelcomeSeen';
const cookie = 'corivaWelcomeSeen';
export function hasSeenWelcome() {
  try { if (localStorage.getItem(key) === 'true') return true; } catch {}
  try { return document.cookie.split(';').some(item => item.trim() === cookie + '=1'); } catch { return false; }
}
export function rememberWelcome() {
  try { localStorage.setItem(key, 'true'); } catch {}
  try { document.cookie = cookie + '=1; Max-Age=31536000; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : ''); } catch {}
}
