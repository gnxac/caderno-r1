/* Caderno R1 — cadastrar, importar e gerenciar questões */
(function (MQ) {
  'use strict';
  const { esc, $, $$, icon } = MQ;

  const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  const FINALIDADES = ['Residência (Acesso Direto)', 'R+ Clínica Médica', 'R+ Cirurgia', 'R+ Ginecologia e Obstetrícia', 'R+ Pediatria', 'Revalida', 'ENAMED', 'Título de Especialista', 'Concurso para médicos'];
  const CSV_COLS = ['enunciado', 'A', 'B', 'C', 'D', 'E', 'gabarito', 'comentario', 'area', 'especialidade', 'tema', 'subtema', 'instituicao', 'uf', 'ano', 'finalidade', 'banca', 'professor', 'tipo', 'anulada', 'desatualizada'];

  let tab = 'nova';
  let keepTaxonomy = null;

  function distinct(field) {
    const s = new Set();
    MQ.alive('questions').forEach(q => { const v = (q[field] || '').toString().trim(); if (v) s.add(v); });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }
  function datalist(id, values) {
    return '<datalist id="' + id + '">' + values.map(v => '<option value="' + esc(v) + '">').join('') + '</datalist>';
  }

  MQ.views.cadastrar = function (root, qid) {
    if (!MQ.isAdmin()) {
      root.innerHTML = '<div class="empty"><h2>Área restrita</h2><p>Cadastrar, editar e importar questões fica disponível só para a conta do administrador. Entre com ela em Configurações para liberar.</p><a class="btn" href="#/questoes">Voltar ao banco</a></div>';
      return;
    }
    if (qid) tab = 'nova';
    const tabs = [['nova', qid ? 'Editar questão' : 'Nova questão'], ['importar', 'Importar e exportar'], ['gerenciar', 'Gerenciar questões']];
    root.innerHTML = '<div class="page-head"><div><h1>Cadastrar questões</h1><p>Monte seu banco: digite, importe uma planilha ou restaure um backup.</p></div></div>' +
      '<div class="tabs-lite" role="tablist">' + tabs.map(([k, l]) => '<button class="btn' + (tab === k ? ' primary' : '') + '" role="tab" aria-selected="' + (tab === k) + '" data-etab="' + k + '">' + l + '</button>').join('') + '</div><div id="e-body"></div>';
    $$('[data-etab]', root).forEach(b => b.onclick = () => { tab = b.dataset.etab; if (qid && tab === 'nova') { location.hash = '#/cadastrar'; return; } MQ.render(); });
    const body = $('#e-body', root);
    if (tab === 'nova') formView(body, qid);
    else if (tab === 'importar') importView(body);
    else manageView(body);
  };

  function formView(body, qid) {
    const editing = qid ? MQ.get('questions', qid) : null;
    if (qid && !editing) { body.innerHTML = '<p class="muted">Questão não encontrada.</p>'; return; }
    const base = editing || Object.assign({ tipo: 'multipla', alternativas: 'ABCDE'.split('').map(l => ({ l, t: '' })), gabarito: '' }, keepTaxonomy || {});
    const q = JSON.parse(JSON.stringify(base));
    if (q.tipo === 'certoerrado') q.alternativas = [{ l: 'C', t: 'Certo' }, { l: 'E', t: 'Errado' }];

    body.innerHTML = '<form class="form-card" id="qform" novalidate>' +
      '<div class="row"><label class="field"><span>Tipo</span><select id="q-tipo"><option value="multipla"' + (q.tipo !== 'certoerrado' ? ' selected' : '') + '>Múltipla escolha</option><option value="certoerrado"' + (q.tipo === 'certoerrado' ? ' selected' : '') + '>Certo ou errado</option></select></label>' +
      (editing ? '<label class="field"><span>Código</span><input type="text" value="' + esc(editing.codigo) + '" disabled></label>' : '') + '</div>' +
      '<label class="field"><span>Enunciado</span><textarea id="q-enun" rows="6" placeholder="Caso clínico e pergunta. Deixe uma linha em branco entre parágrafos.">' + esc(q.enunciado || '') + '</textarea></label>' +
      '<div class="field"><span>Alternativas <small>— clique na letra para marcar o gabarito</small></span><div id="q-alts"></div>' +
      (q.tipo !== 'certoerrado' ? '<div class="toolbar"><button type="button" class="btn sm" id="q-add-alt">' + icon('plus') + ' Alternativa</button></div>' : '') + '</div>' +
      '<label class="field"><span>Comentário (aparece depois de responder)</span><textarea id="q-com" rows="4">' + esc(q.comentario || '') + '</textarea></label>' +
      '<h3 class="small" style="margin:18px 0 8px">Assunto</h3><div class="row">' +
      '<label class="field"><span>Grande área</span><input type="text" id="q-area" list="dl-area" value="' + esc(q.area || '') + '"></label>' +
      '<label class="field"><span>Especialidade</span><input type="text" id="q-esp" list="dl-esp" value="' + esc(q.especialidade || '') + '"></label>' +
      '<label class="field"><span>Tema</span><input type="text" id="q-tema" list="dl-tema" value="' + esc(q.tema || '') + '"></label>' +
      '<label class="field"><span>Subtema</span><input type="text" id="q-sub" list="dl-sub" value="' + esc(q.subtema || '') + '"></label></div>' +
      '<h3 class="small" style="margin:8px 0 8px">Origem</h3><div class="row">' +
      '<label class="field"><span>Instituição</span><input type="text" id="q-inst" list="dl-inst" value="' + esc(q.instituicao || '') + '"></label>' +
      '<label class="field"><span>UF</span><select id="q-uf"><option value="">—</option>' + UFS.map(u => '<option' + (q.uf === u ? ' selected' : '') + '>' + u + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Ano</span><input type="number" id="q-ano" min="1990" max="2100" value="' + esc(q.ano || '') + '"></label>' +
      '<label class="field"><span>Finalidade</span><input type="text" id="q-fin" list="dl-fin" value="' + esc(q.finalidade || '') + '"></label>' +
      '<label class="field"><span>Banca</span><input type="text" id="q-banca" list="dl-banca" value="' + esc(q.banca || '') + '"></label>' +
      '<label class="field"><span>Professor (comentário)</span><input type="text" id="q-prof" list="dl-prof" value="' + esc(q.professor || '') + '"></label></div>' +
      '<label class="check"><input type="checkbox" id="q-anul"' + (q.anulada ? ' checked' : '') + '><span>Questão anulada</span></label>' +
      '<label class="check"><input type="checkbox" id="q-desat"' + (q.desatualizada ? ' checked' : '') + '><span>Questão desatualizada</span></label>' +
      '<div class="toolbar" style="justify-content:flex-end;margin-top:16px">' +
      (editing ? '<button type="button" class="btn danger" id="q-del">Excluir questão</button><span style="flex:1"></span><button type="button" class="btn ghost" id="q-cancel">Cancelar</button><button type="submit" class="btn primary">Salvar alterações</button>'
        : '<button type="button" class="btn" id="q-save-new">Salvar e cadastrar outra</button><button type="submit" class="btn primary">Salvar questão</button>') +
      '</div></form>' +
      datalist('dl-area', Array.from(new Set(MQ.AREAS.concat(distinct('area'))))) + datalist('dl-esp', distinct('especialidade')) + datalist('dl-tema', distinct('tema')) + datalist('dl-sub', distinct('subtema')) +
      datalist('dl-inst', distinct('instituicao')) + datalist('dl-fin', Array.from(new Set(FINALIDADES.concat(distinct('finalidade'))))) + datalist('dl-banca', distinct('banca')) + datalist('dl-prof', distinct('professor'));

    const altsBox = $('#q-alts', body);
    function drawAlts() {
      altsBox.innerHTML = q.alternativas.map((a, i) =>
        '<div class="alt-edit"><button type="button" class="letter' + (q.gabarito === a.l ? ' on' : '') + '" data-gab="' + a.l + '" aria-pressed="' + (q.gabarito === a.l) + '" aria-label="Marcar ' + a.l + ' como gabarito">' + a.l + '</button>' +
        (q.tipo === 'certoerrado' ? '<input type="text" value="' + esc(a.t) + '" disabled>' : '<textarea rows="1" data-alt-i="' + i + '" aria-label="Texto da alternativa ' + a.l + '">' + esc(a.t) + '</textarea>') +
        (q.tipo !== 'certoerrado' && q.alternativas.length > 2 ? '<button type="button" class="icon-btn" data-rm="' + i + '" aria-label="Remover alternativa ' + a.l + '">' + icon('trash') + '</button>' : '<span></span>') + '</div>').join('');
      $$('[data-gab]', altsBox).forEach(b => b.onclick = () => { q.gabarito = b.dataset.gab; drawAlts(); });
      $$('[data-alt-i]', altsBox).forEach(t => t.oninput = () => { q.alternativas[+t.dataset.altI].t = t.value; });
      $$('[data-rm]', altsBox).forEach(b => b.onclick = () => {
        const i = +b.dataset.rm;
        const removed = q.alternativas.splice(i, 1)[0];
        const letters = 'ABCDEFGH';
        const oldGab = q.gabarito;
        q.alternativas.forEach((a, k) => { if (oldGab === a.l) q.gabarito = letters[k]; a.l = letters[k]; });
        if (oldGab === removed.l) q.gabarito = '';
        drawAlts();
      });
    }
    drawAlts();
    const addAlt = $('#q-add-alt', body);
    if (addAlt) addAlt.onclick = () => {
      if (q.alternativas.length >= 5) { MQ.toast('O máximo são 5 alternativas (A–E).'); return; }
      q.alternativas.push({ l: 'ABCDE'[q.alternativas.length], t: '' }); drawAlts();
    };
    $('#q-tipo', body).onchange = e => {
      q.tipo = e.target.value;
      q.alternativas = q.tipo === 'certoerrado' ? [{ l: 'C', t: 'Certo' }, { l: 'E', t: 'Errado' }] : 'ABCDE'.split('').map(l => ({ l, t: '' }));
      q.gabarito = '';
      keepTaxonomy = Object.assign({}, keepTaxonomy, { tipo: q.tipo });
      formView(body, qid);
    };

    function collect() {
      const v = id => $(id, body).value.trim();
      const out = Object.assign(editing ? JSON.parse(JSON.stringify(editing)) : { id: MQ.uid() }, {
        tipo: q.tipo, enunciado: $('#q-enun', body).value.trim(),
        alternativas: q.alternativas.map(a => ({ l: a.l, t: (a.t || '').trim() })), gabarito: q.gabarito,
        comentario: $('#q-com', body).value.trim(), area: v('#q-area'), especialidade: v('#q-esp'), tema: v('#q-tema'), subtema: v('#q-sub'),
        instituicao: v('#q-inst'), uf: v('#q-uf'), ano: v('#q-ano') ? parseInt(v('#q-ano'), 10) : '', finalidade: v('#q-fin'), banca: v('#q-banca'), professor: v('#q-prof'),
        anulada: $('#q-anul', body).checked, desatualizada: $('#q-desat', body).checked
      });
      if (!out.enunciado) return [null, 'Escreva o enunciado.'];
      if (out.alternativas.some(a => !a.t)) return [null, 'Preencha todas as alternativas ou remova as vazias.'];
      if (!out.gabarito) return [null, 'Marque o gabarito clicando na letra da alternativa correta.'];
      if (!out.area) return [null, 'Informe pelo menos a grande área.'];
      if (!out.codigo) out.codigo = MQ.nextCode();
      return [out, null];
    }
    function save(again) {
      const [out, err] = collect();
      if (err) { MQ.toast(err, 'err'); return; }
      delete out.exemplo;
      MQ.put('questions', out);
      MQ.toast(editing ? 'Alterações salvas.' : 'Questão ' + out.codigo + ' salva.');
      if (editing) { history.back(); return; }
      keepTaxonomy = { tipo: out.tipo, area: out.area, especialidade: out.especialidade, tema: out.tema, subtema: out.subtema, instituicao: out.instituicao, uf: out.uf, ano: out.ano, finalidade: out.finalidade, banca: out.banca, professor: out.professor };
      if (again) { formView(body, null); window.scrollTo(0, 0); $('#q-enun', body).focus(); }
      else { keepTaxonomy = null; formView(body, null); }
    }
    $('#qform', body).onsubmit = e => { e.preventDefault(); save(false); };
    if ($('#q-save-new', body)) $('#q-save-new', body).onclick = () => save(true);
    if ($('#q-cancel', body)) $('#q-cancel', body).onclick = () => history.back();
    if ($('#q-del', body)) $('#q-del', body).onclick = async () => {
      const ok = await MQ.confirm('Excluir questão', 'A questão ' + editing.codigo + ' será excluída do banco e das listas. Suas respostas antigas deixam de contar no desempenho.', 'Excluir', true);
      if (!ok) return;
      MQ.remove('questions', editing.id);
      MQ.toast('Questão excluída.');
      history.back();
    };
  }

  /* ---------- Importar / exportar ---------- */
  function importView(body) {
    body.innerHTML =
      '<div class="form-card" style="margin-bottom:16px"><h2>Importar planilha (CSV)</h2>' +
      '<p class="muted">Uma questão por linha. Colunas aceitas: ' + CSV_COLS.map(c => '<code>' + c + '</code>').join(', ') + '. Só <code>enunciado</code>, as alternativas, <code>gabarito</code> e <code>area</code> são obrigatórios. Separador ponto e vírgula ou vírgula. No Excel, salve como "CSV UTF-8".</p>' +
      '<div class="toolbar"><button class="btn" id="i-tpl">' + icon('download') + ' Baixar modelo</button><button class="btn primary" id="i-csv">' + icon('upload') + ' Importar CSV</button></div></div>' +
      '<div class="form-card" style="margin-bottom:16px"><h2>Pacote de questões ou backup (.json)</h2>' +
      '<p class="muted">Use para importar um pacote pronto (por exemplo, uma lista convertida de PDF) ou restaurar um backup. Tudo é mesclado com o que já existe: nada é apagado e questões repetidas não se duplicam.</p>' +
      '<div class="toolbar"><button class="btn primary" id="i-rest">' + icon('upload') + ' Importar pacote ou backup</button><button class="btn" id="i-bkp">' + icon('download') + ' Exportar backup</button><button class="btn" id="i-qcsv">' + icon('download') + ' Exportar questões em CSV</button></div></div>';

    $('#i-tpl', body).onclick = () => {
      const rows = [CSV_COLS, ['Mulher de 30 anos com... Qual a conduta?', 'Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D', 'Alternativa E', 'B', 'Comentário explicando o gabarito', 'Clínica Médica', 'Cardiologia', 'Arritmias', 'Fibrilação Atrial', 'Hospital X', 'SP', '2025', 'Residência (Acesso Direto)', 'Banca Y', '', 'multipla', 'nao', 'nao']];
      MQ.saveFile('modelo-questoes.csv', '﻿' + MQ.toCSV(rows), 'text/csv;charset=utf-8');
    };
    $('#i-csv', body).onclick = async () => {
      const f = await MQ.pickFile('.csv,.txt,text/csv');
      if (!f) return;
      const rows = MQ.parseCSV(f.text);
      if (rows.length < 2) { MQ.toast('O arquivo não tem linhas de questões.', 'err'); return; }
      const head = rows[0].map(h => MQ.norm(h).replace(/[^a-z]/g, ''));
      const col = name => head.indexOf(MQ.norm(name).replace(/[^a-z]/g, ''));
      const need = ['enunciado', 'gabarito', 'area'];
      const missing = need.filter(n => col(n) < 0);
      if (missing.length) { MQ.toast('Faltam colunas: ' + missing.join(', ') + '. Baixe o modelo para conferir.', 'err'); return; }
      const ok = [], bad = [];
      rows.slice(1).forEach((r, i) => {
        const g = n => { const k = col(n); return k >= 0 ? (r[k] || '').trim() : ''; };
        const tipo = MQ.norm(g('tipo')).startsWith('cert') ? 'certoerrado' : 'multipla';
        let alts;
        if (tipo === 'certoerrado') alts = [{ l: 'C', t: 'Certo' }, { l: 'E', t: 'Errado' }];
        else alts = 'ABCDE'.split('').map(l => ({ l, t: g(l) })).filter(a => a.t);
        let gab = g('gabarito').toUpperCase().slice(0, 1);
        if (tipo === 'certoerrado') gab = /^C/i.test(g('gabarito')) ? 'C' : 'E';
        const yes = v => /^(s|sim|1|true|x|y)/i.test(v);
        const q = {
          id: MQ.uid(), tipo, enunciado: g('enunciado'), alternativas: alts, gabarito: gab, comentario: g('comentario'),
          area: g('area'), especialidade: g('especialidade'), tema: g('tema'), subtema: g('subtema'), instituicao: g('instituicao'),
          uf: g('uf').toUpperCase(), ano: parseInt(g('ano'), 10) || '', finalidade: g('finalidade'), banca: g('banca'), professor: g('professor'),
          anulada: yes(g('anulada')), desatualizada: yes(g('desatualizada'))
        };
        if (!q.enunciado || alts.length < 2 || !alts.some(a => a.l === gab) || !q.area) bad.push(i + 2); else ok.push(q);
      });
      const yes = await MQ.confirm('Importar questões', ok.length + ' questões prontas para importar' + (bad.length ? '. ' + bad.length + ' linhas foram ignoradas por falta de enunciado, alternativas, gabarito ou área (linhas ' + bad.slice(0, 12).join(', ') + (bad.length > 12 ? '…' : '') + ').' : '.'), 'Importar ' + ok.length);
      if (!yes || !ok.length) return;
      ok.forEach(q => { q.codigo = MQ.nextCode(); q.createdAt = MQ.now(); MQ.data.questions[q.id] = Object.assign(q, { updatedAt: MQ.now() }); });
      MQ.touch();
      MQ.toast(ok.length + ' questões importadas.');
    };
    $('#i-bkp', body).onclick = () => MQ.saveFile('caderno-r1-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(Object.assign({}, MQ.data, { media: MQ.media })), 'application/json');
    $('#i-rest', body).onclick = async () => {
      const f = await MQ.pickFile('.json,application/json');
      if (!f) return;
      let d;
      try { d = JSON.parse(f.text); } catch (e) { MQ.toast('Arquivo inválido: não é um backup do Caderno R1.', 'err'); return; }
      if (!d || !d.questions) { MQ.toast('Arquivo inválido: não é um pacote nem um backup do Caderno R1.', 'err'); return; }
      const nq = Object.keys(d.questions).filter(id => !MQ.data.questions[id]).length;
      const nl = Object.keys(d.lists || {}).filter(id => !MQ.data.lists[id]).length;
      const ok = await MQ.confirm('Importar ' + (d.formato === 'caderno-r1-pacote' ? 'pacote' : 'backup'),
        (d.nome ? d.nome + ': ' : '') + nq + ' questões novas' + (nl ? ', ' + nl + (nl === 1 ? ' lista nova' : ' listas novas') : '') + (d.media ? ' e ' + Object.keys(d.media).length + ' imagens' : '') + '. Continuar?', 'Importar');
      if (!ok) return;
      const n = MQ.mergeData(d);
      const m = MQ.mergeMedia(d.media, true);
      MQ.touch();
      MQ.toast('Importado: ' + n + ' itens' + (m ? ' e ' + m + ' imagens' : '') + '.');
    };
    $('#i-qcsv', body).onclick = () => {
      const rows = [CSV_COLS].concat(MQ.alive('questions').map(q => {
        const alt = l => ((q.alternativas || []).find(a => a.l === l) || {}).t || '';
        return [q.enunciado, alt('A'), alt('B'), alt('C'), alt('D'), alt('E'), q.gabarito, q.comentario, q.area, q.especialidade, q.tema, q.subtema, q.instituicao, q.uf, q.ano, q.finalidade, q.banca, q.professor, q.tipo, q.anulada ? 'sim' : 'nao', q.desatualizada ? 'sim' : 'nao'];
      }));
      MQ.saveFile('caderno-r1-questoes.csv', '﻿' + MQ.toCSV(rows), 'text/csv;charset=utf-8');
    };
  }

  /* ---------- Gerenciar ---------- */
  let mq = '';
  function manageView(body) {
    const all = MQ.sortQuestions(MQ.alive('questions'));
    const examples = all.filter(q => q.exemplo).length;
    body.innerHTML = '<div class="form-card"><div class="toolbar" style="margin-bottom:10px"><div class="pane-search" style="flex:1;min-width:220px;margin:0">' + icon('search') + '<input type="search" id="m-q" placeholder="Buscar por texto, código ou assunto" value="' + esc(mq) + '"></div>' +
      (examples ? '<button class="btn danger sm" id="m-ex">Apagar ' + examples + ' questões de exemplo</button>' : '') + '</div><div id="m-list"></div></div>';
    function draw() {
      const t = MQ.norm(mq);
      const qs = all.filter(q => !t || MQ.norm([q.codigo, q.enunciado, MQ.qPath(q).join(' '), q.instituicao].join(' ')).includes(t));
      $('#m-list', body).innerHTML = '<p class="muted small">' + qs.length + ' questões</p>' + qs.slice(0, 200).map(q =>
        '<div class="mgmt-q"><div><div class="t">' + esc(q.enunciado) + '</div><div class="m">' + esc(q.codigo) + ' · ' + esc(MQ.qPath(q).join(' › ')) + (q.exemplo ? ' · exemplo' : '') + '</div></div>' +
        '<div class="toolbar"><a class="btn sm" href="#/cadastrar/' + q.id + '">Editar</a></div></div>').join('') +
        (qs.length > 200 ? '<p class="muted small">Mostrando 200. Refine a busca para ver as outras.</p>' : '');
    }
    draw();
    let tm;
    $('#m-q', body).oninput = e => { clearTimeout(tm); tm = setTimeout(() => { mq = e.target.value; draw(); }, 200); };
    if ($('#m-ex', body)) $('#m-ex', body).onclick = async () => {
      const ok = await MQ.confirm('Apagar exemplos', 'As ' + examples + ' questões de exemplo que vieram com o app serão excluídas.', 'Apagar exemplos', true);
      if (!ok) return;
      all.filter(q => q.exemplo).forEach(q => MQ.remove('questions', q.id));
      MQ.toast('Questões de exemplo apagadas.'); MQ.render();
    };
  }
})(window.MQ);
