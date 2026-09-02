import { CONSENT_VERSION, isEligible, remainingNap, summaryRow, validateSleepReport } from './single-protocol.js';
import { listSessions, saveSession } from './single-storage.js';
import { attention, memory } from './single-tasks.js';
import { downloadFile, rowsToCsv } from './csv.js';

const app = document.querySelector('#participant-app');
const consentHTML = app.innerHTML;
const stageLabels = {pre:'Evaluación previa',pre_battery:'Tareas previas',nap_ready:'Preparar siesta',nap:'Intervalo de siesta',post:'Evaluación posterior',post_battery:'Tareas posteriores',final_rating:'Valoración final',complete:'Completa',withdrawn:'Retirada'};
const now = () => new Date().toISOString();
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let session = null, consentedAt = null, demo = false, busy = false, controller, timer, taskPromise;
let pendingSave = Promise.resolve();

// Las escrituras se serializan para que el retiro no sea sobrescrito por un ensayo.
async function persist() {
  if (demo || !session) return;
  const snapshot = structuredClone(session);
  pendingSave = pendingSave.catch(() => {}).then(() => saveSession(snapshot));
  await pendingSave;
}

function error(message) { document.querySelector('#global-error').textContent = message; }
function navigation() {
  document.querySelector('#demo-banner').hidden = !demo;
  document.querySelector('#withdraw').hidden = !session || ['complete','withdrawn'].includes(session.stage);
  document.querySelector('#teacher').disabled = busy;
  document.querySelector('#resume').disabled = busy;
}
function show(html) {
  clearInterval(timer);
  error(''); app.innerHTML = html; app.focus(); navigation();
  window.scrollTo({ top: 0 });
}
function card(title, body, step = '') {
  show(`<section class="form-card"><p class="eyebrow">${step || 'Equipo 8 · Una sesión'}</p><h1>${title}</h1>${body}</section>`);
}
const action = (name, label, primary = false) => `<button type="button" class="button ${primary ? 'primary' : 'secondary'}" data-action="${name}">${label}</button>`;
function select(name, label, options, required = true) {
  return `<label class="field"><span>${label}</span><select name="${name}" ${required ? 'required' : ''}><option value="">${required ? 'Selecciona una opción' : 'Prefiero no responder'}</option>${options.map(([value,text]) => `<option value="${value}">${text}</option>`).join('')}</select></label>`;
}
function number(name, label, min = 0, required = true, step = 1) {
  return `<label class="field"><span>${label}</span><input type="number" name="${name}" min="${min}" step="${step}" ${required ? 'required' : ''}></label>`;
}
function rating(name, label, left = 'Nada', right = 'Mucho', max = 10) {
  return select(name, `${label} (0 = ${left}; ${max} = ${right})`, Array.from({length:max+1}, (_,i)=>[i,i]), false);
}
function data(form) {
  return Object.fromEntries([...new FormData(form)].map(([key,value])=>[key, value === '' ? null : value]));
}

function registration() {
  card('Registro y requisitos', `<p>Al guardar se generará un código aleatorio. No escribas datos que permitan identificarte.</p><form id="registration-form"><div class="form-grid">
    ${number('age','Edad en años',18)}
    ${select('education','Nivel de estudios',[['grado','Grado / licenciatura'],['posgrado','Posgrado']])}
    ${select('available','¿Tienes disponibilidad para la siesta en casa en el horario acordado?',[['yes','Sí'],['no','No']])}
    ${select('sleep_disorder','¿Tienes diagnóstico de un trastorno del sueño?',[['no','No'],['yes','Sí'],['unsure','No tengo certeza']])}
    ${select('substances','¿Usas habitualmente sustancias que afecten el sueño?',[['no','No'],['yes','Sí'],['unsure','Necesito aclararlo con el equipo']])}
    </div><p class="muted">La cafeína de la hora previa se registra en el siguiente paso. Si tienes dudas sobre cómo se aplica este criterio a tu consumo habitual, selecciona “Necesito aclararlo con el equipo”.</p><div class="form-actions">${action('decline','Cancelar')}<button class="button primary" type="submit">Guardar y continuar</button></div></form>`, 'Paso 1 de 5 · Registro');
}

function questionnaire(phase) {
  const pre = phase === 'pre';
  let fields;
  if (pre) fields = `${rating('nap_attitude','¿Qué tan favorable es tu opinión sobre tomar siestas?','Nada favorable','Muy favorable',4)}
    ${rating('expected_rest','¿Cuánto descanso esperas sentir después de la siesta?')}
    ${rating('expected_performance','¿Cómo esperas desempeñarte después de la siesta?','Mucho peor','Mucho mejor',4)}
    ${rating('self_performance','¿Cómo valoras tu capacidad actual para las tareas?','Muy baja','Muy alta')}
    ${select('caffeine_last_hour','¿Consumiste cafeína durante la última hora?',[['yes','Sí'],['no','No']],false)}
    ${number('sleep_hours','Horas de sueño de la noche anterior',0,false,.25)}`;
  else fields = `${select('slept','¿Dormiste durante el intervalo?',[['yes','Sí'],['no','No'],['unsure','No tengo certeza']])}
    ${number('interval_minutes','Duración real del intervalo (minutos)')}${number('sleep_minutes','Minutos de sueño estimados (0 si no dormiste)')}
    ${number('interruptions','Número de interrupciones')}${rating('guilt','¿Cuánta culpa sientes por haber tomado la siesta?')}
    ${rating('vitality','¿Cuánta vitalidad sientes ahora?')}`;
  card(pre ? 'Antes de la siesta' : 'Después de la siesta', `<p class="stage-label">Tu código: ${escape(session.id)}</p><p>Las preguntas subjetivas son exploratorias y puedes omitirlas. No hay respuestas esperadas. Las selecciones vacías se guardan como datos faltantes.</p><form id="${phase}-form"><div class="form-grid">${fields}
    ${rating('rest','¿Cuánto descanso percibes ahora?')}${rating('sleepiness','¿Cuánta somnolencia sientes ahora?','Ninguna','Extrema')}
    </div><p class="error" id="form-error" role="alert"></p><div class="form-actions"><button class="button primary" type="submit">Continuar a las tareas</button></div></form>`, pre ? 'Paso 2 de 5 · Evaluación previa' : 'Paso 4 de 5 · Evaluación posterior');
  if (!pre) app.querySelector('[name="interval_minutes"]').value = Math.max(0, Math.round((Date.now()-Date.parse(session.interval_started_at))/60000));
}

function batteryIntro(phase) {
  card('Tareas de atención y memoria', `<p>Completarás una tarea de atención de 20 ensayos y una tarea de memoria 2-back de 36 estímulos. En 2-back, responde únicamente si el símbolo coincide con el presentado dos posiciones antes.</p><p>Usa el mismo dispositivo en ambas evaluaciones. Puedes retirarte en cualquier momento. Si interrumpes una tarea, al retomar comenzarás un intento nuevo y el intento anterior quedará identificado como incompleto.</p>${demo ? '<p>En la demostración las tareas tienen menos ensayos.</p>' : ''}${action('battery','Comenzar tareas',true)}`, `Evaluación ${phase === 'pre' ? 'previa' : 'posterior'}`);
}

async function runBattery() {
  if (busy) return;
  const phase = session.stage === 'pre_battery' ? 'pre' : 'post';
  busy = true; controller = new AbortController();
  const signal = controller.signal;
  const attempt = { phase, id: crypto.randomUUID(), status:'running', trials:[], started_at:now() };
  session.attempts.push(attempt); await persist();
  show('<section class="form-card"><div id="task" class="task-stage"></div></section>');
  const container = document.querySelector('#task');
  try {
    const options = { signal, demo, onTrial: async trial => { attempt.trials.push(trial); await persist(); } };
    const pvt = await attention(container, options);
    signal.throwIfAborted();
    const nback = await memory(container, {...options, seed:`${session.id}-${phase}`});
    signal.throwIfAborted();
    attempt.status = 'complete'; attempt.completed_at = now();
    session.summaries[phase] = {pvt,nback};
    session.stage = phase === 'pre' ? 'nap_ready' : 'final_rating';
    await persist(); busy = false; renderStage();
  } catch (failure) {
    attempt.status = 'interrupted'; session.interrupted_attempts++;
    busy = false; navigation(); await persist();
    if (failure.name !== 'AbortError') throw failure;
  }
}

function nap() {
  const started = Boolean(session.interval_started_at);
  card('Siesta de 25 minutos', `<p>Tu código: <strong>${escape(session.id)}</strong>. Si cierras la página, usa “Retomar sesión” en este mismo navegador.</p><p>Programa una alarma propia para 25 minutos. El contador de la página no emite sonido y puede dejar de actualizarse si el dispositivo se suspende.</p><p>No lograr dormir no es un fallo; registra lo que ocurra.</p>${started ? '<p class="timer" id="remaining" role="timer"></p><p id="nap-status"></p>'+action('post','Continuar a la evaluación posterior',true) : action('start-nap','Ya preparé mi alarma: iniciar intervalo',true)}${demo && started ? '<div class="actions-wrap">'+action('demo-skip','Simular que pasaron 25 minutos')+'</div>' : ''}`, 'Paso 3 de 5 · Siesta en casa');
  if (started) {
    const update = () => {
      const left = remainingNap(session.interval_started_at);
      const seconds = Math.ceil(left / 1000);
      document.querySelector('#remaining').textContent = `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
      app.querySelector('[data-action="post"]').disabled = left > 0;
      document.querySelector('#nap-status').textContent = left > 0 ? 'La evaluación posterior se habilitará al terminar el intervalo. Puedes retirarte antes si lo necesitas.' : 'El intervalo terminó. Puedes continuar aunque no hayas dormido.';
    };
    update(); timer = setInterval(update,1000);
  }
}

function finalRating() {
  card('Tu valoración de las tareas', `<form id="final-form">${rating('self_performance','¿Cómo valoras tu desempeño en las tareas que acabas de realizar?','Muy bajo','Muy alto')}<div class="form-actions"><button type="submit" class="button primary">Terminar sesión</button></div></form>`, 'Paso 5 de 5 · Cierre');
}

function completed() {
  card('Sesión terminada', `<p>Completaste las evaluaciones previa y posterior a la siesta. Tu código es <strong>${escape(session.id)}</strong>.</p><p>${demo ? 'Esta demostración no guardó registros de investigación.' : 'Las respuestas permanecen en este navegador. No se ha enviado información al equipo de forma automática.'}</p><p>Estos resultados son exploratorios; no constituyen una evaluación clínica ni demuestran que la siesta cause un cambio cognitivo.</p><div class="actions-wrap">${action('export-own','Descargar mis datos') }<a class="button secondary" href="estudio.html">Volver a la información</a></div>`);
}
function renderStage() {
  if (session.stage === 'pre' || session.stage === 'post') questionnaire(session.stage);
  else if (session.stage.endsWith('_battery')) batteryIntro(session.stage.startsWith('pre')?'pre':'post');
  else if (['nap_ready','nap'].includes(session.stage)) nap();
  else if (session.stage === 'final_rating') finalRating();
  else if (session.stage === 'complete') completed();
  else card('Participación retirada','<p>Esta sesión se detuvo. Los datos guardados permanecen marcados como retirados.</p><a href="estudio.html">Volver a la información</a>');
}

async function resume() {
  const sessions = await listSessions();
  card('Retomar una sesión', `<p>Solo se muestran registros guardados en este navegador. Usa tu código; no selecciones el de otra persona.</p>${sessions.length ? '<div class="actions-wrap">'+sessions.map(s=>`<button type="button" class="button secondary" data-session="${escape(s.id)}">${escape(s.id)} · ${escape(stageLabels[s.stage] || s.stage)}</button>`).join('')+'</div>' : '<p>No hay registros locales.</p>'}<div class="actions-wrap">${action('consent','Volver al consentimiento')}</div>`);
}
async function teacher() {
  const sessions = await listSessions();
  card('Modo docente', `<p>Registros de una sola siesta guardados en este navegador. Este panel no recibe respuestas de otros dispositivos y no tiene autenticación.</p><div class="callout pending"><strong>Antes de usar datos reales</strong><p>Revisar el consentimiento, completar el contacto y la custodia de datos, confirmar criterios e instrumentos y resolver la aprobación institucional. El consentimiento creado aquí es una versión para revisión.</p></div><div class="actions-wrap">${action('demo','Probar con datos ficticios',true)}${action('export-all','Exportar respaldo JSON')}${action('export-summary','Exportar resumen CSV')}${action('export-trials','Exportar ensayos CSV')}</div><p>${sessions.length} registros locales; ${sessions.filter(s=>s.stage==='complete').length} completos.</p><div class="table-wrap"><table><thead><tr><th>Código</th><th>Estado</th><th>Versión del consentimiento</th></tr></thead><tbody>${sessions.map(s=>`<tr><td>${escape(s.id)}</td><td>${escape(stageLabels[s.stage] || s.stage)}</td><td>${escape(s.consent_version)}</td></tr>`).join('')}</tbody></table></div><p>Conservar sesiones retiradas, intentos incompletos y omisiones al evaluar la calidad de los datos. Las asociaciones y cambios pre–post no justifican inferencia causal.</p><div class="actions-wrap">${action('consent','Volver al consentimiento')}</div>`);
}

function newSession(values, timestamp) {
  return { id:`S-${crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase()}`, protocol:'single-nap-v1', stage:'pre', age:Number(values.age), education:values.education, consent_version:CONSENT_VERSION, consented_at:timestamp, created_at:now(), summaries:{}, attempts:[], interrupted_attempts:0, visibility_changes:0 };
}

async function handleSubmit(form) {
  if (form.id === 'consent-form') { consentedAt = now(); registration(); }
  else if (form.id === 'registration-form') {
    if (!demo && !consentedAt) return show(consentHTML);
    const values = data(form);
    if (!isEligible(values)) return card('Revisa los requisitos', '<p>Con las respuestas indicadas no puedes continuar, o necesitas aclarar un criterio con el equipo. No se guardaron estas respuestas.</p>'+action('consent','Volver al consentimiento'));
    session = newSession(values,consentedAt);
    if (demo) { session.id='DEMO'; session.consent_version='demo-sin-consentimiento'; }
    await persist(); renderStage();
  } else if (form.id === 'pre-form' || form.id === 'post-form') {
    const phase = form.id.startsWith('pre') ? 'pre' : 'post';
    const values = data(form);
    if (phase === 'post') {
      const message = validateSleepReport(values);
      if (message) { document.querySelector('#form-error').textContent = message; return; }
    }
    session[phase] = values; session.stage = `${phase}_battery`; await persist(); renderStage();
  } else if (form.id === 'final-form') {
    session.post.self_performance = data(form).self_performance;
    session.stage = 'complete'; session.completed_at = now(); await persist(); completed();
  }
}

async function handleAction(name, target) {
  if (target.dataset.session) {
    session = (await listSessions()).find(s=>s.id===target.dataset.session); demo = false;
    // Un cierre del navegador durante una tarea deja el intento para control de calidad.
    for (const attempt of session.attempts) if (attempt.status === 'running') { attempt.status='interrupted'; session.interrupted_attempts++; }
    await persist(); return renderStage();
  }
  if (name === 'consent') { session=null; demo=false; consentedAt=null; return show(consentHTML); }
  if (name === 'decline') { session=null; consentedAt=null; return card('No se inició la participación','<p>No se guardó una aceptación ni un registro nuevo. Puedes cerrar la página.</p><a href="estudio.html">Volver a la información</a>'); }
  if (name === 'teacher') return teacher();
  if (name === 'resume') return resume();
  if (name === 'demo') { demo=true; session=null; consentedAt=null; return registration(); }
  if (name === 'battery') { taskPromise = runBattery(); return taskPromise; }
  if (name === 'start-nap') { session.interval_started_at=now(); session.stage='nap'; await persist(); return nap(); }
  if (name === 'demo-skip' && demo) { session.interval_started_at=new Date(Date.now()-25*60000).toISOString(); return nap(); }
  if (name === 'post' && remainingNap(session.interval_started_at) === 0) { session.stage='post'; await persist(); return renderStage(); }
  if (name === 'withdraw') {
    controller?.abort();
    if (taskPromise) await taskPromise;
    return card('¿Deseas retirarte?', '<p>Puedes detener tu participación sin consecuencias. Los datos ya guardados permanecerán marcados como retirados. Si estabas realizando una tarea, ese intento se interrumpió.</p><div class="actions-wrap">'+action('confirm-withdraw','Confirmar retiro')+action('continue','Continuar la sesión')+'</div>');
  }
  if (name === 'confirm-withdraw') { session.stage='withdrawn'; session.withdrawn_at=now(); await persist(); return renderStage(); }
  if (name === 'continue') return renderStage();
  if (name === 'export-own') return downloadFile(`${session.id}-siesta.json`,JSON.stringify(session,null,2),'application/json');
  if (name?.startsWith('export-')) {
    const sessions=await listSessions();
    if (name==='export-all') downloadFile('siesta-unica-respaldo.json',JSON.stringify({protocol:'single-nap-v1',exported_at:now(),sessions},null,2),'application/json');
    if (name==='export-summary') downloadFile('siesta-unica-resumen.csv',rowsToCsv(sessions.map(summaryRow)),'text/csv;charset=utf-8');
    if (name==='export-trials') downloadFile('siesta-unica-ensayos.csv',rowsToCsv(sessions.flatMap(s=>s.attempts.flatMap(a=>a.trials.map(t=>({participant_id:s.id,phase:a.phase,attempt_id:a.id,attempt_status:a.status,...t}))))),'text/csv;charset=utf-8');
  }
}

document.addEventListener('submit', async event => {
  const form=event.target;
  if (!app.contains(form)) return;
  event.preventDefault(); if (!form.reportValidity()) return;
  const button=form.querySelector('[type="submit"]'); button.disabled=true;
  try { await handleSubmit(form); }
  catch (failure) { console.error(failure); error('No se pudo guardar o continuar. Conserva esta página y revisa que el almacenamiento del navegador esté permitido.'); }
  finally { button.disabled=false; }
});
document.addEventListener('click', async event => {
  const target=event.target.closest('[data-action],[data-session]');
  if (!target || target.disabled) return;
  try { await handleAction(target.dataset.action,target); }
  catch (failure) { busy=false; navigation(); console.error(failure); error('No se pudo completar la acción. Revisa el almacenamiento de este navegador e intenta de nuevo.'); }
});
document.addEventListener('visibilitychange', () => {
  if (busy && document.hidden && session) session.visibility_changes++;
});
navigation();
