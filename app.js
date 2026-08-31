import { all, exportAll, get, put, recordEvent } from './db.js';
import { assignmentFor, conditionLabel, phaseLabel } from './protocol.js';
import { runNBack, runPVT } from './tasks.js';
import { downloadFile, rowsToCsv } from './csv.js';

const app = document.querySelector('#app');
const state = { profile: null, session: null, phase: null };
const now = () => new Date().toISOString();
const cleanId = value => value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

function page(content, className = 'panel-page') {
  app.className = className;
  app.innerHTML = content;
  app.focus();
}

function field(name, label, { type = 'number', min = 0, max = 10, step = 1, required = true, hint = '' } = {}) {
  return `<label class="field"><span>${label}</span>${hint ? `<small>${hint}</small>` : ''}<input name="${name}" type="${type}" min="${min}" max="${max}" step="${step}" ${required ? 'required' : ''}></label>`;
}

function scale(name, label, left = 'Nada', right = 'Mucho') {
  return `<label class="field scale"><span>${label}</span><input name="${name}" type="range" min="0" max="10" value="5"><small><span>${left}</span><output>5</output><span>${right}</span></small></label>`;
}

function formData(form) {
  return Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value === '' ? null : value]));
}

function renderHome() {
  state.profile = state.session = state.phase = null;
  page(`<section class="hero" id="inicio"><div class="hero-copy"><p class="eyebrow">Piloto experimental · Equipo 8</p><h1>¿Cómo influyen una pausa y nuestras expectativas en el desempeño?</h1><p class="lead">Un protocolo cruzado compara una oportunidad de siesta breve con descanso tranquilo, midiendo atención y memoria de trabajo antes y después.</p><div class="hero-actions"><button class="button primary" data-action="register">Registrar participante</button><button class="button secondary" data-action="start">Iniciar medición previa</button><button class="button secondary" data-action="resume">Continuar fase posterior</button></div><p class="privacy-note">Los datos se guardan únicamente en este dispositivo hasta que el equipo los exporta.</p></div><div class="orbit-card" aria-label="Esquema de las dos sesiones"><div class="moon"><span></span></div><div class="route"><div><b>01</b><span>Medición previa</span></div><i></i><div><b>02</b><span>Siesta o descanso</span></div><i></i><div><b>03</b><span>Medición posterior</span></div></div></div></section><section class="principles"><article><span>↔</span><h2>Diseño cruzado</h2><p>Cada persona realiza ambas condiciones en orden contrabalanceado.</p></article><article><span>◎</span><h2>Medición multimétodo</h2><p>Expectativas, experiencia subjetiva y desempeño objetivo se mantienen separados.</p></article><article><span>⌁</span><h2>Uso responsable</h2><p>No dormir no es un fallo. La somnolencia y la inercia se registran sin emitir juicios.</p></article></section>`, 'home-page');
}

function renderRegister() {
  page(`<section class="form-card"><p class="eyebrow">Alta anónima</p><h1>Registrar participante</h1><p>Usa un código que no contenga nombre, matrícula, correo ni fecha de nacimiento.</p><form id="register-form"><div class="form-grid">${field('participant_id','Código del participante',{type:'text',hint:'Ejemplo: P-024'})}${field('age','Edad',{min:18,max:65})}<label class="field"><span>Cronotipo autopercibido</span><select name="chronotype" required><option value="">Selecciona</option><option value="morning">Matutino</option><option value="intermediate">Intermedio</option><option value="evening">Vespertino</option></select></label><label class="field"><span>Frecuencia habitual de siestas</span><select name="nap_habit" required><option value="">Selecciona</option><option value="never">Nunca o casi nunca</option><option value="monthly">Algunas al mes</option><option value="weekly">1–3 por semana</option><option value="frequent">4 o más por semana</option></select></label></div><label class="consent"><input name="consent" type="checkbox" required><span>Confirmo que se explicó el estudio, la participación es voluntaria y puedo retirarme sin consecuencias. Entiendo que no dormir no se considera un fallo.</span></label><div class="callout safety"><b>Seguridad</b><p>Si aparece somnolencia intensa o inercia del sueño, no conduzcas ni realices tareas de riesgo hasta recuperarte.</p></div><div class="form-actions"><button class="button secondary" type="button" data-action="home">Cancelar</button><button class="button primary" type="submit">Guardar registro</button></div></form></section>`);
}

function renderIdentify(mode) {
  const resume = mode === 'resume';
  page(`<section class="form-card compact"><p class="eyebrow">${resume ? 'Fase posterior' : 'Medición previa'}</p><h1>${resume ? 'Retomar una sesión' : 'Identificar participante'}</h1><form id="identify-form" data-mode="${mode}">${field('participant_id','Código del participante',{type:'text'})}${resume ? field('session_code','Código breve de sesión',{type:'text'}) : ''}<p class="error" role="alert"></p><div class="form-actions"><button class="button secondary" type="button" data-action="home">Volver</button><button class="button primary" type="submit">Continuar</button></div></form></section>`);
}

function renderPreForm() {
  const condition = conditionLabel(state.session.condition);
  page(`<section class="form-card"><p class="eyebrow">Sesión ${state.session.session_number} de 2 · ${condition}</p><h1>Estado previo y expectativas</h1><p>Responde antes de recibir las instrucciones del intervalo. Las escalas van de 0 a 10.</p><form id="pre-form"><div class="form-grid">${field('sleep_hours','Sueño nocturno previo (horas)',{min:0,max:16,step:.25})}${field('sleep_quality','Calidad del sueño previo',{min:1,max:9,hint:'1 = muy mala; 9 = excelente'})}${field('caffeine_mg','Cafeína desde que despertaste (mg)',{min:0,max:1000})}${field('hours_since_caffeine','Horas desde la última cafeína',{min:0,max:24,step:.25,required:false})}<label class="field"><span>Medicamentos o sustancias relevantes</span><select name="medication"><option value="no">No</option><option value="yes">Sí, documentado por el investigador</option><option value="prefer_not">Prefiero no responder</option></select></label><label class="field"><span>Hora aproximada de despertar</span><input name="wake_time" type="time" required></label></div><div class="scales">${scale('sleepiness','Somnolencia actual','Nada somnoliento','Extremadamente')}${scale('mood','Estado de ánimo','Muy negativo','Muy positivo')}${scale('expected_rest','¿Cuánto esperas sentirte descansado después?')}${scale('expected_performance','¿Cuánto esperas que mejore tu desempeño?','Nada','Mucho')}${scale('anticipated_guilt','¿Cuánta culpa anticipas sentir por tomar esta pausa?')}</div><div class="form-actions"><button class="button secondary" type="button" data-action="home">Salir</button><button class="button primary" type="submit">Comenzar tareas previas</button></div></form></section>`);
}

function renderBatteryIntro() {
  page(`<section class="form-card compact centered"><p class="eyebrow">Batería ${phaseLabel(state.phase).toLowerCase()}</p><h1>Dos tareas breves</h1><div class="battery-list"><div><b>Atención sostenida</b><span>20 respuestas rápidas</span></div><div><b>Memoria de trabajo</b><span>36 estímulos 2-back</span></div></div><p>Trabaja en un lugar silencioso. Usa el mismo dispositivo y postura en ambas sesiones.</p><button class="button primary" data-action="run-battery">Comenzar</button></section>`);
}

async function runBattery() {
  const context = { participant_id: state.profile.participant_id, session_id: state.session.row_id, condition: state.session.condition, phase: state.phase };
  const summaries = {};
  for (const task of state.profile.task_order) {
    summaries[task] = task === 'pvt' ? await runPVT(app, context, trial => put('trials', trial)) : await runNBack(app, context, trial => put('trials', trial));
  }
  state.session[`${state.phase}_task_summary`] = summaries;
  state.session[`${state.phase}_battery_completed_at`] = now();
  if (state.phase === 'pre') {
    state.session.status = 'awaiting_post'; state.session.interval_started_at = now(); await put('sessions', state.session); await recordEvent('pre_completed', context); renderInterval();
  } else {
    state.session.status = 'complete'; state.session.completed_at = now(); await put('sessions', state.session); await recordEvent('session_completed', context); renderComplete();
  }
}

function renderInterval() {
  const nap = state.session.condition === 'nap';
  page(`<section class="form-card compact centered"><p class="eyebrow">Fase previa terminada</p><h1>${conditionLabel(state.session.condition)}</h1><div class="session-code"><span>Código para reanudar</span><b>${state.session.session_code}</b></div><div class="callout"><b>Instrucción estandarizada</b><p>${nap ? 'Dispón de 25–30 minutos para intentar dormir en un ambiente cómodo y seguro. Dormir no es obligatorio ni representa éxito o fracaso.' : 'Permanece 25–30 minutos en reposo tranquilo, sin dormir, estudiar, trabajar ni usar pantallas.'}</p></div><p>El operador debe registrar la adherencia y el tiempo real al retomar. Puedes cerrar esta página: la sesión queda guardada en este dispositivo.</p><div class="form-actions centered"><button class="button secondary" data-action="home">Ir al inicio</button><button class="button primary" data-action="post-now">Continuar fase posterior</button></div></section>`);
}

function renderPostForm() {
  const nap = state.session.condition === 'nap';
  const elapsed = Math.round((Date.now() - Date.parse(state.session.interval_started_at)) / 60000);
  page(`<section class="form-card"><p class="eyebrow">Sesión ${state.session.session_number} · ${conditionLabel(state.session.condition)}</p><h1>Intervalo y experiencia posterior</h1><p>Han transcurrido aproximadamente <b>${elapsed} minutos</b> desde el final de la batería previa.</p><form id="post-form"><h2>Registro del operador</h2><div class="form-grid"><label class="field"><span>¿Se durmió durante el intervalo?</span><select name="slept" required><option value="">Selecciona</option><option value="yes">Sí</option><option value="no">No</option><option value="unsure">No es seguro</option></select></label><label class="field"><span>Fuente de verificación</span><select name="verification" required><option value="self_report">Autorreporte</option><option value="observer">Observación</option><option value="actigraphy">Actigrafía</option><option value="other">Otra</option><option value="unknown">No verificado</option></select></label>${field('interval_minutes','Duración total del intervalo (min)',{min:0,max:120})}${field('sleep_minutes','Minutos de sueño estimados',{min:0,max:120,required:nap})}${field('sleep_latency_minutes','Latencia estimada al sueño (min)',{min:0,max:120,required:false})}${field('interruptions','Número de interrupciones',{min:0,max:30})}<label class="field"><span>Adherencia a la condición</span><select name="adherence" required><option value="full">Completa</option><option value="partial">Parcial</option><option value="none">No adherente</option></select></label><label class="field"><span>Incidencia relevante</span><input name="incident" type="text" maxlength="160" placeholder="Sin datos identificables"></label></div><h2>Reporte del participante</h2><div class="scales">${scale('sleep_inertia','Inercia o aturdimiento','Nada','Extrema')}${scale('perceived_rest','Sensación de descanso')}${scale('vitality','Vitalidad actual')}${scale('guilt','Culpa por haber tomado la pausa')}${scale('subjective_concentration','Concentración percibida')}${scale('subjective_performance','Desempeño que esperas tener ahora')}</div><div class="form-actions"><button class="button secondary" type="button" data-action="home">Salir</button><button class="button primary" type="submit">Comenzar tareas posteriores</button></div></form></section>`);
}

function renderComplete() {
  const firstTask = state.session.post_task_summary.pvt;
  const secondTask = state.session.post_task_summary.nback;
  page(`<section class="form-card compact centered"><p class="eyebrow">Sesión completa</p><h1>Gracias por participar</h1><div class="result-grid"><div><b>${firstTask ? Math.round(firstTask.median_rt_ms) : '—'} ms</b><span>Mediana de reacción posterior</span></div><div><b>${secondTask ? Math.round(secondTask.accuracy * 100) : '—'}%</b><span>Exactitud 2-back posterior</span></div></div><p>Estos resultados son descriptivos y no constituyen una evaluación clínica. La interpretación válida requiere analizar ambas condiciones a nivel grupal.</p><div class="callout safety"><b>Antes de retirarte</b><p>Si persiste somnolencia o aturdimiento, espera y avisa al equipo. No conduzcas ni realices tareas de riesgo.</p></div><button class="button primary" data-action="home">Volver al inicio</button></section>`);
}

async function renderTeacher() {
  const [profiles, sessions] = await Promise.all([all('profiles'), all('sessions')]);
  const rows = sessions.sort((a,b) => b.created_at.localeCompare(a.created_at)).map(session => `<tr><td>${session.participant_id}</td><td>${session.session_number}</td><td>${conditionLabel(session.condition)}</td><td><span class="status ${session.status}">${session.status === 'complete' ? 'Completa' : 'En curso'}</span></td><td>${new Date(session.created_at).toLocaleDateString('es-MX')}</td></tr>`).join('');
  page(`<section class="dashboard"><div class="dashboard-head"><div><p class="eyebrow">Modo docente · datos locales</p><h1>Panel del estudio</h1></div><button class="button secondary" data-action="home">Salir</button></div><div class="metrics"><article><b>${profiles.length}</b><span>Participantes</span></article><article><b>${sessions.filter(s=>s.status==='complete').length}</b><span>Sesiones completas</span></article><article><b>${sessions.filter(s=>s.status!=='complete').length}</b><span>Sesiones en curso</span></article></div><div class="callout"><b>Control de calidad</b><p>Antes del análisis, revisa faltantes, adherencia, orden, tiempos del intervalo y diferencias basales. Una sesión sin sueño en la condición siesta no debe borrarse: documéntala y define el análisis por intención de tratar y por protocolo.</p></div><div class="export-actions"><button class="button primary" data-action="export-json">Exportar respaldo JSON</button><button class="button secondary" data-action="export-summary">Resumen CSV</button><button class="button secondary" data-action="export-trials">Ensayos CSV</button></div><div class="table-wrap"><table><thead><tr><th>Participante</th><th>Sesión</th><th>Condición</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>${rows || '<tr><td colspan="5">Aún no hay sesiones.</td></tr>'}</tbody></table></div><details><summary>Esquema de análisis recomendado</summary><p>Modelo mixto: desempeño ~ condición × tiempo + expectativa + orden + (1 | participante). Reportar cambio pre–post, intervalos de confianza y tamaño de efecto. No interpretar asociaciones entre culpa y desempeño como causalidad.</p></details></section>`);
}

async function identifySubmit(form) {
  const values = formData(form); const participantId = cleanId(values.participant_id); const profile = await get('profiles', participantId); const error = form.querySelector('.error');
  if (!profile) { error.textContent = 'No existe un registro con ese código en este dispositivo.'; return; }
  const sessions = (await all('sessions')).filter(item => item.participant_id === participantId);
  if (form.dataset.mode === 'resume') {
    const pending = sessions.find(item => item.status === 'awaiting_post' && item.session_code === cleanId(values.session_code));
    if (!pending) { error.textContent = 'No encontramos una sesión pendiente con ese código.'; return; }
    state.profile = profile; state.session = pending; state.phase = 'post'; renderPostForm(); return;
  }
  const pending = sessions.find(item => item.status !== 'complete');
  if (pending) { error.textContent = `Ya existe una sesión pendiente. Retómala con el código ${pending.session_code}.`; return; }
  const completed = sessions.filter(item => item.status === 'complete');
  if (completed.length >= 2) { error.textContent = 'Este participante ya completó las dos condiciones.'; return; }
  const condition = profile.condition_order[completed.length];
  state.profile = profile; state.phase = 'pre'; state.session = { row_id: crypto.randomUUID(), participant_id: participantId, session_number: completed.length + 1, condition, expected_condition: condition, status: 'pre_started', session_code: `${participantId.slice(-3)}${condition === 'nap' ? 'N' : 'R'}${completed.length + 1}`.toUpperCase(), created_at: now() };
  await put('sessions', state.session); await recordEvent('session_started', { participant_id: participantId, session_id: state.session.row_id, condition }); renderPreForm();
}

async function exportSummary() {
  const sessions = await all('sessions'); const assessments = await all('assessments');
  const rows = sessions.map(session => {
    const pre = assessments.find(a => a.session_id === session.row_id && a.phase === 'pre') || {};
    const post = assessments.find(a => a.session_id === session.row_id && a.phase === 'post') || {};
    return { participant_id: session.participant_id, session_id: session.row_id, session_number: session.session_number, condition: session.condition, status: session.status, created_at: session.created_at, completed_at: session.completed_at, sleep_hours_pre: pre.sleep_hours, sleepiness_pre: pre.sleepiness, expected_rest_pre: pre.expected_rest, expected_performance_pre: pre.expected_performance, anticipated_guilt_pre: pre.anticipated_guilt, slept: post.slept, verification: post.verification, interval_minutes: post.interval_minutes, sleep_minutes: post.sleep_minutes, adherence: post.adherence, sleep_inertia_post: post.sleep_inertia, perceived_rest_post: post.perceived_rest, guilt_post: post.guilt, pvt_median_pre_ms: session.pre_task_summary?.pvt?.median_rt_ms, pvt_median_post_ms: session.post_task_summary?.pvt?.median_rt_ms, pvt_change_ms: session.post_task_summary?.pvt && session.pre_task_summary?.pvt ? session.post_task_summary.pvt.median_rt_ms-session.pre_task_summary.pvt.median_rt_ms : null, nback_accuracy_pre: session.pre_task_summary?.nback?.accuracy, nback_accuracy_post: session.post_task_summary?.nback?.accuracy, nback_change: session.post_task_summary?.nback && session.pre_task_summary?.nback ? session.post_task_summary.nback.accuracy-session.pre_task_summary.nback.accuracy : null };
  }); downloadFile(`siestas-resumen-${Date.now()}.csv`, rowsToCsv(rows), 'text/csv;charset=utf-8');
}

document.addEventListener('input', event => { if (event.target.type === 'range') event.target.closest('label').querySelector('output').value = event.target.value; });
document.addEventListener('submit', async event => {
  event.preventDefault(); const form = event.target;
  if (form.id === 'register-form') { const values=formData(form); const id=cleanId(values.participant_id); if (!id) return; if (await get('profiles',id)) { alert('Ese código ya existe en este dispositivo.'); return; } const assignment=assignmentFor(id); const profile={row_id:id,participant_id:id,age:Number(values.age),chronotype:values.chronotype,nap_habit:values.nap_habit,condition_order:assignment.conditionOrder,task_order:assignment.taskOrder,consented_at:now(),created_at:now()}; await put('profiles',profile); await recordEvent('participant_registered',{participant_id:id}); renderIdentify('start'); document.querySelector('[name="participant_id"]').value=id; }
  if (form.id === 'identify-form') await identifySubmit(form);
  if (form.id === 'pre-form') { const values=formData(form); const assessment={row_id:crypto.randomUUID(),participant_id:state.profile.participant_id,session_id:state.session.row_id,condition:state.session.condition,phase:'pre',recorded_at:now(),...values}; await put('assessments',assessment); state.session.status='pre_battery'; await put('sessions',state.session); renderBatteryIntro(); }
  if (form.id === 'post-form') { const values=formData(form); const assessment={row_id:crypto.randomUUID(),participant_id:state.profile.participant_id,session_id:state.session.row_id,condition:state.session.condition,phase:'post',recorded_at:now(),elapsed_since_pre_minutes:Math.round((Date.now()-Date.parse(state.session.interval_started_at))/60000),...values}; await put('assessments',assessment); state.session.status='post_battery'; await put('sessions',state.session); renderBatteryIntro(); }
});

document.addEventListener('click', async event => {
  const action=event.target.closest('[data-action]')?.dataset.action; if(!action)return;
  if(action==='home')renderHome(); if(action==='register')renderRegister(); if(action==='start')renderIdentify('start'); if(action==='resume')renderIdentify('resume'); if(action==='teacher')await renderTeacher(); if(action==='run-battery'){ event.target.disabled=true; await runBattery(); } if(action==='post-now'){state.phase='post';renderPostForm();}
  if(action==='export-json'){const data=await exportAll();downloadFile(`siestas-respaldo-${Date.now()}.json`,JSON.stringify(data,null,2),'application/json');}
  if(action==='export-summary')await exportSummary(); if(action==='export-trials')downloadFile(`siestas-ensayos-${Date.now()}.csv`,rowsToCsv(await all('trials')),'text/csv;charset=utf-8');
});

document.querySelector('#teacher-shortcut').addEventListener('click', renderTeacher);
renderHome();
