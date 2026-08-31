import { buildNBackSequence, summarizeNBack, summarizePVT } from './protocol.js';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function runPVT(container, context, saveTrial) {
  const trials = [];
  container.innerHTML = `<section class="task-stage"><p class="eyebrow">Atención sostenida · 20 ensayos</p><h1>Responde cuando aparezca el círculo</h1><p>No anticipes. Pulsa el círculo o la barra espaciadora tan pronto cambie la pantalla.</p><div class="stimulus pvt" tabindex="0"><span>Prepárate</span></div><p class="task-progress">0 / 20</p></section>`;
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
  container.innerHTML = `<section class="task-stage"><p class="eyebrow">Memoria de trabajo · 2-back</p><h1>¿Coincide con dos posiciones atrás?</h1><p>Pulsa “Coincide” o la barra espaciadora solo cuando corresponda.</p><div class="stimulus nback" tabindex="0">+</div><button class="button primary nback-button" type="button">Coincide</button><p class="task-progress">0 / 36</p></section>`;
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

