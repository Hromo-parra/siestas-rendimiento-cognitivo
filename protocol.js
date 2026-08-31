export const CONDITIONS = ['nap', 'rest'];

export function hashText(text) {
  let hash = 2166136261;
  for (const char of String(text).trim().toUpperCase()) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function assignmentFor(participantId) {
  const hash = hashText(participantId);
  return {
    conditionOrder: hash % 2 === 0 ? ['nap', 'rest'] : ['rest', 'nap'],
    taskOrder: hash % 4 < 2 ? ['pvt', 'nback'] : ['nback', 'pvt']
  };
}

export function buildNBackSequence(seedText, length = 36) {
  const symbols = ['●', '▲', '■', '◆', '★', '✚'];
  let seed = hashText(seedText) || 1;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const targetPositions = new Set();
  const targetGoal = Math.round((length - 2) * 0.3);
  while (targetPositions.size < targetGoal) targetPositions.add(2 + Math.floor(random() * (length - 2)));
  const sequence = [];
  for (let index = 0; index < length; index += 1) {
    if (targetPositions.has(index)) {
      sequence.push(sequence[index - 2]);
    } else {
      let symbol = symbols[Math.floor(random() * symbols.length)];
      while (index >= 2 && symbol === sequence[index - 2]) symbol = symbols[Math.floor(random() * symbols.length)];
      sequence.push(symbol);
    }
  }
  return sequence.map((stimulus, index) => ({ index, stimulus, target: index >= 2 && stimulus === sequence[index - 2] }));
}

export function summarizePVT(trials) {
  const valid = trials.filter(trial => !trial.false_start && Number.isFinite(trial.rt_ms));
  const rts = valid.map(trial => trial.rt_ms).sort((a, b) => a - b);
  const mean = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : null;
  const median = rts.length ? rts[Math.floor(rts.length / 2)] : null;
  return { mean_rt_ms: mean, median_rt_ms: median, lapses_n: valid.filter(t => t.rt_ms >= 500).length, false_starts_n: trials.filter(t => t.false_start).length, valid_n: valid.length };
}

export function summarizeNBack(trials) {
  const hits = trials.filter(t => t.target && t.response).length;
  const misses = trials.filter(t => t.target && !t.response).length;
  const falseAlarms = trials.filter(t => !t.target && t.response).length;
  const correctRejections = trials.filter(t => !t.target && !t.response).length;
  const accuracy = trials.length ? (hits + correctRejections) / trials.length : null;
  return { hits_n: hits, misses_n: misses, false_alarms_n: falseAlarms, correct_rejections_n: correctRejections, accuracy };
}

export const conditionLabel = condition => condition === 'nap' ? 'Oportunidad de siesta' : 'Descanso tranquilo';
export const phaseLabel = phase => phase === 'pre' ? 'Previa' : 'Posterior';

