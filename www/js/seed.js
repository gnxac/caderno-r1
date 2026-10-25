/* Caderno R1 — questões de exemplo (autorais), para o app não começar vazio.
   Ficam marcadas como "exemplo" e podem ser apagadas em Cadastrar → Gerenciar. */
(function (MQ) {
  'use strict';

  const BASE = { instituicao: 'Exemplo autoral', uf: '', ano: 2026, finalidade: 'Residência (Acesso Direto)', banca: '', professor: '', exemplo: true, tipo: 'multipla' };

  const SEED = [
    {
      area: 'Clínica Médica', especialidade: 'Cardiologia', tema: 'Insuficiência Cardíaca', subtema: 'Tratamento',
      enunciado: 'Homem de 64 anos com insuficiência cardíaca de fração de ejeção reduzida (FE 30%) está em acompanhamento ambulatorial.\n\nQual dos fármacos abaixo melhora sintomas e reduz hospitalizações, mas NÃO demonstrou redução de mortalidade nesse cenário?',
      alts: ['Dapagliflozina', 'Sacubitril-valsartana', 'Digoxina', 'Espironolactona', 'Bisoprolol'], gab: 'C',
      com: 'A digoxina reduz hospitalizações por IC (estudo DIG), mas não altera mortalidade. Os outros quatro integram a terapia que reduz mortalidade na IC com FE reduzida: betabloqueador, antagonista mineralocorticoide, inibidor da neprilisina/BRA e iSGLT2.'
    },
    {
      area: 'Clínica Médica', especialidade: 'Endocrinologia', tema: 'Cetoacidose Diabética', subtema: 'Manejo',
      enunciado: 'Mulher de 22 anos com diabetes tipo 1 chega com glicemia de 480 mg/dL, pH 7,10, bicarbonato 8 mEq/L e potássio sérico de 3,0 mEq/L. Já recebeu 1 L de soro fisiológico.\n\nQual a próxima conduta?',
      alts: ['Iniciar insulina regular em bomba a 0,1 UI/kg/h imediatamente', 'Administrar bicarbonato de sódio', 'Repor potássio e adiar a insulina até K ≥ 3,3 mEq/L', 'Trocar a hidratação para soro glicosado a 5%', 'Iniciar insulina e repor potássio ao mesmo tempo'], gab: 'C',
      com: 'A insulina leva o potássio para dentro da célula e pode precipitar hipocalemia grave e arritmias. Com K < 3,3 mEq/L, repõe-se potássio primeiro e só depois se inicia a insulina. Bicarbonato fica reservado para pH < 6,9.'
    },
    {
      area: 'Cirurgia', especialidade: 'Cirurgia Geral', tema: 'Hérnias da Parede Abdominal', subtema: 'Hérnia Inguinal',
      enunciado: 'Durante uma hernioplastia inguinal, o cirurgião identifica que o saco herniário se projeta através do triângulo de Hesselbach, medialmente aos vasos epigástricos inferiores.\n\nComo se classifica essa hérnia?',
      alts: ['Indireta', 'Direta', 'Femoral', 'De Spiegel', 'Obturadora'], gab: 'B',
      com: 'O triângulo de Hesselbach é limitado pelos vasos epigástricos inferiores, pela borda lateral do reto abdominal e pelo ligamento inguinal. Hérnias que o atravessam (mediais aos epigástricos) são diretas; as indiretas passam pelo anel inguinal profundo, laterais aos vasos.'
    },
    {
      area: 'Pediatria', especialidade: 'Neonatologia', tema: 'Icterícia Neonatal', subtema: 'Avaliação',
      enunciado: 'Recém-nascido a termo, em alojamento conjunto, apresenta icterícia visível na face e no tronco com 18 horas de vida. Mãe O+, RN A+.\n\nQual a interpretação mais adequada?',
      alts: ['Icterícia fisiológica; reavaliar em 48 horas', 'Icterícia do leite materno; suspender amamentação', 'Icterícia patológica; investigar hemólise e dosar bilirrubinas', 'Normal para a idade; alta com orientação', 'Sugere atresia de vias biliares'], gab: 'C',
      com: 'Icterícia nas primeiras 24 horas de vida é sempre patológica. Com mãe O e RN A, a incompatibilidade ABO é a principal hipótese: dosar bilirrubina total e frações, hemograma, reticulócitos e Coombs direto.'
    },
    {
      area: 'Pediatria', especialidade: 'Infectologia Pediátrica', tema: 'Doenças Exantemáticas', subtema: 'Exantema Súbito',
      enunciado: 'Lactente de 11 meses teve febre alta (39,5 °C) por 3 dias, em bom estado geral. No dia em que a febre cedeu, surgiu exantema maculopapular róseo em tronco, que poupa a face.\n\nQual o agente mais provável?',
      alts: ['Parvovírus B19', 'Herpesvírus humano tipo 6', 'Vírus do sarampo', 'Streptococcus pyogenes', 'Vírus da rubéola'], gab: 'B',
      com: 'Exantema súbito (roséola infantum): febre alta por 3 a 5 dias e exantema que aparece quando a febre desaparece, típico de lactentes. O agente é o HHV-6 (menos frequentemente o HHV-7).'
    },
    {
      area: 'Ginecologia', especialidade: 'Endocrinologia Ginecológica', tema: 'Síndrome dos Ovários Policísticos', subtema: 'Diagnóstico',
      enunciado: 'Pelos critérios de Rotterdam, o diagnóstico de síndrome dos ovários policísticos exige:',
      alts: ['Os três critérios: oligo/anovulação, hiperandrogenismo e ovários policísticos ao ultrassom', 'Dois de três critérios, após exclusão de outras causas', 'Hiperandrogenismo obrigatório associado a um dos outros critérios', 'Resistência insulínica comprovada', 'Relação LH/FSH maior que 2'], gab: 'B',
      com: 'Rotterdam (2003): dois de três critérios — oligo/anovulação, hiperandrogenismo clínico ou laboratorial, morfologia ovariana policística — excluídas outras causas (hiperprolactinemia, tireoidopatias, hiperplasia adrenal congênita não clássica). Hiperandrogenismo obrigatório é o critério da Androgen Excess Society.'
    },
    {
      area: 'Obstetrícia', especialidade: 'Obstetrícia Patológica', tema: 'Doenças Hipertensivas da Gestação', subtema: 'Sulfato de Magnésio',
      enunciado: 'Gestante com pré-eclâmpsia grave recebe sulfato de magnésio (esquema de Zuspan).\n\nQual o primeiro sinal clínico de intoxicação a ser monitorado?',
      alts: ['Depressão respiratória', 'Abolição do reflexo patelar', 'Parada cardíaca', 'Oligúria', 'Rebaixamento do nível de consciência'], gab: 'B',
      com: 'O reflexo patelar desaparece com magnesemia em torno de 8 a 10 mEq/L, antes da depressão respiratória (~12) e da parada cardíaca. Também se monitoram diurese (> 25 mL/h) e frequência respiratória (> 16 irpm). O antídoto é o gluconato de cálcio 10%.'
    },
    {
      area: 'Obstetrícia', especialidade: 'Assistência ao Parto', tema: 'Hemorragia Pós-parto', subtema: 'Etiologia',
      enunciado: 'Qual a causa mais frequente de hemorragia pós-parto primária?',
      alts: ['Laceração de trajeto', 'Retenção placentária', 'Atonia uterina', 'Coagulopatia', 'Inversão uterina'], gab: 'C',
      com: 'Pelo mnemônico dos 4 Ts (Tônus, Trauma, Tecido, Trombina), o tônus — atonia uterina — responde pela grande maioria dos casos, em torno de 70%.'
    },
    {
      area: 'Medicina Preventiva', especialidade: 'Epidemiologia', tema: 'Testes Diagnósticos', subtema: 'Valores Preditivos',
      enunciado: 'Um teste foi aplicado em 1.000 pessoas, das quais 100 têm a doença. Entre os doentes, 90 tiveram teste positivo; entre os sadios, 90 tiveram teste positivo.\n\nQual o valor preditivo positivo do teste?',
      alts: ['10%', '50%', '90%', '81%', '95%'], gab: 'B',
      com: 'VPP = VP / (VP + FP) = 90 / (90 + 90) = 50%. Repare que a sensibilidade é 90% (90/100) e a especificidade também é 90% (810/900), mas com prevalência de 10% metade dos positivos são falsos.'
    },
    {
      area: 'Medicina Preventiva', especialidade: 'Políticas de Saúde', tema: 'SUS', subtema: 'Princípios e Diretrizes',
      enunciado: 'Qual das opções corresponde a um princípio organizativo (e não doutrinário) do SUS?',
      alts: ['Universalidade', 'Integralidade', 'Equidade', 'Descentralização', 'Igualdade'], gab: 'D',
      com: 'Doutrinários: universalidade, integralidade e equidade. Organizativos: descentralização (com direção única em cada esfera), regionalização e hierarquização, e participação da comunidade.'
    },
    {
      area: 'Clínica Médica', especialidade: 'Pneumologia', tema: 'Tromboembolismo Pulmonar', subtema: 'Diagnóstico',
      enunciado: 'Mulher de 35 anos, sem comorbidades, com dor torácica pleurítica leve. Escore de Wells calculado em 1 ponto (TEP improvável), estável hemodinamicamente.\n\nQual o próximo passo?',
      alts: ['Angiotomografia de tórax imediatamente', 'Dosar D-dímero', 'Anticoagulação plena empírica', 'Cintilografia ventilação/perfusão', 'Ecocardiograma transtorácico'], gab: 'B',
      com: 'Com probabilidade pré-teste baixa (TEP improvável), o D-dímero tem alto valor preditivo negativo: se normal, exclui TEP. Se elevado, segue-se para a angiotomografia.'
    },
    {
      area: 'Clínica Médica', especialidade: 'Infectologia', tema: 'HIV', subtema: 'Profilaxia Pós-exposição',
      enunciado: 'Profissional de saúde sofre acidente percutâneo com material biológico de paciente HIV positivo.\n\nSobre a profilaxia pós-exposição (PEP), é correto afirmar:',
      alts: ['Deve ser iniciada em até 72 horas e mantida por 28 dias', 'Só é indicada se o paciente-fonte tiver carga viral detectável', 'Deve ser mantida por 7 dias', 'Pode ser iniciada em até 7 dias após a exposição', 'Dispensa testagem do acidentado'], gab: 'A',
      com: 'A PEP deve começar o quanto antes, idealmente nas 2 primeiras horas e no máximo em 72 horas, e durar 28 dias. Testa-se o acidentado no momento basal e no seguimento.'
    }
  ];

  MQ.seedIfEmpty = function () {
    if (MQ.local.seeded) return;
    if (MQ.alive('questions').length === 0) {
      /* IDs e datas fixos: os exemplos são iguais em todos os aparelhos e não se duplicam
         ao sincronizar; se forem apagados num aparelho, a exclusão (mais recente) vale para todos. */
      SEED.forEach((s, i) => {
        const letters = 'ABCDE';
        const id = 'exemplo-' + String(i + 1).padStart(2, '0');
        if (MQ.data.questions[id]) return;
        MQ.data.questions[id] = Object.assign({}, BASE, {
          id, codigo: 'EX-' + String(i + 1).padStart(2, '0'),
          area: s.area, especialidade: s.especialidade, tema: s.tema, subtema: s.subtema,
          enunciado: s.enunciado,
          alternativas: s.alts.map((t, k) => ({ l: letters[k], t })),
          gabarito: s.gab, comentario: s.com, anulada: false, desatualizada: false,
          createdAt: 1, updatedAt: 1
        });
      });
      MQ.touch();
    }
    MQ.local.seeded = true;
    MQ.saveLocal();
  };
})(window.MQ);
