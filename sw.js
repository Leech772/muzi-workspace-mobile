const C='lee-time-v3-rename';
const A=['./','./index.html','./manifest.webmanifest','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png','./icons/muzi-mark.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim();});
// 页面导航网络优先（在线时拿到最新版，离线回退缓存）；静态资源缓存优先。
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET')return;
  if(q.mode==='navigate'){e.respondWith(fetch(q).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put('./index.html',cp));return res;}).catch(()=>caches.match('./index.html')));return;}
  e.respondWith(caches.match(q,{ignoreSearch:true}).then(r=>r||fetch(q).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(q,cp));return res;})));});
// 点击任务结束通知：聚焦已打开的 App 或打开计划页
self.addEventListener('notificationclick',e=>{e.notification.close();const url=(e.notification.data&&e.notification.data.url)||'./#plan';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){c.postMessage({type:'open-plan',id:e.notification.data&&e.notification.data.id});if('focus' in c)return c.focus();}return self.clients.openWindow(url);}));});
