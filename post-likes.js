/* Reflect the signed-in viewer's own like on each FYP post. */
(() => {
 const initialize = () => {
  const feed = document.getElementById('discoverFeed');
  if (!feed || !window.corivaPosts || feed.dataset.likesInitialized) return;
  feed.dataset.likesInitialized = 'true';
  const watchers = new Map();
  const sync = () => {
    for (const [id, entry] of watchers) {
      if (!entry.button.isConnected) { entry.stop(); watchers.delete(id); }
    }
    feed.querySelectorAll('[data-like-post-id]').forEach(button => {
      const id = button.dataset.likePostId;
      if (watchers.has(id)) return;
      const stop = window.corivaPosts.watchLike(id, active => {
        button.classList.toggle('is-liked', active);
        button.setAttribute('aria-pressed', String(active));
        button.setAttribute('aria-label', active ? 'Unlike post' : 'Like post');
        button.querySelector('.post-like-icon').textContent = active ? '♥' : '♡';
      });
      watchers.set(id, { button, stop });
    });
  };
  new MutationObserver(sync).observe(feed, { childList: true });
  sync();

  const pending = new Set();
  const recentLikes = new Map();
  const excluded = target => target.closest('button, a, input, textarea, select, .discover-post-copy, .post-action-rail');
  const currentCard = id => [...feed.querySelectorAll('.discover-post')].find(card => card.dataset.postId === id);
  const like = async id => {
    const now = Date.now();
    if (!id || pending.has(id) || now - (recentLikes.get(id) || 0) < 800) return;
    pending.add(id);
    try {
      const result = await window.corivaPosts.likePost(id);
      if (!result) return;
      recentLikes.set(id, Date.now());
      // A Firestore update may replace the card before the save completes.
      const card = currentCard(id);
      if (card) {
        const button = card.querySelector('[data-like-post-id]');
        if (button) {
          button.classList.add('is-liked');
          button.setAttribute('aria-pressed', 'true');
          button.setAttribute('aria-label', 'Unlike post');
          button.querySelector('.post-like-icon').textContent = '♥';
          button.querySelector('.post-like-count').textContent = String(result.likes);
        }
        const heart = document.createElement('span');
        heart.className = 'post-double-like-heart';
        heart.textContent = '♥';
        heart.setAttribute('aria-hidden', 'true');
        card.append(heart);
        setTimeout(() => heart.remove(), 700);
      }
      try { window.navigator?.vibrate?.(25); } catch (_) {}
    } catch (error) {
      console.warn('Like could not be saved:', error.code || error.message);
      const card = currentCard(id);
      if (card) {
        const status = document.createElement('span');
        status.className = 'post-like-status';
        status.setAttribute('role', 'status');
        status.textContent = 'Like could not be saved. Please try again.';
        card.append(status);
        setTimeout(() => status.remove(), 4000);
      }
    } finally { pending.delete(id); }
  };
  let start, lastTap;
  const begin = (target, point) => {
    if (excluded(target)) { start = null; lastTap = null; return; }
    const card = target.closest('.discover-post');
    start = card ? { id: card.dataset.postId, x: point.clientX, y: point.clientY, time: Date.now() } : null;
  };
  const finish = (target, point, event) => {
    const tap = start;
    start = null;
    if (!tap || excluded(target)) return;
    const card = target.closest('.discover-post');
    const now = Date.now();
    if (card?.dataset.postId !== tap.id || now - tap.time > 500 ||
        Math.hypot(point.clientX - tap.x, point.clientY - tap.y) > 20) { lastTap = null; return; }
    if (lastTap && lastTap.id === tap.id && now - lastTap.time <= 450 &&
        Math.hypot(point.clientX - lastTap.x, point.clientY - lastTap.y) <= 60) {
      lastTap = null;
      if (event.cancelable) event.preventDefault();
      like(tap.id);
    } else lastTap = { id: tap.id, time: now, x: point.clientX, y: point.clientY };
  };
  const cancel = () => { start = null; lastTap = null; };
  // Native touch events cover Android browsers and embedded mobile web views.
  const nativeTouch = 'ontouchstart' in window;
  feed.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) { cancel(); return; }
    begin(event.target, event.touches[0]);
  }, { capture: true, passive: true });
  feed.addEventListener('touchmove', event => {
    if (!start || event.touches.length !== 1) { cancel(); return; }
    const point = event.touches[0];
    if (Math.hypot(point.clientX - start.x, point.clientY - start.y) > 20) cancel();
  }, { capture: true, passive: true });
  feed.addEventListener('touchend', event => {
    if (event.touches.length || event.changedTouches.length !== 1) { cancel(); return; }
    finish(event.target, event.changedTouches[0], event);
  }, { capture: true, passive: false });
  feed.addEventListener('touchcancel', cancel, { capture: true, passive: true });
  // Pointer fallback covers pens and touch devices without native touch events.
  feed.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || (nativeTouch && event.pointerType === 'touch')) return;
    if (event.isPrimary === false) { cancel(); return; }
    begin(event.target, event);
  }, { capture: true, passive: true });
  feed.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse' || (nativeTouch && event.pointerType === 'touch') || !start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 20) cancel();
  }, { capture: true, passive: true });
  feed.addEventListener('pointerup', event => {
    if (event.pointerType === 'mouse' || (nativeTouch && event.pointerType === 'touch')) return;
    finish(event.target, event, event);
  }, { capture: true, passive: false });
  feed.addEventListener('pointercancel', event => {
    if (!(nativeTouch && event.pointerType === 'touch')) cancel();
  }, { capture: true, passive: true });
  feed.addEventListener('dblclick', event => {
    if (excluded(event.target)) return;
    const card = event.target.closest('.discover-post');
    if (card) { event.preventDefault(); like(card.dataset.postId); }
  });
 };
 if (window.corivaPosts) initialize();
 else window.addEventListener('coriva-ready', initialize, { once: true });
})();
