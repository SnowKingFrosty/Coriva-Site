(() => {
  const timer = setTimeout(() => {
    if (window.corivaReady) return;
    const notice = document.createElement('div');
    notice.className = 'startup-error'; notice.setAttribute('role', 'alert');
    notice.textContent = 'Coriva could not finish loading. Check your connection and reload the page. ';
    const retry = document.createElement('button'); retry.type = 'button';
    retry.className = 'secondary-btn'; retry.textContent = 'Reload';
    retry.addEventListener('click', () => location.reload());
    notice.append(retry); document.body.append(notice);
  }, 15000);
  window.addEventListener('coriva-ready', () => clearTimeout(timer), {once:true});
})();
