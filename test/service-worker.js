const CACHE_NAME="garyeobjip-test-shell-v1";
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
  if(req.method!=="GET") return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  // 앱 본문은 항상 네트워크 우선. 온라인에서는 최신 GitHub 버전을 보여주고,
  // 네트워크가 끊겼을 때만 마지막 앱 껍데기를 사용한다.
  if(req.mode==="navigate"){
    event.respondWith(
      fetch(req).catch(()=>caches.match("./"))
    );
    return;
  }

  // manifest/icon만 가볍게 캐시. 실제 회의·방문·회계 데이터는 캐시하지 않는다.
  if(url.pathname.endsWith("/manifest.webmanifest")||url.pathname.endsWith("/icon.svg")){
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache=>{
        try{
          const fresh=await fetch(req);
          if(fresh&&fresh.ok) cache.put(req,fresh.clone());
          return fresh;
        }catch(e){
          return cache.match(req);
        }
      })
    );
  }
});