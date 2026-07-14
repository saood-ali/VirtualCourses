// Lightweight, deterministic sentence splitter.
// No external NLP dependency. It avoids the common failure modes of a naive
// split on ".": abbreviations, decimal numbers, and dotted programming syntax
// (e.g. Node.js, array.map(), file.txt) are preserved instead of being split.

// Words that commonly end with a period without ending a sentence.
const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "vs", "etc", "inc", "ltd",
  "co", "eg", "ie", "e.g", "i.e", "fig", "al", "dept", "gov", "approx", "min",
  "max", "no", "vol", "pp", "jan", "feb", "mar", "apr", "jun", "jul", "aug",
  "sep", "sept", "oct", "nov", "dec",
  // Academic / dotted abbreviations common in educational content.
  "u.s.a", "u.s", "u.k", "ph.d", "b.tech", "m.tech", "b.sc", "m.sc", "b.e",
  "b.a", "m.a", "b.ed", "a.m", "p.m",
]);

// Matches a multi-dotted acronym/abbreviation ending in a period, e.g.
// "U.S.A.", "Ph.D.", "B.Tech." — these must not be treated as sentence ends.
const DOTTED_ACRONYM = /(?:[A-Za-z]\.){2,}$|[A-Za-z]+\.[A-Za-z]+\.$/;

// Heading-like line heuristic (deterministic, conservative to avoid false
// positives on ordinary short sentences): a markdown-style heading, or a short
// line (<=8 words) that ends with ":" and has no sentence-ending punctuation.
const isHeadingLike = (line) => {
  if (/^#{1,6}\s/.test(line)) return true;
  const words = line.split(/\s+/);
  if (words.length > 8) return false;
  if (/[.!?]$/.test(line)) return false;
  return line.endsWith(":");
};

export const splitIntoSentences = (text) => {
  if (!text) return [];

  const sentences = [];
  let buffer = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    buffer += char;

    if (char === "." || char === "!" || char === "?") {
      const next = text[i + 1];
      const prev = text[i - 1];

      // Decimal number, e.g. "3.14" — digit "." digit is not a boundary.
      if (char === "." && /\d/.test(prev) && /\d/.test(next)) continue;

      // Dotted token with no following whitespace, e.g. "Node.js", "file.txt".
      if (char === "." && next && !/\s/.test(next)) continue;

      // A boundary requires end-of-text or trailing whitespace.
      if (!next || /\s/.test(next)) {
        // Guard against known abbreviations directly before the period.
        const words = buffer.trim().split(/\s+/);
        const rawLastWord = words[words.length - 1];
        const lastWord = rawLastWord.replace(/[.!?]+$/, "").toLowerCase();
        if (char === "." && ABBREVIATIONS.has(lastWord)) continue;

        // Guard against multi-dotted acronyms, e.g. "U.S.A.", "Ph.D.", "B.Tech.".
        if (char === "." && DOTTED_ACRONYM.test(rawLastWord)) continue;

        const trimmed = buffer.trim();
        if (trimmed) sentences.push(trimmed);
        buffer = "";
      }
    }
  }

  const tail = buffer.trim();
  if (tail) sentences.push(tail);

  return sentences;
};

/**
 * Segment a transcript into sentences tagged with a deterministic
 * `breakBefore` flag that marks a likely topic boundary. A boundary is a
 * paragraph break (blank line) or a heading-like line — no LLM involved.
 *
 * @param {string} text normalized transcript
 * @returns {{ text: string, breakBefore: boolean }[]}
 */
export const segmentTranscript = (text) => {
  if (!text) return [];

  // Paragraphs are separated by one or more blank lines.
  const paragraphs = text.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);

  const segments = [];
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const lines = paragraph.split(/\n/).map((l) => l.trim()).filter(Boolean);

    lines.forEach((line) => {
      const heading = isHeadingLike(line);
      const lineSentences = splitIntoSentences(line);

      lineSentences.forEach((sentence, sentenceIndex) => {
        // A break precedes the first sentence of a new paragraph, or the first
        // sentence of a heading-like line.
        const isParagraphStart = paragraphIndex > 0 && sentenceIndex === 0 && segments.length > 0;
        const breakBefore = sentenceIndex === 0 && (isParagraphStart || heading);
        segments.push({ text: sentence, breakBefore });
      });
    });
  });

  return segments;
};

export default splitIntoSentences;
