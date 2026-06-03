/* =============================================================================
   Eseyasa — capa de datos del sitio público
   Conecta las páginas estáticas con la API del dashboard (Next.js) y construye
   un reproductor de vídeo "facade": muestra solo la portada (lazy) y carga el
   iframe pesado de YouTube/Vimeo únicamente al hacer click. Optimiza peso y LCP.
   ============================================================================= */
(function () {
  'use strict';

  // --- Base de la API del dashboard -----------------------------------------
  // En producción apunta al dominio del dashboard; en cualquier otro caso
  // (localhost, 127.0.0.1 o una IP de red local como 192.168.x / 172.x) deriva
  // la API del MISMO host donde se abre la página, en el puerto 3001. Así el
  // sitio funciona tanto en http://localhost:8000 como en http://<IP>:8000.
  // ⚠️ Cambia PROD_API por tu dominio real del dashboard si no es este.
  var PROD_API = 'http://<tu_IP_VPS>';
// Reemplaza <tu_IP_VPS> por la IP real de tu VPS
  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || /^192\.168\./.test(host) || /^10\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
  // Si PROD_API sigue siendo el placeholder (o no es una URL válida), no
  // intentamos llamar a la API en producción: servimos directamente el JSON
  // local. Así evitamos una petición fallida + error en consola en cada carga.
  var API_DISABLED = /<tu_IP_VPS>/.test(PROD_API) || !/^https?:\/\//.test(PROD_API);
  var API_BASE = isLocal ? (location.protocol + '//' + host + ':3001') : (API_DISABLED ? null : PROD_API);
  var LOCAL_ARTISTS_JSON = 'artists-data.json';

  function loadLocalArtists() {
    return fetch(LOCAL_ARTISTS_JSON, { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }

  function apiGet(path) {
    if (!API_BASE) return Promise.reject(new Error('API disabled'));
    return fetch(API_BASE + path, { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }

  function measureOrientation(src) {
    return new Promise(function (resolve) {
      if (!src) return resolve('landscape');
      var img = new Image();
      img.onload = function () {
        if (img.naturalHeight > img.naturalWidth) return resolve('portrait');
        if (img.naturalWidth > img.naturalHeight) return resolve('landscape');
        return resolve('square');
      };
      img.onerror = function () { resolve('landscape'); };
      img.src = src;
    });
  }

  function fetchArtists() {
    return apiGet('/api/artists').then(function (list) {
      if (!Array.isArray(list) || !list.length) throw new Error('No artists');
      if (!list.some(function (a) { return a && a.imageUrl; })) throw new Error('No images');
      return list.slice().reverse();
    }).catch(function () {
      return loadLocalArtists();
    });
  }

  // --- Parseo de URLs de vídeo ----------------------------------------------
  function parseVideo(url) {
    if (!url) return null;
    url = String(url).trim();
    var m;
    // YouTube: watch?v=, youtu.be/, embed/, shorts/
    m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    if (m) {
      return {
        provider: 'youtube',
        // Usem youtube.com (no -nocookie): alguns videoclips amb segell mostren
        // "vídeo no disponible" al domini nocookie tot i ser incrustables aquí.
        // playsinline=1 evita que el mòbil obri el reproductor a pantalla completa.
        id: m[1],
        embed: 'https://www.youtube.com/embed/' + m[1] + '?autoplay=1&rel=0&playsinline=1',
      };
    }
    // Vimeo: vimeo.com/123456789 (o player.vimeo.com/video/123456789)
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) {
      return {
        provider: 'vimeo',
        id: m[1],
        embed: 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1',
      };
    }
    return null;
  }

  // Devuelve una Promise con la URL de portada del vídeo.
  function getPoster(v) {
    if (!v) return Promise.resolve(null);
    if (v.provider === 'youtube') {
      // maxres no siempre existe; el <img> hace fallback a hqdefault con onerror.
      return Promise.resolve('https://i.ytimg.com/vi/' + v.id + '/maxresdefault.jpg');
    }
    if (v.provider === 'vimeo') {
      return fetch('https://vimeo.com/api/oembed.json?url=https://vimeo.com/' + v.id)
        .then(function (r) { return r.json(); })
        .then(function (d) { return (d && d.thumbnail_url) ? d.thumbnail_url.replace(/_\d+x\d+/, '_1280') : null; })
        .catch(function () { return null; });
    }
    return Promise.resolve(null);
  }

  /* Monta el reproductor facade dentro de `container`.
     opts: { title, subtitle } para el caption sobre la portada. */
  function mountVideoFacade(container, url, opts) {
    opts = opts || {};
    var v = parseVideo(url);
    if (!v) { container.style.display = 'none'; return; }

    container.innerHTML = '';
    container.className = 'relative rounded-3xl overflow-hidden bg-surface-container-highest group cursor-pointer';
    container.setAttribute('role', 'button');
    container.setAttribute('tabindex', '0');
    container.setAttribute('aria-label', 'Play video' + (opts.title ? ': ' + opts.title : ''));

    // Portada (lazy, sin reservar peso hasta que entra en viewport)
    var img = document.createElement('img');
    img.alt = opts.title ? ('Video thumbnail: ' + opts.title) : 'Video thumbnail';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.className = 'w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105';
    if (v.provider === 'youtube') {
      img.src = 'https://i.ytimg.com/vi/' + v.id + '/maxresdefault.jpg';
      img.onerror = function () { img.onerror = null; img.src = 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg'; };
    } else {
      getPoster(v).then(function (p) { if (p) img.src = p; });
    }
    container.appendChild(img);

    // Capa oscura + botón play
    var overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center';
    overlay.innerHTML =
      '<span class="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/90 text-on-primary flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">' +
      '<span class="material-symbols-outlined text-4xl md:text-5xl" style="font-variation-settings: \'FILL\' 1;">play_arrow</span>' +
      '</span>';
    container.appendChild(overlay);

    // Caption
    if (opts.title || opts.subtitle) {
      var cap = document.createElement('div');
      cap.className = 'absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none';
      cap.innerHTML =
        (opts.title ? '<p class="font-headline-md text-headline-md text-white">' + esc(opts.title) + '</p>' : '') +
        (opts.subtitle ? '<p class="font-body-md text-body-md text-tertiary">' + esc(opts.subtitle) + '</p>' : '');
      container.appendChild(cap);
    }

    function play() {
      var iframe = document.createElement('iframe');
      iframe.src = v.embed;
      iframe.title = opts.title || 'Video';
      iframe.className = 'w-full aspect-video';
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', '');
      container.innerHTML = '';
      container.classList.remove('cursor-pointer', 'group');
      container.appendChild(iframe);
    }
    container.addEventListener('click', play);
    container.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Renderitza el grid d'artistes com una masonry editorial (mateix disseny a
     inici i a artistes.html). Les alçades varien segons l'orientació real de
     cada foto -> graella irregular però equilibrada, vàlida per a qualsevol
     nombre d'artistes. Si l'API falla, cau al JSON local. */
  function renderGrid(grid) {
    if (!grid) return Promise.resolve();
    return fetchArtists().then(function (list) {
      if (!Array.isArray(list) || list.length === 0) return;
      return Promise.all(list.map(function (a) {
        return measureOrientation(a.imageUrl).then(function (orientation) {
          return { artist: a, orientation: orientation };
        });
      })).then(function (items) {
        // Masonry responsiva: les classes multi-columna ja venen al contenidor
        // HTML (columns-1 sm:columns-2 lg:columns-3). Només netegem l'style
        // inline antic (si en quedés) i el contingut de demostració.
        grid.removeAttribute('style');
        grid.innerHTML = '';
        items.forEach(function (item, i) {
        var a = item.artist;
        // Alçada segons orientació real -> ritme irregular natural.
        var aspect = item.orientation === 'portrait' ? 'aspect-[3/4]' : (item.orientation === 'square' ? 'aspect-square' : 'aspect-[4/3]');
        // Cada 4 cards en destaquem una amb tipografia display per trencar la malla.
        var feature = (i % 4 === 0);
        var nameCls = feature
          ? 'font-display-lg text-primary text-2xl sm:text-3xl md:text-4xl mb-1 leading-none'
          : 'font-headline-xl text-primary text-xl sm:text-2xl md:text-3xl mb-0 leading-tight';
        var delay = ['', 'delay-100', 'delay-200', 'delay-300', 'delay-400'][i % 5];
        var media = a.imageUrl
          ? '<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" decoding="async" src="' + esc(a.imageUrl) + '" alt="' + esc(a.name) + '"/>'
          : '<div class="w-full h-full bg-gradient-to-br from-secondary-container to-surface-container flex items-center justify-center"><span class="material-symbols-outlined text-6xl text-primary/40">music_note</span></div>';
        var videoBadge = a.videoUrl
          ? '<div class="absolute inset-0 flex items-center justify-center pointer-events-none"><span class="w-14 h-14 md:w-20 md:h-20 rounded-full bg-primary/90 text-on-primary flex items-center justify-center shadow-2xl"><span class="material-symbols-outlined text-2xl md:text-4xl" style="font-variation-settings: \'FILL\' 1;">play_arrow</span></span></div>'
          : '';
        var card = document.createElement('div');
        card.className = 'mb-5 md:mb-6 break-inside-avoid group cursor-pointer framer-reveal ' + delay + ' framer-hover-scale';
        card.addEventListener('click', function () { location.href = 'artist-detail.html?id=' + encodeURIComponent(a.id); });
        card.innerHTML =
          '<div class="relative overflow-hidden rounded-3xl ' + aspect + ' bg-surface-container">' +
            media +
            videoBadge +
            '<div class="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent opacity-70"></div>' +
            '<div class="absolute bottom-5 left-5 md:bottom-7 md:left-7 right-5">' +
              '<h3 class="' + nameCls + '">' + esc(a.name) + '</h3>' +
              (a.genre ? '<p class=\"font-label-sm text-on-surface-variant truncate max-w-full whitespace-nowrap overflow-hidden leading-none\">' + esc(a.genre) + '</p>' : '') +
            '</div>' +
          '</div>';
        grid.appendChild(card);
        requestAnimationFrame(function () { requestAnimationFrame(function () { card.classList.add('framer-visible'); }); });
        });
      });
    }).catch(function () {});
  }

  // Expone la API mínima al resto de páginas
  window.EseyasaSite = {
    API_BASE: API_BASE,
    getArtists: function () { return fetchArtists(); },
    getArtist: function (id) {
      return apiGet('/api/artists/' + encodeURIComponent(id)).catch(function () {
        return loadLocalArtists().then(function (list) {
          var match = Array.isArray(list) ? list.find(function (a) { return String(a.id) === String(id); }) : null;
          if (!match) throw new Error('Not found');
          return match;
        });
      });
    },
    parseVideo: parseVideo,
    mountVideoFacade: mountVideoFacade,
    renderGrid: renderGrid,
    esc: esc,
  };
})();
