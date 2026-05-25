import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';

type AppButtonProps = {
  label: string;
  onPress: () => void;
};

export function AppButton({label, onPress}: AppButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.button, pressed && styles.buttonPressed]}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 340,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  text: {
    color: colors.onPrimary,
    fontFamily: fonts.primary,
    fontSize: 18,
    fontWeight: '700',
  },
});
