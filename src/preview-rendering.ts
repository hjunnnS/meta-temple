interface RenderEngine {
  runRenderLoop(render: () => void): void;
  stopRenderLoop(render: () => void): void;
  getRenderingCanvas?(): HTMLCanvasElement | null;
}

export function renderWhileViewing(
  engine: RenderEngine,
  render: () => void,
  onPause?: () => void,
  onResume?: () => void,
  firstFrameReady?: () => boolean,
  viewUncovered: () => boolean = () => true,
) {
  let running = false;
  let pagePresent = true;
  let canvasVisible = true;

  let preparing = firstFrameReady !== undefined;
  const frame = firstFrameReady ? () => {
    render();
    if (preparing && firstFrameReady()) {
      preparing = false;
      sync();
    }
  } : render;

  function sync() {
    const shouldRender = pagePresent && !document.hidden && canvasVisible && (preparing || viewUncovered());
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

  const canvas=engine.getRenderingCanvas?.();
  if(canvas&&typeof IntersectionObserver!=='undefined'){
    const observer=new IntersectionObserver(entries=>{canvasVisible=entries.some(e=>e.isIntersecting);sync();});
    observer.observe(canvas);
    window.addEventListener('pageshow',()=>observer.observe(canvas));
    window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
  }
  if(typeof MutationObserver!=='undefined'){
    const observer=new MutationObserver(records=>{if(records.some(r=>(r.target as Element).matches('dialog,#offering-drawer,#practice-feedback,#private-practice-feedback')))sync();});
    observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','hidden','data-state']});
    window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
    window.addEventListener('pageshow',()=>observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','hidden','data-state']}));
  }
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('blur', sync);
  window.addEventListener('focus', sync);
  window.addEventListener('pagehide', () => { pagePresent = false; sync(); });
  window.addEventListener('pageshow', () => { pagePresent = true; sync(); });
  sync();
}
