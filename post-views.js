/* Count one sustained FYP impression per post, per browsing session. */
(() => {
  const feed = document.getElementById('discoverFeed');
  if (!feed || !('IntersectionObserver' in window)) return;
  const seen = new Set();
  try { JSON.parse(sessionStorage.getItem('corivaViewedPosts') || '[]').forEach(id => seen.add(id)); } catch (_) {}
  const timers = new Map();
  const pending = new Set();
  const cancel = card => {
    clearTimeout(timers.get(card));
    timers.delete(card);
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const card = entry.target, id = card.dataset.postId;
      cancel(card);
      if (!entry.isIntersecting || entry.intersectionRatio < .6 || !id || seen.has(id) || pending.has(id)) return;
      timers.set(card, setTimeout(async () => {
        timers.delete(card);
        if (!card.isConnected || document.visibilityState === 'hidden' ||
          !document.getElementById('storeTemplateModal')?.classList.contains('hidden') || !card.getClientRects().length) return;
        const rect = card.getBoundingClientRect(), bounds = feed.getBoundingClientRect();
        const visibleHeight = Math.max(0, Math.min(rect.bottom, bounds.bottom, window.innerHeight) - Math.max(rect.top, bounds.top, 0));
        if (visibleHeight < rect.height * .6 || seen.has(id) || pending.has(id)) return;
        pending.add(id);
        try {
          if (await window.corivaPosts.recordView(id)) {
            seen.add(id);
            try { sessionStorage.setItem('corivaViewedPosts', JSON.stringify([...seen])); } catch (_) {}
          }
        } catch (error) { console.warn('Post view could not be saved:', error.code || error.message); }
        finally { pending.delete(id); }
      }, 2000));
    });
  }, { threshold: [.6] });
  const sync = () => {
    for (const card of timers.keys()) if (!card.isConnected) { cancel(card); observer.unobserve(card); }
    feed.querySelectorAll('.discover-post:not([data-view-observed])').forEach(card => {
      card.dataset.viewObserved = 'true';
      observer.observe(card);
    });
  };
  new MutationObserver(sync).observe(feed, { childList: true });
  document.addEventListener('visibilitychange', () => {
    for (const card of timers.keys()) cancel(card);
    observer.disconnect();
    feed.querySelectorAll('[data-view-observed]').forEach(card => card.removeAttribute('data-view-observed'));
    if (document.visibilityState !== 'hidden') sync();
  });
  sync();
})();
