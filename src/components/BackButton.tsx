import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';

type Props = {
  onPress: () => void;
  label?: string;
};

export function BackButton({onPress, label = 'Назад'}: Props): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <View style={styles.row}>
        <Text style={styles.arrow}>←</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrow: {
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    includeFontPadding: false,
  },
  label: {
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    includeFontPadding: false,
  },
});
