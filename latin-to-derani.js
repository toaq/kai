// Loose transcription of https://github.com/toaq/chuotiai/blob/947ef08ebdac89644f7b5d1c89d42bd7bf83b02e/deran%C4%B1_from_latin.py, originally licensed CC0.

const MATRIX_SUBORDINATORS = ["ꝡa", "ma", "tıo"],
      NOMINAL_SUBORDINATORS = ["ꝡä", "mä", "tïo", "lä", "ꝡé", "ná"],
      ADNOMINAL_SUBORDINATORS = ["ꝡë", "jü"],
      PREDICATIZERS = ["jeı", "mea", "po"],
      QUOTE_MARKERS = ["mı", "shu", "mo"],
      DETERMINERS = ["ló", "ké", "sá", "sía", "tú", "túq", "báq", "já", "hí", "ní", "hú"],
      CONJUNCTIONS = ["róı", "rú", "rá", "ró", "rí", "kéo"],
      FALLING_TONE_ILLOCUTIONS = ["ka", "da", "ba", "nha", "doa", "ꝡo"],
      PEAKING_TONE_ILLOCUTIONS = ["dâ", "môq"],
      RISING_TONE_ILLOCUTIONS = ["móq"],
      ILLOCUTIONS = [].concat(FALLING_TONE_ILLOCUTIONS, RISING_TONE_ILLOCUTIONS, PEAKING_TONE_ILLOCUTIONS),
      FOCUS_MARKERS = ["kú", "tóu", "béı", "máo", "júaq"],
      CLEFT_CONSTRUCTIONS = ["bï", "nä", "gö"],
      PARENTHETICALS = ["kïo"],
      VOCATIVES = ["hóı"],
      TERMINATORS = ["teo", "kı"],
      EXOPHORIC_PRONOUNS = ["jí", "súq", "nháo", "súna", "nhána", "úmo", "íme", "súho", "áma", "há"],
      ENDOPHORIC_PRONOUNS = ["hó", "máq", "tá", "hóq", "áq", "chéq", "hóa"],
      PRONOUNS = [].concat(EXOPHORIC_PRONOUNS, ENDOPHORIC_PRONOUNS),
      FUNCTORS_WITH_LEXICAL_TONE = [].concat(MATRIX_SUBORDINATORS, NOMINAL_SUBORDINATORS, ADNOMINAL_SUBORDINATORS,
                                             DETERMINERS, CONJUNCTIONS, ILLOCUTIONS, FOCUS_MARKERS,
                                             CLEFT_CONSTRUCTIONS, PARENTHETICALS, VOCATIVES, TERMINATORS),
      FUNCTORS_WITH_GRAMMATICAL_TONE = [].concat(PREDICATIZERS, QUOTE_MARKERS);

const NFD_CARTOUCHELESS_WORDS = [].concat(PRONOUNS, DETERMINERS, FUNCTORS_WITH_LEXICAL_TONE,
                                          FUNCTORS_WITH_GRAMMATICAL_TONE.map(f => // inflected_from_lemma
                                            f.replace(/[aeıou]/, v => `${v}\u0301`)))
                                  .map(w => w.normalize('NFD').replace(/i/g, _ => 'ı'));

const MONOGRAPH_MAP = new Map([
                        ['m', ''], ['b', ''], ['p', ''], ['f', ''],
                                    ['u', ''],             ['e', ''],
                        ['n', ''], ['d', ''], ['t', ''], ['z', ''], ['c', ''], ['s', ''], ['r', ''], ['l', ''],
                                                                        ['ı', ''], ['a', ''],
                        ['j', ''], ['ꝡ', ''], ['q', ''], ['g', ''], ['k', ''], [`'`, ''], ['h', ''],
                                                            ['o', ''],             ['ʼ', ''],
                        ['\u0301', ''], ['\u0308', ''], ['\u0302', ''], // ['\u0323', ''],
                        ['-', ''], [':', ''], [',', ' '], ['[', ''], [']', ''], ['.', ' '], [';', ' '], ['?', ' ']
                      ]),
        DIGRAPH_MAP = new Map([
                        ['nh', ''], ['ch', ''], ['sh', ''],
                        ['aı', ''], ['ao', ''], ['oı', ''], ['eı', ''],
                        ['[]', '']
                      ]);

const CONSONANTS = `'bcdfghjklmnprstzqꝡ`;

const REGEXEN = [[/i/, _ => 'ı'],
                 [`(^|[^${CONSONANTS}aeıou\u0323])([aeıou](aı|ao|eı|oı|s|f|c|g|b))`,
                  (_, initial, rime) => `${initial}'${rime}`],
                 [`[${CONSONANTS}]h?[aeıou][\u0323]?[\u0301][${CONSONANTS}aeıou\u0323]*`,
                  w => // add_cartouche
                    !NFD_CARTOUCHELESS_WORDS.includes(w) &&
                    !['hu\u0301\u0323', 'hu\u0323\u0301'].some(hu => w.includes(hu))
                    ? `${w}` : w],
                 [`\u0323([\u0301\u0302\u0323]?[aeıou]?[mq]?)([${CONSONANTS}])`,
                  (_, tail, stem) => `${tail}${stem}`],
                 [/([aeıou])([\u0301\u0308\u0302])/,
                  (_, vowel, tone) => tone + vowel],
                 [/(?!(?:aı|ao|eı|oı))([aeıou])((?!(aı|ao|eı|oı))[aeıou])/,
                  (_, nucleus1, nucleus2) => `${nucleus1}${nucleus2}`],
                 [/([aeıou])m/, (_, vowel) => `${vowel}`],
                 [/ (da)[.…]/,                                  (_, illoc) => ` ${illoc} `],
                 [/ (ka|ba|nha|doa|ꝡo|da\u0302|mo\u0302q)[.…]/, (_, illoc) => ` ${illoc} `],
                 [/ (mo\u0301q)[.…?]/,                          (_, illoc) => ` ${illoc} `],
                ]
                 .map(([re, sub]) => [new RegExp(re, 'g'), sub]);

function latinToDerani(lt) {
  lt = lt.toLowerCase().normalize('NFD');
  lt = REGEXEN.reduce((lt, [re, sub]) => lt.replace(re, sub), lt);

  let accum = '';
  for(let i = 0; i < lt.length;) {
    let didReplace = false;
    for(let [map, span] of [[DIGRAPH_MAP, 2], [MONOGRAPH_MAP, 1]]) {
      let substr = lt.substring(i, i + span);
      if(map.has(substr)) {
        didReplace = true;
        accum += map.get(substr);
        i += span;
        break;
      }
    }
    if(!didReplace) {
      accum += lt.substring(i, i + 1);
      i++;
    }
  }
  // TODO: [copied from original]
  //   ◆ Cartouches : handle PO, SHU, MO…
  //   ◆ Cartouches : t1 words following determiners.
  //   ◆ Empty cartouche
  //   ◆ ⟪▓▓⟫: shu-names, onomastics
  return accum;
}
