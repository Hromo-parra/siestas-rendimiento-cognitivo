import test from 'node:test';
import assert from 'node:assert/strict';
import { assignmentFor, buildNBackSequence, summarizeNBack, summarizePVT } from '../protocol.js';

test('la asignación es determinista y contiene ambas condiciones', () => {
  assert.deepEqual(assignmentFor('P-024'), assignmentFor('p-024'));
  assert.deepEqual([...assignmentFor('P-024').conditionOrder].sort(), ['nap', 'rest']);
  assert.deepEqual([...assignmentFor('P-024').taskOrder].sort(), ['nback', 'pvt']);
});

test('las formas 2-back son reproducibles, distintas y con 30% de blancos', () => {
  const pre = buildNBackSequence('P-024-nap-pre');
  const same = buildNBackSequence('P-024-nap-pre');
  const post = buildNBackSequence('P-024-nap-post');
  assert.deepEqual(pre, same);
  assert.notDeepEqual(pre, post);
  assert.equal(pre.length, 36);
  assert.equal(pre.filter(item => item.target).length, 10);
  pre.forEach((item, index) => { if (item.target) assert.equal(item.stimulus, pre[index - 2].stimulus); });
});

test('el resumen PVT separa lapsos y anticipaciones', () => {
  const result = summarizePVT([{rt_ms:300,false_start:false},{rt_ms:600,false_start:false},{rt_ms:null,false_start:true}]);
  assert.equal(result.median_rt_ms, 600);
  assert.equal(result.lapses_n, 1);
  assert.equal(result.false_starts_n, 1);
});

test('el resumen 2-back calcula matriz de respuestas y exactitud', () => {
  const result = summarizeNBack([{target:true,response:true},{target:true,response:false},{target:false,response:true},{target:false,response:false}]);
  assert.deepEqual(result, {hits_n:1,misses_n:1,false_alarms_n:1,correct_rejections_n:1,accuracy:.5});
});
