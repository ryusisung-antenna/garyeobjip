const CACHE_NAME="garyeobjip-shell-v1";
const APP_ROOT="/garyeobjip/";
const APP_SHELL=["./","./manifest.webmanifest","./icon.svg"];

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(APP_SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  // 집사앱 본문만 네트워크 우선. 방문자앱 등 다른 경로에는 개입하지 않는다.
  if(req.mode==="navigate"){
    if(url.pathname!==APP_ROOT && url.pathname!==APP_ROOT+"index.html")return;
    event.respondWith(fetch(req).catch(()=>caches.match("./")));
    return;
  }

  // 설치용 정적 파일만 캐시. 실제 회의·방문·회계 데이터는 캐시하지 않는다.
  if(url.pathname===APP_ROOT+"manifest.webmanifest"||url.pathname===APP_ROOT+"icon.svg"){
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache=>{
        try{
          const fresh=await fetch(req);
          if(fresh&&fresh.ok)cache.put(req,fresh.clone());
          return fresh;
        }catch(e){
          return cache.match(req);
        }
      })
    );
  }
});