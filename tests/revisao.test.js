/* Teste da revisão espaçada (db.js). Rodar: node tests/revisao.test.js */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let t = 1000;
const store = {};
const ctx = { console, localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } }, setTimeout: () => 0, clearTimeout: () => {} };
ctx.window = ctx;
ctx.MQ = { uid: () => 'id' + (++t), now: () => ++t };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../www/js/db.js'), 'utf8'), ctx);
const MQ = ctx.MQ, DAY = 86400000;
MQ.data.questions.q1 = { id: 'q1', gabarito: 'B', updatedAt: 1 };
const rev = () => MQ.get('reviews', 'q1');
let now = new Date(2026, 0, 10, 10, 0, 0).getTime();
const att = (correct, conf) => MQ.reviewUpdate({ qid: 'q1', correct, conf, ts: now });
const days = r => Math.round((r.due - now) / DAY);
const wait = () => { now = rev().due; }; // o relógio vai até o vencimento

// acertar uma questão nova não cria revisão
att(true); assert.strictEqual(rev(), null);
// errar: caixa 0, volta em 1 dia
att(false); assert.strictEqual(rev().box, 0); assert.strictEqual(days(rev()), 1);
// acertos (sempre no vencimento) sobem 1, 3, 7, 15, 30 e depois saem
wait(); att(true); assert.strictEqual(rev().box, 1); assert.strictEqual(days(rev()), 3);
wait(); att(true); assert.strictEqual(rev().box, 2); assert.strictEqual(days(rev()), 7);
wait(); att(true); assert.strictEqual(rev().box, 3); assert.strictEqual(days(rev()), 15);
wait(); att(true); assert.strictEqual(rev().box, 4); assert.strictEqual(days(rev()), 30);
wait(); att(true); assert.strictEqual(rev(), null);
// acertar de novo antes de vencer não sobe a caixa
att(false); wait(); att(true);
const b1 = rev().box, d1 = rev().due;
att(true); att(true); assert.strictEqual(rev().box, b1); assert.strictEqual(rev().due, d1);
// errar no meio do caminho volta para a caixa 0
wait(); att(true); assert.strictEqual(rev().box, 2);
att(false); assert.strictEqual(rev().box, 0);
// acerto com chute (revisão vencida): fica na caixa e repete em 3 dias
wait(); att(true, 'chute'); assert.strictEqual(rev().box, 0); assert.strictEqual(days(rev()), 3);
// chute sem revisão cria uma, em 3 dias
MQ.remove('reviews', 'q1');
att(true, 'chute'); assert.strictEqual(rev().box, 0); assert.strictEqual(days(rev()), 3);
// questão removida não gera revisão
MQ.remove('questions', 'q1'); MQ.remove('reviews', 'q1');
att(false); assert.strictEqual(rev(), null);
// vencidas: hoje e atrasadas entram, futuras não
MQ.data.questions.q2 = { id: 'q2', updatedAt: 1 }; MQ.data.questions.q3 = { id: 'q3', updatedAt: 1 };
MQ.put('reviews', { id: 'q2', qid: 'q2', box: 0, due: Date.now() - 3 * DAY });
MQ.put('reviews', { id: 'q3', qid: 'q3', box: 0, due: Date.now() + 5 * DAY });
assert.deepStrictEqual(Array.from(MQ.reviewsDue().map(r => r.qid)), ['q2']);
console.log('revisao: ok');
