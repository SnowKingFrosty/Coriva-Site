import { initProfilePage } from './profile-page.js';
import { createSocialAnchor, getProfileSocialUrls } from './social-links.js';
const base = 'https://firestore.googleapis.com/v1/projects/aethel-30d56/databases/(default)/documents';
const value = field => {
  if ('stringValue' in field) return field.stringValue;
  if ('booleanValue' in field) return field.booleanValue;
  if ('integerValue' in field) return Number(field.integerValue);
  if ('doubleValue' in field) return field.doubleValue;
  if ('arrayValue' in field) return (field.arrayValue.values || []).map(value);
  if ('mapValue' in field) return fields(field.mapValue.fields || {});
  return null;
};
const fields = input => Object.fromEntries(Object.entries(input).map(([key, item]) => [key, value(item)]));
async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { ...options, credentials: 'omit', cache: 'no-store', signal: controller.signal });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(response.status === 403 ? 'Public profile access is unavailable.' : 'Please check your connection.');
    return await response.json();
  } finally { clearTimeout(timer); }
}
export function startGuestProfile(profileId) {
  let stores = [];
  const navigate = params => {
    const url = new URL(window.location.href); url.search = ''; url.hash = '';
    for (const [key, item] of Object.entries(params)) url.searchParams.set(key, item);
    window.location.assign(url.href);
  };
  const controller = initProfilePage({
    user: () => null, profile: () => null, stores: () => stores,
    socialUrls: getProfileSocialUrls, socialAnchor: createSocialAnchor,
    signIn: () => navigate({}), editAccount: () => navigate({}), createStore: () => navigate({}),
    navigateHome: () => navigate({}), openStore: store => navigate({store: store.id}),
    closeWelcome: () => {
      document.querySelectorAll('.modal-overlay').forEach(modal => { modal.classList.add('hidden'); modal.setAttribute('aria-hidden', 'true'); });
    },
    subscribe: (uid, onValue, onError) => {
      let cancelled = false;
      if (!uid || uid.length > 128 || /[\/]/.test(uid)) { queueMicrotask(() => onValue(null)); return () => { cancelled = true; }; }
      Promise.all([
        request(base + '/publicProfiles/' + encodeURIComponent(uid)),
        request(base + ':runQuery', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({structuredQuery: {
          from: [{collectionId: 'stores'}], where: {fieldFilter: {field: {fieldPath: 'ownerUid'}, op: 'EQUAL', value: {stringValue: uid}}}, limit: 100
        }})})
      ]).then(([profile, rows]) => {
        if (cancelled) return;
        stores = (rows || []).filter(row => row.document).map(row => ({id: row.document.name.split('/').pop(), ...fields(row.document.fields || {})}));
        let publicProfile = profile ? fields(profile.fields || {}) : null;
        // Existing creators can still show the public storefront information they already published.
        const first = stores.find(store => !store.draft);
        if (!publicProfile && first) publicProfile = {uid, username: first.creatorUsername || first.handle || 'Coriva creator', profilePicture: first.creatorPhotoURL || '', socialLinks: [], accountType: 'creator'};
        onValue(publicProfile); controller.refresh();
      }).catch(error => { if (!cancelled) onError(error); });
      return () => { cancelled = true; };
    }
  });
  document.title = 'Coriva profile';
  window.corivaReady = true; window.dispatchEvent(new Event('coriva-ready'));
}
