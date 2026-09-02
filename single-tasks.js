import { buildNBackSequence } from './protocol.js';
import { summarizeAttention, summarizeMemory } from './single-protocol.js';

function check(signal) { signal.throwIfAborted(); }
function wait(ms, signal) {
  check(signal);
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Actividad interrumpida', 'AbortError')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    signal.addEventListener('abort', abort, { once: true });
  });
}

export async function attention(container, { signal, demo, onTrial }) {
  const count = demo ? 3 : 20;
  const trials = [];
  container.innerHTML = `<h1>Atención sostenida</h1><p>Pulsa el recuadro o la barra espaciadora cuando aparezca el círculo. Espera mientras veas el signo +.</p><button type="button" class="stimulus pvt" aria-label="Responder al círculo">+</button><p class="task-progress" aria-live="polite"></p>`;
  const target = container.querySelector('.stimulus');
  target.focus();
  for (let index = 0; index < count; index++) {
    check(signal);
    target.className = 'stimulus pvt'; target.textContent = '+';
    const trial = await new Promise((resolve, reject) => {
      let onset = null, timeout;
      const finish = result => { cleanup(); resolve(result); };
      const handler = event => {
        if (event.type === 'keydown' && (event.code !== 'Space' || event.repeat)) return;
        event.preventDefault();
        finish({ false_start: onset === null, timeout: false, rt_ms: onset === null ? null : Math.round(performance.now() - onset) });
      };
      const abort = () => { cleanup(); reject(new DOMException('Actividad interrumpida', 'AbortError')); };
      const delay = setTimeout(() => {
        target.className = 'stimulus pvt go'; target.innerHTML = '<span></span>'; onset = performance.now();
        timeout = setTimeout(() => finish({ false_start: false, timeout: true, rt_ms: null }), demo ? 300 : 1000);
      }, demo ? 150 : 700 + Math.random() * 1100);
      function cleanup() {
        clearTimeout(delay); clearTimeout(timeout);
        target.removeEventListener('pointerdown', handler); document.removeEventListener('keydown', handler);
        signal.removeEventListener('abort', abort);
      }
      target.addEventListener('pointerdown', handler); document.addEventListener('keydown', handler);
      signal.addEventListener('abort', abort, { once: true });
    });
    check(signal);
    const row = { task: 'pvt', trial_index: index, recorded_at: new Date().toISOString(), ...trial };
    trials.push(row); await onTrial(row);
    container.querySelector('.task-progress').textContent = `${index + 1} / ${count}`;
    await wait(demo ? 40 : 250, signal);
  }
  return summarizeAttention(trials);
}

export async function memory(container, { signal, demo, onTrial, seed }) {
  const trials = [];
  const plan = buildNBackSequence(seed, demo ? 6 : 36);
  container.innerHTML = '<h1>Memoria de trabajo</h1><p>Pulsa “Coincide” o la barra espaciadora si el símbolo es igual al de dos posiciones atrás. En las dos primeras posiciones, observa.</p><div class="stimulus nback" aria-label="Símbolo actual">+</div><button type="button" class="button primary nback-button">Coincide</button><p class="task-progress"></p>';
  const stimulus = container.querySelector('.stimulus');
  const button = container.querySelector('.nback-button');
  button.focus();
  for (const item of plan) {
    check(signal);
    let response = false, rt = null;
    stimulus.textContent = item.stimulus;
    const onset = performance.now();
    const handler = event => {
      if (event.type === 'keydown' && (event.code !== 'Space' || event.repeat)) return;
      event.preventDefault();
      if (!response) { response = true; rt = Math.round(performance.now() - onset); button.classList.add('pressed'); }
    };
    document.addEventListener('keydown', handler); button.addEventListener('pointerdown', handler);
    try { await wait(demo ? 120 : 750, signal); }
    finally {
      document.removeEventListener('keydown', handler); button.removeEventListener('pointerdown', handler);
      button.classList.remove('pressed');
    }
    check(signal);
    const row = { task: 'nback', trial_index: item.index, stimulus: item.stimulus, target: item.target, response, rt_ms: rt, recorded_at: new Date().toISOString() };
    trials.push(row); await onTrial(row);
    stimulus.textContent = '+'; container.querySelector('.task-progress').textContent = `${item.index + 1} / ${plan.length}`;
    await wait(demo ? 30 : 180, signal);
  }
  return summarizeMemory(trials);
}
