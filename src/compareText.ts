// compareText.ts
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
