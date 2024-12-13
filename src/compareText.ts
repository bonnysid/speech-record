export const compareText = (recognizedText: string, expectedText: string): number => {
  const levenshteinDistance = (a: string, b: string): number => {
    const tmp: number[][] = [];
    const alen = a.length;
    const blen = b.length;

    for (let i = 0; i <= alen; i++) {
      tmp[i] = [i];
    }

    for (let j = 0; j <= blen; j++) {
      tmp[0][j] = j;
    }

    for (let i = 1; i <= alen; i++) {
      for (let j = 1; j <= blen; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        tmp[i][j] = Math.min(tmp[i - 1][j] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j - 1] + cost);
      }
    }
    return tmp[alen][blen];
  };

  const distance = levenshteinDistance(recognizedText, expectedText);
  const maxLength = Math.max(recognizedText.length, expectedText.length);
  const accuracy = ((maxLength - distance) / maxLength) * 100;
  return accuracy;
};

const calculateWER = (reference: string, hypothesis: string): number => {
  const refWords = reference.split(" ");
  const hypWords = hypothesis.split(" ");

  const distance = levenshtein(refWords, hypWords);
  return distance / refWords.length; // WER = (S + D + I) / N
};

const calculateCER = (reference: string, hypothesis: string): number => {
  const refChars = reference.split("");
  const hypChars = hypothesis.split("");

  const distance = levenshtein(refChars, hypChars);
  return distance / refChars.length; // CER = (S + D + I) / N
};

function levenshtein(a: string[], b: string[]): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // удаление
        matrix[i][j - 1] + 1, // вставка
        matrix[i - 1][j - 1] + cost // замена
      );
    }
  }
  return matrix[a.length][b.length];
}

const calculateBLEU = (reference: string, hypothesis: string): number => {
  const refWords = reference.split(" ");
  const hypWords = hypothesis.split(" ");

  let matches = 0;
  for (let i = 0; i < Math.min(refWords.length, hypWords.length); i++) {
    if (refWords[i] === hypWords[i]) matches++;
  }

  return matches / refWords.length;
};

// Экспорт всех функций
export { calculateWER, calculateCER, calculateBLEU };
