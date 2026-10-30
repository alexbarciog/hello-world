// Client-side text metrics for the free tools. No network: these show even if
// the AI part is unavailable.

export interface TextMetrics {
  firstLine: string;
  firstLineWords: number;
  firstLineChars: number;
  words: number;
  chars: number;
  sentences: number;
  /** Flesch-Kincaid US school grade, rounded. */
  readingGrade: number;
}

const countSyllables = (word: string): number => {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return w ? 1 : 0;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(groups?.length ?? 1, 1);
};

export function analyzeText(text: string): TextMetrics {
  const trimmed = text.trim();
  const firstLine = trimmed.split(/\r?\n/).find((l) => l.trim())?.trim() ?? "";
  const wordList: string[] = trimmed.match(/[\p{L}\p{N}'’-]+/gu) ?? [];
  const sentences = Math.max((trimmed.match(/[.!?]+(?=\s|$)/g) ?? []).length, trimmed ? 1 : 0);
  const syllables = wordList.reduce((n, w) => n + countSyllables(w), 0);
  const grade = wordList.length
    ? 0.39 * (wordList.length / sentences) + 11.8 * (syllables / wordList.length) - 15.59
    : 0;
  return {
    firstLine,
    firstLineWords: (firstLine.match(/[\p{L}\p{N}'’-]+/gu) ?? []).length,
    firstLineChars: firstLine.length,
    words: wordList.length,
    chars: trimmed.length,
    sentences,
    readingGrade: Math.max(Math.round(grade), 0),
  };
}

/** Plain-language reading level for a grade number. */
export function readingLabel(grade: number): string {
  if (grade <= 6) return "Very easy to read";
  if (grade <= 9) return "Easy to read";
  if (grade <= 12) return "Takes some effort";
  return "Hard to read on a phone";
}
