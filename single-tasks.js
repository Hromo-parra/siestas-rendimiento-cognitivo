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

// Cada tarea presenta sus instrucciones en una pantalla independiente. Así, el
// texto explicativo desaparece antes de que comience la medición cognitiva.
function showInstructions(container, { signal, eyebrow, title, content }) {
  check(signal);
  container.innerHTML = `<section class="task-instructions"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${content}<div class="form-actions centered"><button type="button" class="button primary task-start">Estoy listo/a: comenzar</button></div></section>`;
  const button = container.querySelector('.task-start');
  button.focus();
  return new Promise((resolve, reject) => {
    const start = () => { cleanup(); resolve(); };
    const abort = () => { cleanup(); reject(new DOMException('Actividad interrumpida', 'AbortError')); };
    function cleanup() {
      button.removeEventListener('click', start);
      signal.removeEventListener('abort', abort);
    }
    button.addEventListener('click', start, { once: true });
    signal.addEventListener('abort', abort, { once: true });
  });
}

export async function attention(container, { signal, demo, onTrial }) {
  const count = demo ? 3 : 20;
  const trials = [];
  await showInstructions(container, {
    signal,
    eyebrow: 'Instrucciones · Atención sostenida',
    title: 'Responde únicamente cuando aparezca el círculo',
    content: '<p>Mientras veas el signo +, espera sin responder. Cuando aparezca el círculo, pulsa la barra espaciadora o toca el recuadro lo más rápido posible.</p><p>No anticipes la respuesta. Después de comenzar, estas instrucciones desaparecerán.</p>'
  });
  check(signal);
  container.innerHTML = `<button type="button" class="stimulus pvt" aria-label="Responder al círculo">+</button><p class="task-progress" aria-live="polite"></p>`;
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
  await showInstructions(container, {
    signal,
    eyebrow: 'Instrucciones · Memoria de trabajo',
    title: 'Compara cada símbolo con el de dos posiciones atrás',
    content: '<p>Pulsa “Coincide” o la barra espaciadora solamente cuando el símbolo actual sea igual al que apareció dos posiciones antes.</p><p>En las dos primeras posiciones sólo observa. Después de comenzar, estas instrucciones desaparecerán.</p>'
  });
  check(signal);
  container.innerHTML = '<div class="stimulus nback" aria-label="Símbolo actual">+</div><button type="button" class="button primary nback-button">Coincide</button><p class="task-progress" aria-live="polite"></p>';
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
