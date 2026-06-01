import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useCallback, useMemo, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import {useBlockedContacts} from '../context/ContactsContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SoberTest'>;
type Route = RouteProp<RootStackParamList, 'SoberTest'>;

const TARGET_PHRASE = 'Я подумаю про це вранці';

function generateMathQuestion(): {question: string; answer: number} {
  const a = Math.floor(Math.random() * 15) + 1;
  const b = Math.floor(Math.random() * 15) + 1;
  const useAdd = Math.random() > 0.4;
  if (useAdd) {
    return {question: `${a} + ${b} = ?`, answer: a + b};
  }
  const [big, small] = a >= b ? [a, b] : [b, a];
  return {question: `${big} - ${small} = ?`, answer: big - small};
}

export function SoberTestScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {contactName, action, riskScore, contactId} = route.params;
  const {logAttempt} = useBlockedContacts();

  const testType = useMemo<'phrase' | 'math'>(
    () => (Math.random() > 0.5 ? 'phrase' : 'math'),
    [],
  );
  const math = useMemo(generateMathQuestion, []);

  const [input, setInput] = useState('');
  const [passed, setPassed] = useState(false);

  const isPhraseCorrect = input === TARGET_PHRASE;
  const isMathCorrect =
    input.trim() !== '' && parseInt(input.trim(), 10) === math.answer;
  const canSubmit = testType === 'phrase' ? isPhraseCorrect : isMathCorrect;

  const errorCount = useMemo(() => {
    if (testType !== 'phrase') {return 0;}
    let errors = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] !== TARGET_PHRASE[i]) {errors++;}
    }
    return errors;
  }, [input, testType]);

  const riskColor =
    riskScore >= 80
      ? '#E53935'
      : riskScore >= 60
      ? '#F9A825'
      : colors.primary;

  const actionLabel = action === 'call' ? 'зателефонувати' : 'написати';

  const handleSubmit = useCallback(() => {
    logAttempt({
      contactId,
      contactName,
      action,
      result: 'passed',
      timestamp: Date.now(),
      riskScore,
    });
    setPassed(true);
    setTimeout(() => navigation.goBack(), 1500);
  }, [logAttempt, contactId, contactName, action, riskScore, navigation]);

  const handleAbandon = useCallback(() => {
    logAttempt({
      contactId,
      contactName,
      action,
      result: 'abandoned',
      timestamp: Date.now(),
      riskScore,
    });
    navigation.goBack();
  }, [logAttempt, contactId, contactName, action, riskScore, navigation]);

  if (passed) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successText}>Тест пройдено</Text>
          <Text style={styles.successSub}>Зараз перенаправляємо...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <View style={styles.header}>
          <Pressable onPress={handleAbandon} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Назад</Text>
          </Pressable>

          <View style={[styles.riskBadge, {backgroundColor: riskColor + '25', borderColor: riskColor}]}>
            <Text style={[styles.riskLabel, {color: riskColor}]}>
              Індекс імпульсу: {riskScore}/100
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Перевірка перед дією</Text>
          <Text style={styles.sub}>
            Ти хочеш {actionLabel}{' '}
            <Text style={styles.contactName}>{contactName}</Text>
          </Text>

          <View style={styles.testCard}>
            {testType === 'phrase' ? (
              <>
                <Text style={styles.testLabel}>Набери фразу без помилок:</Text>
                <Text style={styles.targetPhrase}>{TARGET_PHRASE}</Text>
                <TextInput
                  style={[
                    styles.input,
                    errorCount > 0 && styles.inputError,
                    isPhraseCorrect && styles.inputSuccess,
                  ]}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Починай набирати..."
                  placeholderTextColor={colors.subtleText}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errorCount > 0 && (
                  <Text style={styles.errorHint}>
                    {errorCount} {errorCount === 1 ? 'помилка' : 'помилок'} — спробуй ще раз
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.testLabel}>Розв'яжи приклад:</Text>
                <Text style={styles.mathQuestion}>{math.question}</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputCenter,
                    isMathCorrect && styles.inputSuccess,
                  ]}
                  value={input}
                  onChangeText={setInput}
                  placeholder="?"
                  placeholderTextColor={colors.subtleText}
                  keyboardType="numeric"
                />
              </>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={canSubmit ? handleSubmit : undefined}>
            <Text style={[styles.submitBtnText, !canSubmit && styles.submitBtnTextDisabled]}>
              Підтвердити
            </Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={handleAbandon}>
            <Text style={styles.cancelBtnText}>Скасувати</Text>
          </Pressable>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  flex: {flex: 1},
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  backBtn: {paddingVertical: 4},
  backBtnText: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 14,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  riskLabel: {
    fontFamily: fonts.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 12,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 26,
    fontWeight: '800',
  },
  sub: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 15,
    lineHeight: 22,
  },
  contactName: {
    color: colors.text,
    fontWeight: '700',
  },
  testCard: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
  },
  testLabel: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetPhrase: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
  },
  mathQuestion: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 16,
  },
  inputCenter: {textAlign: 'center', fontSize: 22, fontWeight: '700'},
  inputError: {borderColor: '#E53935'},
  inputSuccess: {borderColor: colors.primary},
  errorHint: {
    color: '#E53935',
    fontFamily: fonts.primary,
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: colors.border,
  },
  submitBtnText: {
    color: colors.onPrimary,
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  submitBtnTextDisabled: {
    color: colors.subtleText,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 14,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  successIcon: {fontSize: 56},
  successText: {
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  successSub: {
    color: colors.mutedText,
    fontFamily: fonts.primary,
    fontSize: 14,
  },
});
