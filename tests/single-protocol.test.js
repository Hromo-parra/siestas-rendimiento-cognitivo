import test from 'node:test';
import assert from 'node:assert/strict';
import { isEligible, validateSleepReport, summarizeAttention, summarizeMemory, remainingNap, summaryRow, NAP_MS, DATABASE_NAME } from '../single-protocol.js';

test('requiere mayoría de edad, estudios, disponibilidad y exclusiones resueltas', () => {
  const eligible = {age:18,education:'grado',available:'yes',sleep_disorder:'no',substances:'no'};
  assert.ok(isEligible(eligible));
  assert.ok(isEligible({...eligible,age:75,education:'posgrado'}));
  for (const change of [{age:17},{age:18.5},{education:''},{available:'no'},{sleep_disorder:'yes'},{substances:'unsure'}]) assert.equal(isEligible({...eligible,...change}),false);
});

test('el autorreporte permite no dormir y detecta minutos incompatibles', () => {
  assert.equal(validateSleepReport({slept:'no',interval_minutes:25,sleep_minutes:0}),'');
  assert.notEqual(validateSleepReport({slept:'no',interval_minutes:25,sleep_minutes:5}),'');
  assert.notEqual(validateSleepReport({slept:'yes',interval_minutes:25,sleep_minutes:30}),'');
});

test('la mediana usa ambos valores centrales; omisiones y anticipaciones quedan separadas', () => {
  const result=summarizeAttention([{rt_ms:300},{rt_ms:600},{rt_ms:null,timeout:true},{rt_ms:null,false_start:true}]);
  assert.equal(result.median_rt_ms,450);
  assert.equal(result.valid_n,2); assert.equal(result.omissions_n,1);
  assert.equal(result.false_starts_n,1); assert.equal(result.lapses_n,1);
  assert.equal(summarizeAttention([{rt_ms:null,timeout:true}]).median_rt_ms,null);
});

test('2-back no infla la exactitud con posiciones sin comparación disponible', () => {
  const result=summarizeMemory([{trial_index:0,target:false,response:false},{trial_index:1,target:false,response:false},{trial_index:2,target:true,response:false},{trial_index:3,target:false,response:false}]);
  assert.equal(result.scored_n,2); assert.equal(result.accuracy,.5);
});

test('el intervalo persiste por fecha absoluta y dura 25 minutos', () => {
  const start='2026-09-02T12:00:00.000Z', timestamp=Date.parse(start);
  assert.equal(remainingNap(start,timestamp),NAP_MS);
  assert.equal(remainingNap(start,timestamp+24*60000),60000);
  assert.equal(remainingNap(start,timestamp+NAP_MS+1000),0);
  assert.notEqual(DATABASE_NAME,'nap-study-pilot-v1');
});

test('la exportación preserva cambios nulos sin convertir faltantes en ceros', () => {
  const base={id:'TEST',stage:'complete',summaries:{pre:{pvt:{median_rt_ms:null},nback:{accuracy:.5}},post:{pvt:{median_rt_ms:300},nback:{accuracy:.75}}}};
  const row=summaryRow(base);
  assert.equal(row.pvt_change_ms,null); assert.equal(row.nback_change,.25);
});
