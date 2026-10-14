const base = 'https://firestore.googleapis.com/v1/projects/aethel-30d56/databases/(default)/documents/publicProfiles';
export function publicProfileURL(uid) {
  const url = new URL(window.location.href); url.search = ''; url.hash = '';
  url.searchParams.set('profile', uid); return url.href;
}
const normalize = value => String(value || '').trim().replace(/^@/, '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const decode = value => {
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode);
  return null;
};
export function initProfileDirectory({panel, grid, status, searchStatus, stores}) {
  let profiles = [], loading = false, loaded = false, error = '', term = '', revision = 0;
  const refreshButton = panel.querySelector('[data-refresh-profiles]');
  const node = (tag, cls, text = '') => {const e = document.createElement(tag); e.className = cls; e.textContent = text; return e;};
  function render() {
    const query = normalize(term);
    const matches = profiles.filter(profile => [profile.username, profile.role, profile.focus, profile.bio].some(value => normalize(value).includes(query)))
      .sort((a,b) => String(a.username || '').localeCompare(String(b.username || '')));
    grid.replaceChildren();
    for (const profile of matches) {
      const username = profile.username || 'Coriva member';
      const card = node('a', 'profile-directory-card'); card.href = publicProfileURL(profile.uid);
      card.setAttribute('aria-label', 'View ' + username + ' profile');
      const avatar = node('span', 'profile-directory-avatar', username.charAt(0).toUpperCase());
      if (profile.profilePicture) {
        const img = document.createElement('img'); img.src = profile.profilePicture; img.alt = ''; img.loading = 'lazy';
        img.addEventListener('error', () => {avatar.textContent = username.charAt(0).toUpperCase();}, {once:true});
        avatar.replaceChildren(img);
      }
      const copy = node('span', 'profile-directory-copy');
      copy.append(node('strong', '', username), node('span', 'store-handle', '@' + username.replace(/^@/, '')));
      const detail = [profile.role, profile.focus].filter(Boolean).join(' · ');
      if (detail) copy.append(node('span', 'helper-text', detail));
      const count = stores().filter(store => store.ownerUid === profile.uid && !store.draft).length;
      if (count) copy.append(node('span', 'profile-directory-store-count', count + (count === 1 ? ' storefront' : ' storefronts')));
      copy.append(node('span', 'public-profile-store-link', 'View profile →'));
      card.append(avatar, copy); grid.append(card);
    }
    const count = matches.length + (matches.length === 1 ? ' profile' : ' profiles');
    status.textContent = error || (loading ? 'Loading profiles…' + (profiles.length ? ' ' + count + ' found so far.' : '') : count + ' found');
    if (panel.isConnected) searchStatus.textContent = status.textContent;
    refreshButton.disabled = loading;
    if (!matches.length && !loading && !error) grid.append(node('p', 'empty-state', query ? 'No profiles match your search. Try another username or specialty.' : 'No public profiles yet.'));
  }
  async function load() {
    if (loading) return;
    loading = true; error = ''; profiles = []; loaded = false; const requestId = ++revision; render();
    try {
      let token = '';
      const seen = new Set();
      do {
        const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 12000);
        let response;
        try {
          const url = new URL(base); url.searchParams.set('pageSize', '100'); if (token) url.searchParams.set('pageToken', token);
          response = await fetch(url.href, {credentials:'omit',cache:'no-store',signal:controller.signal});
          if (!response.ok) throw new Error('Unable to load public profiles. Select Refresh to try again.');
          const page = await response.json();
          for (const doc of page.documents || []) {
            const uid = doc.name.split('/').pop();
            if (!seen.has(uid)) {seen.add(uid); profiles.push({...Object.fromEntries(Object.entries(doc.fields || {}).map(([key, value]) => [key, decode(value)])), uid});}
          }
          token = page.nextPageToken || ''; render();
        } finally {clearTimeout(timer);}
      } while (token && requestId === revision);
      loaded = true;
    } catch (failure) {error = failure.name === 'AbortError' ? 'Loading timed out. Select Refresh to try again.' : failure.message;}
    finally {loading = false; render();}
  }
  refreshButton.addEventListener('click', load);
  return {show(query = '') {term = query; render(); if (!loaded && !loading && !error) load();}, refresh: render};
}
