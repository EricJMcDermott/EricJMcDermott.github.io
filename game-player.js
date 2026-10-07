(() => {
  'use strict';
  const player = document.querySelector('[data-game-build]');
  if (!player) return;
  const launch = player.querySelector('[data-start-game]');
  const status = player.querySelector('.game-status');
  const start = player.querySelector('.game-start');
  const area = player.querySelector('.game-scroll');
  let instance = null;
  let loader = null;
  function loadEngine() {
    if (window.UnityLoader) return Promise.resolve();
    if (loader) return loader;
    loader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'Build/UnityLoader.js';
      script.onload = resolve;
      script.onerror = () => { loader = null; script.remove(); reject(new Error('Engine could not load')); };
      document.head.append(script);
    });
    return loader;
  }
  launch.addEventListener('click', async () => {
    launch.disabled = true;
    status.textContent = 'Loading the game engine…';
    try {
      await loadEngine();
      area.hidden = false;
      instance = window.UnityLoader.instantiate('unityContainer', player.dataset.gameBuild, {
        onProgress: (_, progress) => {
          status.textContent = `Loading the world… ${Math.round(progress * 100)}%`;
          if (progress >= 1) {
            start.hidden = true;
            player.querySelector('[data-game-fullscreen]').focus({ preventScroll: true });
          }
        }
      });
    } catch {
      status.textContent = 'The game could not load. Please try again.';
      launch.disabled = false;
      area.hidden = true;
    }
  });
  player.querySelector('[data-game-fullscreen]').addEventListener('click', () => instance?.SetFullscreen(1));
})();
