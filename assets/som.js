/* Efeitos sonoros sutis, sintetizados com Web Audio (sem arquivos).
   Desligados por padrão; o botão .sound liga/desliga e a escolha fica salva. */
(() => {
  const btn = document.querySelector('.sound');
  if (!btn || !(window.AudioContext || window.webkitAudioContext)) { btn && btn.remove(); return; }
  let ctx = null, master = null, on = false;
  try { on = localStorage.getItem('fresa-som') === '1'; } catch (e) {}

  const ensure = () => {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = .9;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
      master.connect(lp).connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  // nota curta com ataque suave e cauda exponencial
  const tone = (freq, { dur = .18, type = 'sine', gain = .04, when = 0, glide = 0 } = {}) => {
    if (!on) return;
    const c = ensure(), t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(freq * glide, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + .008);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + .05);
  };

  const sfx = {
    hover: () => tone(1760, { dur: .06, gain: .012, glide: 1.04 }),
    click: () => { tone(660, { dur: .14, gain: .045, type: 'triangle' }); tone(990, { dur: .22, gain: .03, when: .045 }); },
    copy: () => [784, 988, 1175].forEach((f, i) => tone(f, { dur: .32, gain: .035, when: i * .07, type: 'triangle' })),
    reveal: () => [523, 659, 784, 988, 1319].forEach((f, i) => tone(f, { dur: 1.1, gain: .028, when: i * .11, type: 'sine' })),
    tick: () => tone(1320, { dur: .05, gain: .01 })
  };
  window.fresaSom = sfx;

  const render = () => {
    btn.setAttribute('aria-pressed', on);
    btn.setAttribute('aria-label', on ? 'Desligar sons' : 'Ligar sons');
    btn.classList.toggle('is-on', on);
  };
  render();

  btn.addEventListener('click', () => {
    on = !on;
    try { localStorage.setItem('fresa-som', on ? '1' : '0'); } catch (e) {}
    render();
    if (on) { ensure(); sfx.click(); }
  });

  // interações
  let last = 0;
  document.querySelectorAll('a, button:not(.sound), .frame, .card').forEach(el => {
    el.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse') return;
      const now = performance.now(); if (now - last < 70) return; last = now;
      sfx.hover();
    });
  });
  document.querySelectorAll('a, button:not(.sound):not(.sw)').forEach(el => el.addEventListener('click', () => sfx.click()));
  document.querySelectorAll('.sw').forEach(el => el.addEventListener('click', () => sfx.copy()));
})();
