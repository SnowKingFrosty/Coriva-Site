/* Progressive enhancement for the FYP; works with the shipped app bundle. */
(() => {
  const viewer = document.getElementById('feedViewer');
  const feed = document.getElementById('discoverFeed');
  const button = document.getElementById('feedFullscreenButton');
  const toolbar = document.getElementById('feedViewerToolbar');
  if (!viewer || !feed || !button) return;
  let active = false;
  let sequence = 0;
  let currentCard;
  let savedOverflow;
  let inertElements = [];
  const nearestCard = () => [...feed.children].reduce((best, card) =>
    !best || Math.abs(card.getBoundingClientRect().top - feed.getBoundingClientRect().top) <
      Math.abs(best.getBoundingClientRect().top - feed.getBoundingClientRect().top) ? card : best, null);
  const alignCard = () => requestAnimationFrame(() => {
    if (currentCard?.isConnected) {
      const behavior = feed.style.scrollBehavior;
      feed.style.scrollBehavior = 'auto';
      feed.scrollTop += currentCard.getBoundingClientRect().top - feed.getBoundingClientRect().top;
      feed.style.scrollBehavior = behavior;
    }
  });
  const setActive = (value) => {
    if (active === value) return;
    currentCard = nearestCard();
    active = value;
    viewer.classList.toggle('is-fullscreen', value);
    button.textContent = value ? 'Exit full screen' : 'Full screen';
    button.setAttribute('aria-pressed', String(value));
    if (value) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      viewer.setAttribute('role', 'dialog');
      viewer.setAttribute('aria-modal', 'true');
      viewer.setAttribute('aria-label', 'Full screen For you feed');
      // Keep keyboard focus and assistive technology within the full screen feed.
      for (let node = viewer; node.parentElement; node = node.parentElement) {
        for (const sibling of node.parentElement.children) {
          if (sibling !== node && !sibling.inert) {
            sibling.inert = true;
            inertElements.push(sibling);
          }
        }
      }
    } else {
      document.body.style.overflow = savedOverflow;
      viewer.removeAttribute('role');
      viewer.removeAttribute('aria-modal');
      viewer.removeAttribute('aria-label');
      inertElements.forEach(element => { element.inert = false; });
      inertElements = [];
    }
    alignCard();
    button.focus({ preventScroll: true });
  };
  const exit = () => {
    setActive(false);
    if (document.fullscreenElement === viewer) document.exitFullscreen?.().catch(() => {});
  };
  button.addEventListener('click', () => {
    if (active) { exit(); return; }
    setActive(true);
    // The fixed viewport view remains available on mobile browsers without this API.
    if (viewer.requestFullscreen) {
      try {
        Promise.resolve(viewer.requestFullscreen()).then(() => {
          if (!active && document.fullscreenElement === viewer) document.exitFullscreen?.().catch(() => {});
          else alignCard();
        }).catch(() => {});
      } catch (_) { /* Keep the viewport fallback. */ }
    }
  });
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement !== viewer && active) setActive(false);
  });
  viewer.addEventListener('keydown', event => {
    if (!active) return;
    if (event.key === 'Escape') { event.preventDefault(); exit(); }
    if (event.key === 'Tab') {
      const elements = [...viewer.querySelectorAll('button, a[href], input, video[controls], [tabindex="0"]')]
        .filter(element => element.getClientRects().length && !element.disabled);
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  // Storefronts and sign-in dialogs live outside this viewer.
  feed.addEventListener('click', event => {
    const opensSignIn = event.target.closest('[data-like-post-id]') && !document.getElementById('loginButton')?.classList.contains('hidden');
    if (active && (opensSignIn || event.target.closest('[data-shop-store-id], #feedCreatePost, a'))) exit();
  }, true);
  // Expanded captions own wheel gestures, including at the top/bottom boundary.
  feed.addEventListener('wheel', event => {
    if (event.target.closest('.discover-post-caption.is-expanded')) event.stopImmediatePropagation();
  }, { capture: true, passive: true });
  const enhanceCaptions = () => {
    toolbar.classList.toggle('hidden', feed.classList.contains('stores-mode') || feed.classList.contains('rooms-mode'));
    feed.querySelectorAll('.discover-post-caption:not([data-collapsible])').forEach(caption => {
      caption.dataset.collapsible = 'true';
      if (!caption.textContent.trim()) return;
      caption.id = `feed-caption-${++sequence}`;
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'post-caption-toggle';
      toggle.textContent = 'More';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', caption.id);
      toggle.addEventListener('click', () => {
        const expanded = caption.classList.toggle('is-expanded');
        toggle.textContent = expanded ? 'Less' : 'More';
        toggle.setAttribute('aria-expanded', String(expanded));
        if (expanded) caption.tabIndex = 0;
        else { caption.removeAttribute('tabindex'); caption.scrollTop = 0; }
      });
      caption.after(toggle);
    });
  };
  new MutationObserver(enhanceCaptions).observe(feed, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  enhanceCaptions();
})();
