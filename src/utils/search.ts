import type { Exercise } from '../types';

// Lowercase and strip accents character by character, so the result has the
// same length as the input and match positions map back onto the original.
export function fold(text: string): string {
  let out = '';
  for (const ch of text) out += ch.normalize('NFD')[0].toLowerCase();
  return out;
}

function tokens(query: string): string[] {
  return fold(query.trim()).split(/\s+/).filter(Boolean);
}

// Matches every word of the query (any order, accents optional) against the
// exercise name, muscle group and equipment. Best matches first: names that
// start with the query, then names containing it, then the rest.
export function searchExercises(list: Exercise[], query: string): Exercise[] {
  const words = tokens(query);
  if (words.length === 0) return list;
  const whole = words.join(' ');

  const scored: { e: Exercise; score: number }[] = [];
  for (const e of list) {
    const name = fold(e.name);
    const haystack = `${name} ${fold(e.muscle)} ${fold(e.equipment)}`;
    if (!words.every((w) => haystack.includes(w))) continue;
    const score = name.startsWith(whole) ? 0 : name.includes(whole) ? 1 : words.every((w) => name.includes(w)) ? 2 : 3;
    scored.push({ e, score });
  }
  return scored.sort((a, b) => a.score - b.score || a.e.name.localeCompare(b.e.name, 'es')).map((s) => s.e);
}

// Splits text into plain and matched parts for highlighting the query words.
export function highlightParts(text: string, query: string): { text: string; match: boolean }[] {
  const words = tokens(query);
  if (words.length === 0) return [{ text, match: false }];
  const folded = fold(text);
  const marked = new Array<boolean>(text.length).fill(false);
  for (const w of words) {
    let from = 0;
    for (let i = folded.indexOf(w, from); i !== -1; i = folded.indexOf(w, from)) {
      for (let k = i; k < i + w.length; k++) marked[k] = true;
      from = i + w.length;
    }
  }
  const parts: { text: string; match: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = parts[parts.length - 1];
    if (last && last.match === marked[i]) last.text += text[i];
    else parts.push({ text: text[i], match: marked[i] });
  }
  return parts;
}
