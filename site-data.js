/* =============================================================================
   Eseyasa — capa de datos del sitio público
   Conecta las páginas estáticas con la API del dashboard (Next.js) y construye
   un reproductor de vídeo "facade": muestra solo la portada (lazy) y carga el
   iframe pesado de YouTube/Vimeo únicamente al hacer click. Optimiza peso y LCP.
   ============================================================================= */
(function () {
  'use strict';

  // --- Base de la API del dashboard -----------------------------------------
  // En local apunta al dev server; en producción, al dominio del dashboard.
  // ⚠️ Cambia PROD_API por tu dominio real del dashboard si no es este.
  var LOCAL_API = 'http://localhost:3001';
  var PROD_API = 'https://eseyasa-dashboard.vercel.app';
  var isLocal = ['localhost', '127.0.0.1', ''].indexOf(location.hostname) !== -1;
  var API_BASE = isLocal ? LOCAL_API : PROD_API;

  function apiGet(path) {
    return fetch(API_BASE + path, { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
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
        id: m[1],
        embed: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0',
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
    container.setAttribute('aria-label', 'Reproduir vídeo' + (opts.title ? ': ' + opts.title : ''));

    // Portada (lazy, sin reservar peso hasta que entra en viewport)
    var img = document.createElement('img');
    img.alt = opts.title ? ('Portada del vídeo: ' + opts.title) : 'Portada del vídeo';
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
      iframe.title = opts.title || 'Vídeo';
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

  // Expone la API mínima al resto de páginas
  window.EseyasaSite = {
    API_BASE: API_BASE,
    getArtists: function () { return apiGet('/api/artists'); },
    getArtist: function (id) { return apiGet('/api/artists/' + encodeURIComponent(id)); },
    parseVideo: parseVideo,
    mountVideoFacade: mountVideoFacade,
    esc: esc,
  };
})();
