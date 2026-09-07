import { buildNBackSequence, summarizeNBack, summarizePVT } from './protocol.js';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Las instrucciones se muestran antes de cada tarea y se retiran por completo
// durante la medición para no añadir texto competidor en la pantalla.
function showInstructions(container, { eyebrow, title, content }) {
  container.innerHTML = `<section class="form-card compact centered task-instructions"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${content}<button type="button" class="button primary task-start">Estoy listo/a: comenzar</button></section>`;
  const button = container.querySelector('.task-start');
  button.focus();
  return new Promise(resolve => button.addEventListener('click', resolve, { once: true }));
}

export async function runPVT(container, context, saveTrial) {
  const trials = [];
  await showInstructions(container, {
    eyebrow: 'Instrucciones · Atención sostenida',
    title: 'Responde únicamente cuando aparezca el círculo',
    content: '<p>Mientras veas el signo +, espera sin responder. Cuando aparezca el círculo, pulsa la barra espaciadora o toca el recuadro lo más rápido posible.</p><p>No anticipes la respuesta. Al comenzar, estas instrucciones desaparecerán.</p>'
  });
  container.innerHTML = `<section class="task-stage"><div class="stimulus pvt" tabindex="0" aria-label="Responder al círculo"><span>+</span></div><p class="task-progress" aria-live="polite">0 / 20</p></section>`;
  const target = container.querySelector('.stimulus');
  target.focus();
  for (let index = 0; index < 20; index += 1) {
    target.className = 'stimulus pvt waiting';
    target.innerHTML = '<span>+</span>';
    let shown = false;
    let responded = false;
    let resolveResponse;
    const response = new Promise(resolve => { resolveResponse = resolve; });
    const handler = event => {
      if (event.type === 'keydown' && event.code !== 'Space') return;
      event.preventDefault();
      if (responded) return;
      responded = true;
      resolveResponse({ false_start: !shown, rt_ms: shown ? Math.round(performance.now() - onset) : null });
    };
    document.addEventListener('keydown', handler);
    target.addEventListener('pointerdown', handler);
    const delay = 700 + Math.random() * 1100;
    const timer = setTimeout(() => {
      if (!responded) {
        shown = true;
        target.className = 'stimulus pvt go';
        target.innerHTML = '<span></span>';
        onset = performance.now();
        setTimeout(() => { if (!responded) { responded = true; resolveResponse({ false_start: false, rt_ms: 1000, timeout: true }); } }, 1000);
      }
    }, delay);
    let onset = 0;
    const result = await response;
    clearTimeout(timer);
    document.removeEventListener('keydown', handler);
    target.removeEventListener('pointerdown', handler);
    const trial = { row_id: crypto.randomUUID(), ...context, task: 'pvt', trial_index: index, recorded_at: new Date().toISOString(), ...result };
    trials.push(trial); await saveTrial(trial);
    container.querySelector('.task-progress').textContent = `${index + 1} / 20`;
    target.className = 'stimulus pvt feedback'; target.innerHTML = `<span>${result.false_start ? 'Anticipación' : `${result.rt_ms} ms`}</span>`;
    await wait(250);
  }
  return summarizePVT(trials);
}

export async function runNBack(container, context, saveTrial) {
  const plan = buildNBackSequence(`${context.participant_id}-${context.condition}-${context.phase}`, 36);
  const trials = [];
  await showInstructions(container, {
    eyebrow: 'Instrucciones · Memoria de trabajo',
    title: 'Compara cada símbolo con el de dos posiciones atrás',
    content: '<p>Pulsa “Coincide” o la barra espaciadora solamente cuando el símbolo actual sea igual al que apareció dos posiciones antes.</p><p>En las dos primeras posiciones sólo observa. Al comenzar, estas instrucciones desaparecerán.</p>'
  });
  container.innerHTML = `<section class="task-stage"><div class="stimulus nback" tabindex="0" aria-label="Símbolo actual">+</div><button class="button primary nback-button" type="button">Coincide</button><p class="task-progress" aria-live="polite">0 / 36</p></section>`;
  const stimulus = container.querySelector('.stimulus');
  const button = container.querySelector('.nback-button');
  stimulus.focus();
  for (const item of plan) {
    let response = false; let rt = null; const onset = performance.now();
    stimulus.textContent = item.stimulus;
    const handler = event => { if (event.type === 'keydown' && event.code !== 'Space') return; event.preventDefault(); if (!response) { response = true; rt = Math.round(performance.now() - onset); button.classList.add('pressed'); } };
    document.addEventListener('keydown', handler); button.addEventListener('pointerdown', handler);
    await wait(750);
    document.removeEventListener('keydown', handler); button.removeEventListener('pointerdown', handler); button.classList.remove('pressed');
    const trial = { row_id: crypto.randomUUID(), ...context, task: 'nback', trial_index: item.index, stimulus: item.stimulus, target: item.target, response, rt_ms: rt, correct: item.target === response, recorded_at: new Date().toISOString() };
    trials.push(trial); await saveTrial(trial);
    stimulus.textContent = '+'; container.querySelector('.task-progress').textContent = `${item.index + 1} / 36`; await wait(180);
  }
  return summarizeNBack(trials);
}
