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
    if (preview && url && !preview.getAttribute('src')) preview.src = url;
    if (preview) {
      cell.addEventListener('mouseenter', function () {
        var p = preview.play();
        if (p && p.catch) p.catch(function () {});
      });
      cell.addEventListener('mouseleave', function () {
        preview.pause();
        preview.currentTime = 0;
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
