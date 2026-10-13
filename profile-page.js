// Public profile pages contain only explicitly public presentation fields.
export function initProfilePage(api) {
  const el = id => document.getElementById(id);
  const page = el('publicProfilePage');
  let uid = null, viewed = null, unsubscribe = null, shareRevision = 0;
  const node = (tag, cls, text) => {
    const item = document.createElement(tag); item.className = cls || '';
    if (text) item.textContent = text;
    return item;
  };
  const owner = () => Boolean(uid && uid === api.user()?.uid);
  const status = text => { el('publicProfileStatus').textContent = text; };
  const profileURL = () => {
    const url = new URL(window.location.href);
    url.search = ''; url.hash = ''; url.searchParams.set('profile', uid);
    return url.href;
  };
  const picture = (url, alt, cls) => {
    const img = node('img', cls); img.src = url; img.alt = alt; img.loading = 'lazy';
    return img;
  };
  function refresh() {
    if (!uid) return;
    if (owner()) viewed = api.profile();
    const p = viewed;
    el('publicProfileEdit').classList.toggle('hidden', !owner() || !p);
    if (!owner()) el('publicProfileEditor').classList.add('hidden');
    el('publicProfileCreateStore').classList.toggle('hidden', !owner() || p?.accountType === 'shopper');
    if (!p) { el('publicProfileStores').replaceChildren(); el('publicProfileStoreCount').textContent = '0'; return; }
    el('publicProfileName').textContent = p.username || 'Coriva member';
    el('publicProfileHandle').textContent = p.username ? '@' + p.username.replace(/^@/, '') : '';
    el('publicProfileAbout').textContent = p.bio || '';
    el('publicProfileSpecialty').textContent = [p.role, p.focus].filter(Boolean).join(' · ');
    const banner = el('publicProfileBanner');
    banner.classList.toggle('hidden', !p.profileBanner);
    if (p.profileBanner) banner.src = p.profileBanner; else banner.removeAttribute('src');
    const avatar = el('publicProfileAvatar');
    avatar.replaceChildren();
    if (p.profilePicture) avatar.append(picture(p.profilePicture, 'Profile picture', ''));
    else avatar.textContent = (p.username || 'C').charAt(0).toUpperCase();
    const socials = el('publicProfileSocials');
    socials.replaceChildren();
    api.socialUrls(p).forEach(url => { const link = api.socialAnchor(url); if (link) socials.append(link); });
    const stores = api.stores().filter(s => s.ownerUid === uid && (owner() || !s.draft));
    el('publicProfileStoreCount').textContent = String(stores.length);
    const grid = el('publicProfileStores'); grid.replaceChildren();
    for (const [index, store] of stores.entries()) {
      const card = node('button', 'store-directory-card public-profile-store-card'); card.type = 'button';
      card.setAttribute('aria-label', 'View ' + store.name + ' storefront');
      const art = node('span', 'store-directory-art art-' + (index % 4 + 1));
      if (store.banner) art.append(picture(store.banner, '', 'store-directory-banner'));
      const logo = node('span', 'store-directory-logo');
      if (store.logo) logo.append(picture(store.logo, '', ''));
      else logo.textContent = (store.name || 'C').charAt(0).toUpperCase();
      art.append(logo);
      const copy = node('span', 'store-directory-copy');
      copy.append(node('strong', '', store.name || 'Storefront'), node('span', 'store-handle', store.handle),
        node('span', 'store-category-badge', store.draft ? 'Draft' : store.category || 'Creator'));
      copy.append(node('span', 'public-profile-store-link', 'View storefront →'));
      card.append(art, copy); card.addEventListener('click', () => api.openStore(store));
      grid.append(card);
    }
    if (!stores.length) grid.append(node('p', 'empty-state', owner()
      ? 'Your storefronts will appear here when you create one.' : 'No public storefronts yet.'));
  }
  function close(updateURL = true) {
    shareRevision++; uid = null; viewed = null;
    unsubscribe?.(); unsubscribe = null;
    page.classList.add('hidden'); page.setAttribute('aria-hidden', 'true');
    document.querySelector('.page-shell').classList.remove('hidden');
    el('publicProfileSharePanel').classList.add('hidden');
    el('publicProfileEditor').classList.add('hidden');
    if (updateURL) {
      const url = new URL(window.location.href); url.searchParams.delete('profile');
      history.pushState(null, '', url);
    }
  }
  function open(id, updateURL = true) {
    if (!id) { api.signIn(); return; }
    unsubscribe?.(); shareRevision++; uid = id; viewed = null;
    el('publicProfileName').textContent = 'Loading profile…';
    ['publicProfileHandle', 'publicProfileAbout', 'publicProfileSpecialty'].forEach(id => el(id).textContent = '');
    el('publicProfileAvatar').replaceChildren(); el('publicProfileSocials').replaceChildren();
    el('publicProfileStores').replaceChildren(); el('publicProfileBanner').classList.add('hidden');
    ['publicProfileEditor', 'publicProfileSharePanel', 'publicProfileEdit', 'publicProfileCreateStore'].forEach(id => el(id).classList.add('hidden'));
    status('');
    api.closeWelcome();
    document.querySelector('.page-shell').classList.add('hidden');
    page.classList.remove('hidden'); page.setAttribute('aria-hidden', 'false');
    if (updateURL) history.pushState(null, '', profileURL());
    refresh(); window.scrollTo(0, 0); el('publicProfileName').focus();
    unsubscribe = api.subscribe(id, p => {
      viewed = p;
      if (!p && !owner()) {
        el('publicProfileName').textContent = 'Profile unavailable';
        ['publicProfileHandle', 'publicProfileAbout', 'publicProfileSpecialty'].forEach(id => el(id).textContent = '');
        el('publicProfileAvatar').replaceChildren(); el('publicProfileSocials').replaceChildren();
        el('publicProfileBanner').classList.add('hidden');
        refresh();
        status('This profile has not been shared yet or is no longer available.');
      } else { status(''); refresh(); }
    }, error => {
      if (!owner()) el('publicProfileName').textContent = 'Profile unavailable';
      status('Unable to load the shared profile. Please try again.');
    });
  }
  el('publicProfileBack').addEventListener('click', () => close());
  el('publicProfileAccount').addEventListener('click', api.editAccount);
  el('publicProfileCreateStore').addEventListener('click', api.createStore);
  el('publicProfileEdit').addEventListener('click', () => {
    const editor = el('publicProfileEditor'); editor.classList.toggle('hidden');
    el('publicProfileBioInput').value = api.profile()?.bio || '';
    el('publicProfileBannerInput').value = '';
    if (!editor.classList.contains('hidden')) el('publicProfileBioInput').focus();
  });
  el('publicProfileEditor').addEventListener('submit', async event => {
    event.preventDefault(); if (!owner()) return;
    const button = el('publicProfileSave'); button.disabled = true;
    const userId = uid;
    status('Saving profile…');
    try {
      let banner = api.profile()?.profileBanner || '';
      const file = el('publicProfileBannerInput').files[0];
      if (file) banner = await api.uploadBanner(file, userId);
      if (!owner() || uid !== userId) return;
      await api.save({ profileBanner: banner, bio: el('publicProfileBioInput').value.trim() });
      refresh(); el('publicProfileBannerInput').value = '';
      status('Profile saved.');
    } catch (error) { status('Unable to save profile: ' + error.message); }
    finally { button.disabled = false; }
  });
  el('publicProfileRemoveBanner').addEventListener('click', async () => {
    if (!owner()) return;
    try { await api.save({profileBanner: ''}); el('publicProfileBannerInput').value = ''; refresh(); status('Banner removed.'); }
    catch (error) { status('Unable to remove banner: ' + error.message); }
  });
  el('publicProfileShare').addEventListener('click', async () => {
    const panel = el('publicProfileSharePanel');
    panel.classList.toggle('hidden');
    const revision = ++shareRevision;
    if (panel.classList.contains('hidden')) return;
    const url = profileURL(); el('publicProfileURL').value = url;
    el('publicProfileQR').replaceChildren(); el('publicProfileQRDownload').classList.add('hidden');
    el('publicProfileShareStatus').textContent = 'Generating QR code…';
    try {
      if (owner()) await api.publish();
      await api.loadQR();
      if (revision !== shareRevision) return;
      const holder = el('publicProfileQR');
      new window.QRCode(holder, {text: url, width: 224, height: 224, correctLevel: window.QRCode.CorrectLevel.M});
      const canvas = holder.querySelector('canvas');
      const download = el('publicProfileQRDownload');
      if (!canvas) throw new Error('QR image could not be generated. Please try again.');
      const exportCanvas = document.createElement('canvas');
      const margin = 24;
      exportCanvas.width = canvas.width + margin * 2;
      exportCanvas.height = canvas.height + margin * 2;
      const context = exportCanvas.getContext('2d');
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      context.drawImage(canvas, margin, margin);
      download.href = exportCanvas.toDataURL('image/png');
      download.classList.remove('hidden');
      el('publicProfileShareStatus').textContent = 'Scan to open this Coriva profile.';
    } catch (error) { if (revision === shareRevision) el('publicProfileShareStatus').textContent = 'Unable to prepare sharing: ' + error.message; }
  });
  el('publicProfileCopy').addEventListener('click', async () => {
    const url = profileURL();
    try {
      try { await navigator.clipboard.writeText(url); }
      catch {
        const field = document.createElement('textarea');
        field.value = url; field.setAttribute('readonly', '');
        field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        const previousFocus = document.activeElement;
        document.body.append(field); field.select();
        let copied = false;
        try { copied = document.execCommand('copy'); }
        finally { field.remove(); previousFocus?.focus(); }
        if (!copied) throw new Error('Clipboard unavailable');
      }
      el('publicProfileShareStatus').textContent = 'Profile link copied.';
    } catch { el('publicProfileShareStatus').textContent = 'Unable to copy. Please allow clipboard access and try again.'; }
  });
  const trigger = el('profileOpenButton');
  trigger.addEventListener('click', () => open(api.user()?.uid));
  for (const id of ['profileAvatar', 'profileName', 'profileHandle']) {
    const item = el(id); item.setAttribute('role', 'button'); item.tabIndex = 0;
    item.removeAttribute('aria-hidden'); item.setAttribute('aria-label', 'Open your profile');
    item.addEventListener('click', () => open(api.user()?.uid));
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(api.user()?.uid); } });
  }
  window.addEventListener('popstate', () => {
    const id = new URL(window.location.href).searchParams.get('profile');
    if (id) open(id, false); else if (uid) close(false);
  });
  const requested = new URL(window.location.href).searchParams.get('profile');
  if (requested) open(requested, false);
  return {refresh};
}
