// Configuración y cálculos exclusivos del estudio de una sola siesta.
export const CONSENT_VERSION = '2026-09-02-piloto-1';
export const DATABASE_NAME = 'equipo8-siesta-unica-v1';
export const NAP_MS = 25 * 60 * 1000;

export function isEligible(values) {
  return Number.isInteger(Number(values.age)) && Number(values.age) >= 18
    && ['grado', 'posgrado'].includes(values.education)
    && values.available === 'yes' && values.sleep_disorder === 'no'
    && values.substances === 'no';
}

export function validateSleepReport(values) {
  const interval = Number(values.interval_minutes);
  const sleep = Number(values.sleep_minutes);
  if (!Number.isFinite(interval) || interval < 0 || !Number.isFinite(sleep) || sleep < 0)
    return 'Revisa los minutos del intervalo y del sueño.';
  if (sleep > interval) return 'Los minutos de sueño no pueden superar la duración del intervalo.';
  if (values.slept === 'no' && sleep !== 0) return 'Si no dormiste, registra 0 minutos de sueño.';
  return '';
}

export function summarizeAttention(trials) {
  // Una omisión no equivale a un tiempo de reacción de 1000 ms.
  const times = trials.filter(t => !t.false_start && !t.timeout && Number.isFinite(t.rt_ms))
    .map(t => t.rt_ms).sort((a, b) => a - b);
  const middle = Math.floor(times.length / 2);
  return {
    median_rt_ms: times.length ? (times.length % 2 ? times[middle] : (times[middle - 1] + times[middle]) / 2) : null,
    valid_n: times.length,
    lapses_n: times.filter(t => t >= 500).length,
    omissions_n: trials.filter(t => t.timeout).length,
    false_starts_n: trials.filter(t => t.false_start).length
  };
}

export function summarizeMemory(trials) {
  // Las dos primeras posiciones son de preparación, no decisiones 2-back.
  const scored = trials.filter(t => t.trial_index >= 2);
  return {
    scored_n: scored.length,
    accuracy: scored.length ? scored.filter(t => t.target === t.response).length / scored.length : null,
    hits_n: scored.filter(t => t.target && t.response).length,
    misses_n: scored.filter(t => t.target && !t.response).length,
    false_alarms_n: scored.filter(t => !t.target && t.response).length
  };
}

export function remainingNap(startedAt, now = Date.now()) {
  return Math.max(0, NAP_MS - (now - Date.parse(startedAt)));
}

export function summaryRow(session) {
  const pre = session.summaries?.pre || {};
  const post = session.summaries?.post || {};
  const delta = (before, after) => Number.isFinite(before) && Number.isFinite(after) ? after - before : null;
  return {
    participant_id: session.id, protocol: 'single-nap-v1', status: session.stage,
    consent_version: session.consent_version, consented_at: session.consented_at,
    age: session.age, education: session.education,
    ...Object.fromEntries(Object.entries(session.pre || {}).map(([k,v]) => [`pre_${k}`,v])),
    ...Object.fromEntries(Object.entries(session.post || {}).map(([k,v]) => [`post_${k}`,v])),
    pvt_median_pre_ms: pre.pvt?.median_rt_ms, pvt_median_post_ms: post.pvt?.median_rt_ms,
    pvt_change_ms: delta(pre.pvt?.median_rt_ms, post.pvt?.median_rt_ms),
    pvt_omissions_pre: pre.pvt?.omissions_n, pvt_omissions_post: post.pvt?.omissions_n,
    nback_accuracy_pre: pre.nback?.accuracy, nback_accuracy_post: post.nback?.accuracy,
    nback_change: delta(pre.nback?.accuracy, post.nback?.accuracy),
    interrupted_attempts: session.interrupted_attempts || 0,
    visibility_changes: session.visibility_changes || 0,
    interval_started_at: session.interval_started_at, completed_at: session.completed_at
  };
}
