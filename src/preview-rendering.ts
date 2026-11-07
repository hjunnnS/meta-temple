interface RenderEngine {
  runRenderLoop(render: () => void): void;
  stopRenderLoop(render: () => void): void;
}

export function renderWhileViewing(
  engine: RenderEngine,
  render: () => void,
  onPause?: () => void,
  onResume?: () => void,
  firstFrameReady?: () => boolean,
) {
  let running = false;
  let pagePresent = true;

  let preparing = firstFrameReady !== undefined;
  const frame = firstFrameReady ? () => {
    render();
    if (preparing && firstFrameReady()) {
      preparing = false;
      sync();
    }
  } : render;

  function sync() {
    const shouldRender = pagePresent && !document.hidden && (preparing || document.hasFocus());
    if (shouldRender === running) return;
    running = shouldRender;
    if (running) {
      onResume?.();
      engine.runRenderLoop(frame);
    } else {
      engine.stopRenderLoop(frame);
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
