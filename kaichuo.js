const d1 = '';
const d2 = '\u0301';
const d3 = '\u0308';
const d4 = '\u0302';
const underdot = '\u0323';

const toneKeys = new Map([
  ['/', d2], ['2', d2],
  ['"', d3], ['3', d3],
  ['^', d4], ['4', d4],
]);

const compose = new Map([
  ['i', 'ı'],
  ['v', 'ꝡ'],
  ['V', 'Ꝡ'],

  ['ı0', 'i'],
  ['<<', '«'],
  ['<:', '‹'],
  ['>>', '»'],
  ['>:', '›'],
  ['[[', '⟦'],
  [']]', '⟧'],
]);

const wordTones = new Map([
  ...[ ...PRONOUNS,
       ...QUOTE_MARKERS,
       ...FOCUS_MARKERS,
       ...DETERMINERS,
       ...CONJUNCTIONS,
       ...VOCATIVES,
       ...RISING_TONE_ILLOCUTIONS ]
     .map(w => [adorn(w, ''), d2]),
  ...[ "ꝡe", "ju", "la", // d3-only complementizers
       ...CLEFT_CONSTRUCTIONS,
       ...PARENTHETICALS ]
     .map(w => [adorn(w, ''), d3])
  ]);

const reWordAtEnd = /[\p{L}'’]+1?$/iu;
const reConvertKey = /^([ ,.;:?!…>»"'“”‘’]|Enter)$/iu;
const keyChar = key => key === 'Enter' ? '\n' : key;

// Add a tone to a vowel, syllable, or word.
// adorn('u',       t3) === 'ü'       (normalized)
// adorn('fıeq',    t2) === 'fíeq'    (normalized)
// adorn('Ruqshua', t4) === 'Rûqshua' (normalized)
function adorn(text, tone) {
  text = text
    .normalize("NFKD").replace(/[\u0300-\u030f]/g, '')
    .replace(/[aeıiou]/iu, v => v.replace('ı', 'i') + tone);
  return normalizeToaq(text);
}

// Add an underdot to the last position in a word, and remove all others
// (assuming the user will continue typing without calling this fn again)
//
// adornUnderdot('bọhạbuq') === 'bohabụq' (normalized)
function adornUnderdot(text) {
  text = text.normalize("NFKD").replace(/\u0323/g, '');
  // is there seriously no better way to do this?
  let match, lastMatch;
  let re = /(?:[aeıiou]\p{Mn}*)+/giu;
  while(match = re.exec(text)) {
    lastMatch = match;
  }
  // add 1 to skip past the first vowel, that's where we insert the diacritic
  let i = lastMatch.index + 1;
  text = text.slice(0, i) + underdot + text.slice(i);
  return normalizeToaq(text);
}

// Unicode NFC normalization will normalize ị̂ as ị+◌̂, which looks bad; switch those cases out for î+◌̣
// Also, swap `i` for `ı`
function normalizeToaq(text) {
  return text
    .normalize()
    .replace(
      /([ạẹịọụ])(\p{Mn}+)/giu,
      (_, v, ds) => (v.normalize("NFD")[0] + ds).normalize() + underdot
    )
    .replace('i', 'ı');
}

// Add automatic diacritics to an input word.
function convert(word) {
  // trailing 1: force no tone marker
  if(/1$/.test(word)) {
    return adorn(word.slice(0, -1), '');
  }
  // otherwise: insert default tone if we have one
  let wordTone = wordTones.get(word.toLowerCase());
  if(wordTone) word = adorn(word, wordTone);
  return word;
}

window.addEventListener('DOMContentLoaded', (_) => {
  const kai = document.getElementById('kai');
  kai.value = localStorage.getItem('kai');
  kai.addEventListener('input', (e) => {
    let ch, tone;
    const size = (e.data ?? "").length;
    // document.getElementById("help-summary").innerText = `d:${e.data} c:${e.isComposing}`;

    let buf = kai.value.substring(0, kai.selectionStart - size);
    const post = kai.value.substring(kai.selectionEnd);

    for (const key of [...e.data ?? ""]) {
      const previous = buf[buf.length - 1] || "";
      const previousLength = buf.length;
      const previousWasLetter = /\p{L}/iu.test(previous);

      // Attach underdot.
      if (previous === '-') {
        buf = buf.substring(0, buf.length - 1).replace(reWordAtEnd, adornUnderdot)
            + ("aeıiou".includes(key) ? "'" : '');
      }

      // Compose characters.
      if (ch = compose.get(key)) {
        buf = buf + ch;
      } else if (ch = compose.get(previous + key)) {
        buf = buf.replace(/.$/, ch);

      // Attach tones.
      } else if ((tone = toneKeys.get(key))
                // Digits only act as tone converters right after a letter:
                && !(/[0-9]/.test(key) && !previousWasLetter)
            ) {
        // Manually add a tone to the last word.
        buf = buf.replace(reWordAtEnd, word => adorn(word, tone));
      } else if (reConvertKey.test(key)) {
        // Automatically add tones to the last word.
        buf = buf.replace(reWordAtEnd, convert) + keyChar(key);

      } else {
        buf += key;
      }
    }

    const script = document.getElementById('select-writing-system').selectedOptions[0].value;
    if(script == 'derani-pua') {
      const splittingPoint = buf.lastIndexOf(' ');
      buf = latinToDerani(buf.substring(0, splittingPoint)) + buf.substring(splittingPoint);
    }

    kai.value = buf + post;
    kai.selectionStart = kai.selectionEnd = buf.length;
    localStorage.setItem('kai', kai.value);
  });
});
