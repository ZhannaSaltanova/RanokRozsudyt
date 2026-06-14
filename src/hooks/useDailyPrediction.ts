import {predictions} from '../data/predictions';

export function useDailyPrediction() {
  const today = new Date();

  // Унікальний індекс для кожного дня року — однакове передбачення весь день
  const dayOfYear =
    Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24),
    ) - 1;

  const index = dayOfYear % predictions.length;
  const prediction = predictions[index];

  const dateLabel = today.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
  });

  return {prediction, dateLabel};
}
