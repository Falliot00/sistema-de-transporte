export function calculateLinearTrend(values: number[]): number[] {
  if (values.length === 0) {
    return [];
  }

  if (values.length === 1) {
    return [values[0]];
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  values.forEach((value, index) => {
    sumX += index;
    sumY += value;
    sumXY += index * value;
    sumXX += index * index;
  });

  const n = values.length;
  const denominator = n * sumXX - sumX * sumX;

  if (denominator === 0) {
    const average = sumY / n;
    return values.map(() => Number(average.toFixed(2)));
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return values.map((_, index) => Number(Math.max(0, slope * index + intercept).toFixed(2)));
}
