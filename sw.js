const CACHE="gods-eye-v4";
const CORE=["./","./index.html","./manifest.webmanifest","./icon.svg","./data/cameras.json"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener("activate",e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  const isCameraSource=u.hostname==="opendata.transport.nsw.gov.au"&&u.pathname.includes("livetrafficcamera.json");
  if(isCameraSource){
    e.respondWith(fetch("./data/cameras.json",{cache:"no-store"}).catch(()=>caches.match("./data/cameras.json")));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(e.request)));
});
