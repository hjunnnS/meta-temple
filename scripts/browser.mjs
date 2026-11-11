// Use the pinned project dependency; an override is optional for managed environments.
export const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
export function launchBrowser(extra={}){return chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL??'chromium',args:['--enable-gpu',...(process.env.CI?['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']:[])],...extra});}
