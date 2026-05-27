import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React from 'react';
import {StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppButton} from '../components/AppButton';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export function WelcomeScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>MVP</Text>
          <Text style={styles.title}>Ранок Розсудить</Text>
          <Text style={styles.subtitle}>
            Додаток, який допомагає не дзвонити, не писати і не влаштовувати
            нічну драму, коли краще просто поспати.
          </Text>
        </View>

        <AppButton
          label="Почати"
          onPress={() => navigation.replace('Home')}
        />
      </View>

      <Text style={styles.footer}>
        Твій нічний захист від драматичних рішень.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  eyebrow: {
    marginBottom: 14,
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 48,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 18,
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
