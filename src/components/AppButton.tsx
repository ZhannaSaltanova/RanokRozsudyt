import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function AppButton({
  label,
  onPress,
  disabled = false,
}: AppButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.button,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}>
      <Text style={[styles.text, disabled && styles.textDisabled]}>
        {label}
      </Text>
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
  buttonDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    color: colors.onPrimary,
    fontFamily: fonts.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  textDisabled: {
    color: colors.subtleText,
  },
});
