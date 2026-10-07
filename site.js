(() => {
  'use strict';
  const root = document.documentElement;
  const isHome = Boolean(document.querySelector('#world-sculpture'));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // The homepage owns its renderer; collection pages share the same motion preference.
  if (!isHome) {
    let paused = reduce.matches;
    try {
      const saved = sessionStorage.getItem('ejm-motion-paused');
      if (saved !== null) paused = saved === 'true';
    } catch {}
    const toggle = document.querySelector('.motion-toggle');
    function syncMotion() {
      root.classList.toggle('is-paused', paused);
      if (toggle) {
        toggle.hidden = false;
        toggle.setAttribute('aria-pressed', String(paused));
        toggle.querySelector('.motion-label').textContent = paused ? 'Resume motion' : 'Pause motion';
      }
      try { sessionStorage.setItem('ejm-motion-paused', String(paused)); } catch {}
    }
    toggle?.addEventListener('click', () => { paused = !paused; syncMotion(); });
    reduce.addEventListener('change', () => { paused = reduce.matches; syncMotion(); });
    syncMotion();
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }, { threshold: .04, rootMargin: '0px 0px 40px 0px' });
      document.querySelectorAll('.reveal').forEach(item => observer.observe(item));
      root.classList.add('motion-ready');
    }
    const progress = document.querySelector('.reading-progress');
    let queued = false;
    function updateProgress() {
      const length = root.scrollHeight - innerHeight;
      if (progress) progress.style.transform = `scaleX(${length > 0 ? scrollY / length : 0})`;
      queued = false;
    }
    addEventListener('scroll', () => {
      if (!queued) { queued = true; requestAnimationFrame(updateProgress); }
    }, { passive: true });
    addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
  }

  const search = document.querySelector('[data-search]');
  if (search) {
    const items = [...document.querySelectorAll('[data-search-item]')];
    const count = document.querySelector('[data-search-count]');
    const empty = document.querySelector('[data-search-empty]');
    function filter() {
      const words = search.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
      let matches = 0;
      for (const item of items) {
        const text = (item.dataset.searchText || item.textContent).toLocaleLowerCase();
        item.hidden = !words.every(word => text.includes(word));
        if (!item.hidden) { matches++; item.classList.add('is-visible'); }
      }
      count.textContent = `${matches} of ${items.length}`;
      if (empty) empty.hidden = matches !== 0;
    }
    search.closest('[data-enhance]').hidden = false;
    search.addEventListener('input', filter);
    search.addEventListener('search', filter);
    filter();
  }

  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track = carousel.querySelector('[data-carousel-track]');
    const slides = [...(track?.children || [])];
    const count = carousel.querySelector('[data-carousel-count]');
    const progress = carousel.querySelector('[data-carousel-progress]');
    if (!track || slides.length < 2) return;
    let active = 0, queued = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    function update() {
      const center = track.getBoundingClientRect().left + track.clientWidth / 2;
      let nearest = 0, distance = Infinity;
      slides.forEach((slide, i) => {
        const box = slide.getBoundingClientRect();
        const d = Math.abs(box.left + box.width / 2 - center);
        if (d < distance) { distance = d; nearest = i; }
      });
      active = nearest;
      if (count) count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      if (progress) progress.style.width = `${((active + 1) / slides.length) * 100}%`;
      queued = false;
    }
    function scheduleUpdate() {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }
    function move(delta) {
      const next = (active + delta + slides.length) % slides.length;
      track.scrollTo({ left: slides[next].offsetLeft - track.offsetLeft, behavior: reduced.matches ? 'instant' : 'smooth' });
      active = next;
      scheduleUpdate();
    }
    track.addEventListener('scroll', scheduleUpdate, { passive: true });
    track.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    });
    carousel.querySelector('[data-carousel-prev]')?.addEventListener('click', () => move(-1));
    carousel.querySelector('[data-carousel-next]')?.addEventListener('click', () => move(1));
    update();
  });

  document.querySelectorAll('[data-play-video]').forEach(button => {
    button.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.src = `https://www.youtube.com/embed/${button.dataset.playVideo}?autoplay=1`;
      frame.title = button.dataset.videoTitle;
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      frame.allowFullscreen = true;
      button.replaceWith(frame);
      frame.focus();
    });
  });

  document.querySelector('[data-load-map]')?.addEventListener('click', event => {
    const button = event.currentTarget;
    const frame = document.createElement('iframe');
    frame.src = button.dataset.loadMap;
    frame.title = 'Places Eric James McDermott has visited';
    button.replaceWith(frame);
    frame.focus();
  });

  const viewer = document.querySelector('.image-viewer');
  if (viewer && typeof viewer.showModal === 'function') {
    const all = [...document.querySelectorAll('a[data-gallery]')];
    const image = viewer.querySelector('#viewer-image');
    const caption = viewer.querySelector('#viewer-caption');
    const original = viewer.querySelector('#viewer-original');
    let group = [], index = 0, opener = null;
    function show() {
      const link = group[index];
      image.alt = link.dataset.caption || link.querySelector('img')?.alt || '';
      image.src = link.href;
      caption.textContent = `${image.alt} · ${index + 1} / ${group.length}`;
      original.href = link.href;
    }
    function move(delta) { index = (index + delta + group.length) % group.length; show(); }
    all.forEach(link => link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      group = all.filter(item => item.dataset.gallery === link.dataset.gallery && !item.closest('[hidden]'));
      index = group.indexOf(link);
      show();
      viewer.showModal();
      document.body.classList.add('viewer-open');
      viewer.querySelector('[data-close-viewer]').focus();
    }));
    viewer.querySelector('[data-close-viewer]').addEventListener('click', () => viewer.close());
    viewer.querySelector('[data-previous-image]').addEventListener('click', () => move(-1));
    viewer.querySelector('[data-next-image]').addEventListener('click', () => move(1));
    viewer.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    });
    viewer.addEventListener('click', event => {
      if (event.target === viewer) {
        const rect = viewer.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) viewer.close();
      }
    });
    viewer.addEventListener('close', () => {
      document.body.classList.remove('viewer-open');
      image.removeAttribute('src');
      opener?.focus({ preventScroll: true });
    });
  }
})();
