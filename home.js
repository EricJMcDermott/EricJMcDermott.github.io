(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('.motion-toggle');
  let paused = reduced.matches;
  try { const saved = sessionStorage.getItem('ejm-motion-paused'); if (saved !== null) paused = saved === 'true' || reduced.matches; } catch {}
  function motion() {
    root.classList.toggle('is-paused', paused);
    toggle.hidden = false;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.querySelector('.motion-label').textContent = paused ? 'Resume motion' : 'Pause motion';
    const svg = document.querySelector('.atlas-lines');
    if (paused) svg?.pauseAnimations?.(); else svg?.unpauseAnimations?.();
    try { sessionStorage.setItem('ejm-motion-paused', String(paused)); } catch {}
  }
  toggle?.addEventListener('click', () => { paused = !paused; motion(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; motion(); });
  if (toggle) motion();
  const year = document.querySelector('#year'); if (year) year.textContent = new Date().getFullYear();
  const note = document.querySelector('#atlas-note');
  const defaultNote = note?.innerHTML;
  document.querySelectorAll('[data-atlas-note]').forEach(link => {
    function show() { note.textContent = link.dataset.atlasNote; link.closest('.connection-atlas').classList.add('has-focus'); }
    function clear() { note.innerHTML = defaultNote; link.closest('.connection-atlas').classList.remove('has-focus'); }
    link.addEventListener('pointerenter', show); link.addEventListener('focus', show);
    link.addEventListener('pointerleave', () => { if (document.activeElement !== link) clear(); });
    link.addEventListener('blur', clear);
  });
  const filters = document.querySelector('[data-work-filter]');
  if (filters) {
    filters.hidden = false;
    filters.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
      const category = button.dataset.filter; let count = 0;
      filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      document.querySelectorAll('[data-project]').forEach(item => {
        const show = category === 'all' || item.dataset.project.split(' ').includes(category);
        item.hidden = !show; if (show) count++;
      });
      document.querySelector('#work-count').textContent = `${count} project${count === 1 ? '' : 's'}`;
    }));
  }
  let queued = false;
  const progress = document.querySelector('.reading-progress');
  function update() {
    const length = root.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${length > 0 ? scrollY / length : 0})`;
    queued = false;
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update, { passive: true }); update();
})();
