import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useDailyPrediction} from '../hooks/useDailyPrediction';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import type {PredictionStyle} from '../data/predictions';

const styleLabels: Record<PredictionStyle, string> = {
  horoscope: '🔮 Передбачення дня',
  affirmation: '✨ Для тебе сьогодні',
  humor: '❤️‍🩹 Правда-матка',
};

const accentColors: Record<PredictionStyle, string> = {
  horoscope: '#7C5CBF',
  affirmation: '#C0557A',
  humor: '#C07A1A',
};

export function DailyPredictionCard(): React.JSX.Element {
  const {prediction, dateLabel} = useDailyPrediction();
  const accent = accentColors[prediction.style];

  return (
    <View style={[styles.card, {borderColor: accent + '40'}]}>
      {/* Верхній рядок */}
      <View style={styles.topRow}>
        <Text style={[styles.label, {color: accent}]}>
          {styleLabels[prediction.style]}
        </Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>

      {/* Емодзі */}
      <Text style={styles.emoji}>{prediction.emoji}</Text>

      {/* Текст */}
      <Text style={styles.text}>{prediction.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: fonts.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: {
    fontFamily: fonts.primary,
    fontSize: 12,
    color: colors.subtleText,
  },
  emoji: {
    fontSize: 36,
  },
  text: {
    fontFamily: fonts.primary,
    fontSize: 17,
    lineHeight: 26,
    color: colors.text,
    fontWeight: '500',
  },
});
