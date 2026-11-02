const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(__dirname + '/../index.html', 'utf8').match(/<script id="scroll-landing-script">([\s\S]*?)<\/script>/)[1];

function setup({reducedMotion = false} = {}) {
  const events = () => ({listeners: {}, addEventListener(n, f) {(this.listeners[n] ||= []).push(f);}, emit(n) {(this.listeners[n] || []).forEach(f => f());}});
  const window = events(), document = events(), reduced = Object.assign(events(), {matches: reducedMotion});
  const button = events(), cue = {}, styles = {}, rafs = new Map(), timers = new Map(), plays = [];
  let serial = 0, current = 0, top = 0;
  const seeks = [];
  const film = Object.assign(events(), {
    duration: 15, readyState: 1, seeking: false, error: null, dataset: {desktopSrc: 'film.mp4'},
    setAttribute() {}, hasAttribute(n) {return !!this[n];},
    loadCount: 0, pauseCount: 0,
    load() {this.loadCount++; this.seeking = false; current = 0; this.readyState = 0;},
    pause() {this.pauseCount++;},
    play() {return new Promise((resolve, reject) => plays.push({resolve, reject}));}
  });
  Object.defineProperty(film, 'currentTime', {get: () => current, set: t => {current = t; seeks.push(t); film.seeking = true;}});
  const hero = {offsetHeight: 100, appendChild() {}};
  const section = {offsetHeight: 500, querySelector: s => s === '.hero' ? hero : cue,
    getBoundingClientRect: () => ({top}), classList: {toggle() {}}, style: {setProperty: (k,v) => styles[k] = v}};
  document.hidden = false;
  document.getElementById = id => id === 'scrollFilm' ? film : section;
  document.createElement = () => button;
  window.matchMedia = () => reduced;
  vm.runInNewContext(source, {window, document, Number, Math,
    requestAnimationFrame: f => {const id = ++serial; rafs.set(id,f); return id;},
    cancelAnimationFrame: id => rafs.delete(id),
    setTimeout: f => {const id = ++serial; timers.set(id,f); return id;}, clearTimeout: id => timers.delete(id)});
  const frame = () => {const jobs = [...rafs.values()]; rafs.clear(); jobs.forEach(f => f());};
  const timeout = () => {const jobs = [...timers.values()]; timers.clear(); jobs.forEach(f => f());};
  const scroll = p => {top = -400 * p; window.emit('scroll'); frame();};
  const hide = () => {document.hidden = true; document.emit('visibilitychange');};
  const show = () => {document.hidden = false; document.emit('visibilitychange');};
  const settle = async n => {plays[n].resolve(); await Promise.resolve(); frame();};
  const seeked = () => {film.seeking = false; film.emit('seeked'); frame();};
  return {film, window, document, reduced, button, plays, seeks, timers, rafs, styles, frame, timeout, scroll, hide, show, settle, seeked};
}

test('tab return replaces pending startup and ignores its late completion', async () => {
  const h = setup(); h.film.emit('loadedmetadata');
  h.scroll(.2); h.hide(); assert.equal(h.timers.size, 0); assert.equal(h.rafs.size, 0);
  h.show(); assert.equal(h.plays.length, 2);
  const pauses = h.film.pauseCount;
  await h.settle(0); assert.equal(h.film.pauseCount, pauses); assert.equal(h.seeks.length, 0);
  await h.settle(1); assert.equal(h.seeks.at(-1), 3);
  h.seeked(); h.scroll(.8); assert.equal(h.seeks.at(-1), 12);
});
test('coalesces scroll during a seek to the latest target, including reverse', () => {
  const h = setup(); h.scroll(.2); h.scroll(.4); h.scroll(.8);
  assert.deepEqual(h.seeks, [3]); h.seeked(); assert.deepEqual(h.seeks, [3,12]);
  h.scroll(.1); h.seeked(); assert.equal(h.seeks.at(-1), 1.5);
  h.seeked(); h.scroll(.1); assert.equal(h.seeks.length, 3);
});
test('stuck seek after tab return reloads once then resumes at current scroll', async () => {
  const h = setup(); h.scroll(.5); h.hide(); h.show(); await h.settle(0);
  h.timeout(); assert.equal(h.film.loadCount, 1);
  h.film.readyState = 1; h.film.emit('loadedmetadata'); await h.settle(1);
  assert.equal(h.seeks.at(-1), 7.5); h.seeked(); h.scroll(.7); assert.equal(h.seeks.at(-1), 10.5);
});
test('never-resolving playback is bounded and exposes manual retry', () => {
  const h = setup(); h.film.emit('loadedmetadata'); h.timeout(); assert.equal(h.film.loadCount, 1);
  h.film.readyState = 1; h.film.emit('loadedmetadata'); h.timeout();
  assert.equal(h.film.loadCount, 1); assert.equal(h.button.hidden, false); assert.equal(h.timers.size, 0);
  h.button.emit('click'); assert.equal(h.plays.length, 3);
});
test('gesture retry remains available after multiple tab switches and rejected play', async () => {
  const h = setup(); h.film.emit('loadedmetadata'); await h.settle(0);
  h.hide(); h.show(); h.plays[1].reject(new Error('blocked')); await Promise.resolve();
  assert.equal(h.button.hidden, false); h.window.emit('wheel'); await h.settle(2);
  h.hide(); h.show(); h.plays[3].reject(new Error('blocked')); await Promise.resolve();
  h.window.emit('touchstart'); await h.settle(4); assert.equal(h.button.hidden, true);
});
test('page cache restore resumes and hidden scrolling does no work', async () => {
  const h = setup(); h.film.emit('loadedmetadata'); await h.settle(0);
  h.hide(); h.scroll(.6); assert.equal(h.rafs.size, 0); assert.equal(h.seeks.length, 0);
  h.document.hidden = false; h.window.emit('pageshow'); await h.settle(1);
  assert.equal(h.seeks.at(-1), 9);
});
test('reduced motion avoids source download until explicit opt-in', () => {
  const h = setup({reducedMotion:true}); assert.equal(h.film.src, undefined);
  h.show(); h.window.emit('wheel'); assert.equal(h.plays.length, 0);
  h.button.emit('click'); assert.equal(h.film.src, 'film.mp4'); assert.equal(h.plays.length, 1);
});
test('changing reduced motion cancels pending work and resets progress', () => {
  const h = setup(); h.scroll(.5); h.reduced.matches = true; h.reduced.emit('change');
  assert.equal(h.rafs.size, 0); assert.equal(h.timers.size, 0); assert.equal(h.styles['--film-progress'], 0);
});
