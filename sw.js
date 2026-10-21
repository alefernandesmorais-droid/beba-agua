// Service worker do Beba Água: faz o app abrir mesmo sem internet.
// Estratégia: tenta a rede primeiro (assim as atualizações chegam sozinhas) e usa o cache se estiver offline.
// Se mudar muita coisa no app, troque o número da versão abaixo (v4 -> v5).
var CACHE = 'beba-agua-v4';
var ASSETS = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
      })
      .then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(function(res){
        if(res && res.ok){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      })
      .catch(function(){
        return caches.match(req).then(function(hit){ return hit || caches.match('index.html'); });
      })
  );
});

// Ao tocar em um aviso, abre (ou volta para) o app.
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(list){
      for(var i = 0; i < list.length; i++){
        if('focus' in list[i]) return list[i].focus();
      }
      if(self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
