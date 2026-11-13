/* Teste do texto de importação do Anki (extras.js). Rodar: node tests/anki.test.js */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const saved = [];
const questions = {
  q1: { id: 'q1', codigo: 'R1-00001', instituicao: 'USP SP', ano: 2024, area: 'Cirurgia', especialidade: 'Trauma', tema: 'Choque :: grave', enunciado: 'Linha 1\nLinha com "aspas" e\ttab', alternativas: [{ l: 'A', t: 'Errada' }, { l: 'B', t: 'Certa <b>' }], gabarito: 'B', comentario: 'Porque sim' },
  q2: { id: 'q2', codigo: 'R1-00002', enunciado: 'Sem assunto', alternativas: [], gabarito: 'A' }
};
const MQ = {
  esc: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
  para: s => '<p>' + MQ.esc(s) + '</p>',
  qPath: q => [q.area, q.especialidade, q.tema].filter(Boolean),
  get: (c, id) => questions[id] || null,
  noteOf: id => (id === 'q1' ? 'minha nota' : ''),
  saveFile: (name, content) => saved.push({ name, content }),
  toast: () => {}
};
const ctx = { window: { MQ }, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../www/js/extras.js'), 'utf8'), ctx);

const r = MQ.ankiText(['q1', 'q2', 'removida']);
assert.strictEqual(r.count, 2); // id inexistente é ignorado
const lines = r.text.split('\n');
assert.deepStrictEqual(lines.slice(0, 6), ['#separator:tab', '#html:true', '#notetype:Basic', '#deck column:3', '#tags column:4', '#guid column:5']);
const rows = lines.slice(6).filter(Boolean);
assert.strictEqual(rows.length, 2, 'uma linha por questão: nenhuma quebra de linha crua dentro dos campos');
const cols = rows[0].split('\t');
assert.strictEqual(cols.length, 5, 'cinco colunas separadas por tabulação (a tabulação do enunciado virou espaço)');
assert.ok(cols[0].includes('""aspas""'), 'aspas dobradas');
assert.ok(cols[0].includes('<br>'), 'quebra de linha virou <br>');
assert.ok(cols[1].includes('Gabarito: B) Certa &lt;b&gt;') && cols[1].includes('minha nota'), 'verso com gabarito, alternativa certa e anotação');
assert.strictEqual(cols[2], '"Pulse::Cirurgia::Trauma::Choque : grave"', 'o :: do assunto não quebra a hierarquia do baralho');
assert.strictEqual(cols[3], '"R1-00001 USP_SP 2024"');
assert.strictEqual(cols[4], '"q1"', 'guid = id da questão: reimportar atualiza em vez de duplicar');
assert.strictEqual(rows[1].split('\t')[2], '"Pulse::Sem assunto"');

MQ.ankiExport(['q1'], 'Caderno de Erros ção');
assert.ok(/^pulse-anki-caderno-de-erros-cao-\d{4}-\d{2}-\d{2}\.txt$/.test(saved[0].name), saved[0].name);
MQ.ankiExport(['removida'], 'x');
assert.strictEqual(saved.length, 1, 'sem questões não gera arquivo');
console.log('anki: ok');
