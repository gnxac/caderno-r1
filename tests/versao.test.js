/* A versão mostrada em Configurações (MQ.VERSION) precisa ser a do package.json. Rodar: node tests/versao.test.js */
'use strict';
const fs = require('fs'), assert = require('assert');
const pkg = JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8')).version;
const m = /MQ\.VERSION = '([^']+)'/.exec(fs.readFileSync(__dirname + '/../www/js/settings.js', 'utf8'));
assert.ok(m, 'MQ.VERSION não encontrado em settings.js');
assert.strictEqual(m[1], pkg, 'MQ.VERSION (' + m[1] + ') difere do package.json (' + pkg + ')');
console.log('versao: ok');
