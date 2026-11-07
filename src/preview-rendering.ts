interface RenderEngine {
  runRenderLoop(render: () => void): void;
  stopRenderLoop(render: () => void): void;
}

export function renderWhileViewing(
  engine: RenderEngine,
  render: () => void,
  onPause?: () => void,
  onResume?: () => void,
) {
  let running = false;
  let pagePresent = true;

  function sync() {
    const shouldRender = pagePresent && !document.hidden && document.hasFocus();
    if (shouldRender === running) return;
    running = shouldRender;
    if (running) {
      onResume?.();
      engine.runRenderLoop(render);
    } else {
      engine.stopRenderLoop(render);
      onPause?.();
    }
  }

  document.addEventListener('visibilitychange', sync);
  window.addEventListener('blur', sync);
  window.addEventListener('focus', sync);
  window.addEventListener('pagehide', () => { pagePresent = false; sync(); });
  window.addEventListener('pageshow', () => { pagePresent = true; sync(); });
  sync();
}
