const CACHE="gods-eye-v8";
const CORE=["./","./index.html","./manifest.webmanifest","./icon.svg","./fixes-v7.js"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener("activate",e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  const isAppPage=u.origin===self.location.origin&&(u.pathname.endsWith("/gods-eye-mobile/")||u.pathname.endsWith("/index.html"));
  if(isAppPage){
    e.respondWith(fetch(e.request,{cache:"no-store"}).then(async r=>{
      let html=await r.text();
      if(!html.includes("fixes-v7.js"))html=html.replace("</body>",'<script src="./fixes-v7.js"></script></body>');
      const headers=new Headers(r.headers);headers.delete("content-length");
      return new Response(html,{status:r.status,statusText:r.statusText,headers});
    }).catch(()=>caches.match("./index.html")));
    return;
  }
  if(u.pathname.endsWith("/data/cameras.json")){
    e.respondWith(fetch(e.request,{cache:"no-store"}));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(e.request)));
});
