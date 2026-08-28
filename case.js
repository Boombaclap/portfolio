/* Shared behaviour for the case-study pages (shotoniphone.html,
   spatial.html): scroll reveals plus the lightbox. The home page runs
   its own script because it also drives the hero reel and timecode. */
(function () {
  // ---- Reveal on scroll -------------------------------------------------
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08 });

  // The header is above the fold on load, so it plays on a timer rather
  // than waiting for a scroll that may never come.
  document.querySelectorAll('.case-head .reveal').forEach(function (el, i) {
    setTimeout(function () { el.classList.add('in'); }, 150 + i * 180);
  });

  // Gallery tiles stagger by column so a row doesn't blink on as one block.
  var tileIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var siblings = e.target.parentNode.children;
      var idx = Array.prototype.indexOf.call(siblings, e.target);
      setTimeout(function () { e.target.classList.add('in'); }, (idx % 4) * 90);
      tileIO.unobserve(e.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.gallery-grid .reveal').forEach(function (el) { tileIO.observe(el); });

  document.querySelectorAll('.reveal:not(.case-head .reveal):not(.gallery-grid .reveal)')
    .forEach(function (el) { io.observe(el); });

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Hero upgrade -----------------------------------------------------
  // The markup ships a GIF, which paints straight away. If the h.264/VP9
  // versions are actually there, we load one off-screen and only swap it
  // in once it can play — so a missing or broken video file leaves the
  // GIF in place rather than a blank band. Reduced motion keeps the GIF,
  // which the browser can pause and the visitor can't be surprised by.
  document.querySelectorAll('.case-hero img[data-video-mp4]').forEach(function (img) {
    if (reduceMotion) return;
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.preload = 'auto';
    if (img.alt) v.setAttribute('aria-label', img.alt);

    ['webm', 'mp4'].forEach(function (kind) {
      var url = img.dataset['video' + kind.charAt(0).toUpperCase() + kind.slice(1)];
      if (!url) return;
      var s = document.createElement('source');
      s.src = url;
      s.type = kind === 'webm' ? 'video/webm' : 'video/mp4';
      v.appendChild(s);
    });

    // canplay is the signal that a source decoded — not just that a
    // request succeeded. Only then is it safe to drop the GIF.
    v.addEventListener('canplay', function () {
      if (!img.parentNode) return;
      img.parentNode.replaceChild(v, img);
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }, { once: true });

    v.load();
  });

  // ---- Lightbox ---------------------------------------------------------
  var lb       = document.getElementById('lightbox');
  var lbVideo  = document.getElementById('lbVideo');
  var lbTitle  = document.getElementById('lbTitle');
  var lbClient = document.getElementById('lbClient');
  var lbClose  = document.getElementById('lbClose');
  if (!lb) return;

  var lastFocused = null;

  // Self-hosted clips are addressed as data-file="greece.mp4" against the
  // data-media-base on their .gallery-grid, so moving buckets is a
  // one-line change rather than an edit per tile.
  function fileUrl(cell) {
    if (!cell.dataset.file) return '';
    var grid = cell.closest('.gallery-grid');
    var base = (grid && grid.dataset.mediaBase) || '';
    if (base && base.slice(-1) !== '/') base += '/';
    return base + cell.dataset.file;
  }

  function openLightbox(cell) {
    var img      = cell.dataset.image;
    var vid      = cell.dataset.video;
    var yt       = cell.dataset.youtube;
    var src      = fileUrl(cell);
    var portrait = cell.dataset.orientation === 'portrait';
    lbTitle.textContent  = cell.dataset.title || '';
    lbClient.textContent = cell.dataset.client || '';

    lbVideo.className = '';
    lbVideo.innerHTML = '';

    if (img) {
      // Stills don't want the fixed 16:9 padding box — drop it so the
      // frame sizes to the image instead of letterboxing a tall crop.
      lbVideo.className = 'lightbox-stage';
      var el = document.createElement('img');
      el.src = img;
      el.alt = cell.dataset.title || 'Enlarged still';
      lbVideo.appendChild(el);
    } else if (src) {
      // Native player for self-hosted files. If the clip won't load —
      // wrong codec, CORS, bad URL — say so rather than leaving a
      // silent black frame.
      lbVideo.className = 'lightbox-video' + (portrait ? ' portrait' : '');
      var v = document.createElement('video');
      v.src = src;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.setAttribute('controlsList', 'nodownload');
      v.addEventListener('error', function () {
        lbVideo.innerHTML = '<div class="lightbox-no-video">' +
          '<span>This video can\'t be loaded</span>' +
          '<a href="' + src + '" target="_blank" rel="noopener noreferrer" ' +
          'style="font-size:9px;opacity:0.6;color:var(--accent);text-decoration:underline">' +
          'Open file directly</a></div>';
      });
      lbVideo.appendChild(v);
      var attempt = v.play();
      if (attempt && attempt.catch) attempt.catch(function () {});
    } else if (vid) {
      lbVideo.className = 'lightbox-video' + (portrait ? ' portrait' : '');
      lbVideo.innerHTML = '<iframe src="https://player.vimeo.com/video/' + vid +
        '?autoplay=1&color=c8a96e&title=0&byline=0&portrait=0" ' +
        'allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    } else if (yt) {
      // nocookie domain + rel=0 keeps the end screen from serving up
      // unrelated suggested videos over your work.
      lbVideo.className = 'lightbox-video' + (portrait ? ' portrait' : '');
      lbVideo.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + yt +
        '?autoplay=1&rel=0&modestbranding=1&playsinline=1" ' +
        'allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    } else {
      lbVideo.className = 'lightbox-video';
      lbVideo.innerHTML = '<div class="lightbox-no-video"><span>Asset coming soon</span></div>';
    }

    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lb.classList.remove('open');
    // Pause before detaching — some browsers keep audio running for a
    // beat if you only wipe innerHTML out from under a playing file.
    var playing = lbVideo.querySelector('video');
    if (playing) { playing.pause(); playing.removeAttribute('src'); playing.load(); }
    lbVideo.innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocused) { lastFocused.focus(); lastFocused = null; }
  }

  document.querySelectorAll('.gallery-cell').forEach(function (cell) {
    // Point any inline preview <video> at the resolved file, and let it
    // play muted while hovered. preload="metadata" means the tile paints
    // a frame without pulling the whole clip down on page load.
    var preview = cell.querySelector('video');
    var url = fileUrl(cell);
    // The #t=0.1 fragment is what makes the tile show a frame instead of
    // a black box: preload="metadata" fetches the header, but most
    // browsers won't paint anything until the video seeks somewhere.
    if (preview && url && !preview.getAttribute('src')) {
      preview.src = url + '#t=0.1';
      // Safari sometimes needs the seek asked for explicitly.
      preview.addEventListener('loadedmetadata', function () {
        if (preview.currentTime < 0.05) {
          try { preview.currentTime = 0.1; } catch (err) {}
        }
      }, { once: true });
    }
    if (preview) {
      cell.addEventListener('mouseenter', function () {
        var p = preview.play();
        if (p && p.catch) p.catch(function () {});
      });
      cell.addEventListener('mouseleave', function () {
        preview.pause();
        preview.currentTime = 0.1;
      });
    }

    cell.addEventListener('click', function () {
      lastFocused = cell;
      openLightbox(cell);
    });
  });

  lbClose.addEventListener('click', closeLightbox);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
})();
