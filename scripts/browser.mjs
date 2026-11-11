// Use the pinned project dependency; an override is optional for managed environments.
export const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
export function launchBrowser(extra={}){return chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{}),args:['--enable-gpu'],...extra});}
