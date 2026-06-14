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

const PHRASES = [
  "Я подумаю про це вранці і прийму зважене спокійне рішення",
  "Ранок — найкращий радник, особливо після бурхливого вечора",
  "Деякі слова краще залишити при собі і сказати їх вранці",
  "Моє майбутнє я обов'язково скаже дякую за цю паузу сьогодні",
  "Зараз точно не найкращий момент — ранок розсудить краще за мене",
  "Те що здається терміновим вночі, вранці завжди виглядає інакше",
  "Я достатньо розумна щоб зачекати до ранку перед важливим кроком",
];

function getRandomPhrase(): string {
  return PHRASES[Math.floor(Math.random() * PHRASES.length)];
}

function generateMathQuestion(): {question: string; answer: number} {
  // два множення: a×b − c×d або a×b + c×d
  let a: number, b: number, c: number, d: number;
  do {
    a = Math.floor(Math.random() * 6) + 4;  // 4–9
    b = Math.floor(Math.random() * 6) + 4;  // 4–9
    c = Math.floor(Math.random() * 5) + 2;  // 2–6
    d = Math.floor(Math.random() * 5) + 2;  // 2–6
  } while (a * b - c * d <= 5); // відповідь завжди > 5
  const useAdd = Math.random() > 0.6;
  if (useAdd) {
    return {question: `${a} × ${b} + ${c} × ${d} = ?`, answer: a * b + c * d};
  }
  return {question: `${a} × ${b} − ${c} × ${d} = ?`, answer: a * b - c * d};
}

export function SoberTestScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {contactName, action, riskScore, contactId} = route.params;
  const {logAttempt} = useBlockedContacts();

  const REVERSE_PHRASES = ['ДОБРА НІЧ', 'НЕ ДЗВОНИ', 'ЧАС СПАТИ', 'СТОП ДУМАЙ', 'НОЧІ КІНЕЦЬ'];

  const testType = useMemo<'phrase' | 'math' | 'reverse'>(() => {
    const r = Math.random();
    if (r < 0.34) {return 'phrase';}
    if (r < 0.67) {return 'math';}
    return 'reverse';
  }, []);

  const math = useMemo(generateMathQuestion, []);
  const targetPhrase = useMemo(getRandomPhrase, []);
  const reverseChallenge = useMemo(() => {
    const phrase = REVERSE_PHRASES[Math.floor(Math.random() * REVERSE_PHRASES.length)];
    const answer = phrase.split(' ').map(w => w.split('').reverse().join('')).join(' ');
    return {phrase, answer};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [input, setInput] = useState('');
  const [passed, setPassed] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [lastWrongInput, setLastWrongInput] = useState('');

  const isPhraseCorrect = input === targetPhrase;
  const isReverseCorrect = input.trim().toUpperCase() === reverseChallenge.answer;
  const isMathCorrect =
    input.trim() !== '' && parseInt(input.trim(), 10) === math.answer;
  const isMathWrong =
    input.trim().length > 0 &&
    !isNaN(parseInt(input.trim(), 10)) &&
    !isMathCorrect;
  const canSubmit =
    testType === 'phrase' ? isPhraseCorrect :
    testType === 'reverse' ? isReverseCorrect :
    isMathCorrect;

  const errorCount = useMemo(() => {
    if (testType !== 'phrase') {return 0;}
    let errors = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] !== targetPhrase[i]) {errors++;}
    }
    return errors;
  }, [input, testType, targetPhrase]);

  const handleMathSubmitAttempt = useCallback(() => {
    if (isMathWrong && input !== lastWrongInput) {
      setWrongAttempts(n => n + 1);
      setLastWrongInput(input);
    }
  }, [isMathWrong, input, lastWrongInput]);

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
              Індекс імпульсу: {Math.round(riskScore / 10)}/10
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
                <Text style={styles.testLabel}>Введи фразу без помилок:</Text>
                <Text style={styles.targetPhrase}>{targetPhrase}</Text>
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
                  spellCheck={false}
                />
                {errorCount > 0 ? (
                  <Text style={styles.errorHint}>
                    {errorCount} {errorCount === 1 ? 'помилка' : errorCount < 5 ? 'помилки' : 'помилок'} — уважніше
                  </Text>
                ) : input.length > 0 && !isPhraseCorrect ? (
                  <Text style={styles.progressHint}>
                    {input.length} / {targetPhrase.length} символів
                  </Text>
                ) : null}
              </>
            ) : testType === 'reverse' ? (
              <>
                <Text style={styles.testLabel}>Напиши кожне слово навпаки:</Text>
                <Text style={styles.mathQuestion}>{reverseChallenge.phrase}</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputCenter,
                    isReverseCorrect && styles.inputSuccess,
                  ]}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Навпаки..."
                  placeholderTextColor={colors.subtleText}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </>
            ) : (
              <>
                <Text style={styles.testLabel}>Розв'яжи приклад:</Text>
                <Text style={styles.mathQuestion}>{math.question}</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputCenter,
                    isMathWrong && styles.inputError,
                    isMathCorrect && styles.inputSuccess,
                  ]}
                  value={input}
                  onChangeText={setInput}
                  onEndEditing={handleMathSubmitAttempt}
                  placeholder="?"
                  placeholderTextColor={colors.subtleText}
                  keyboardType="number-pad"
                />
                {isMathWrong && (
                  <Text style={styles.errorHint}>
                    Невірно
                    {wrongAttempts >= 2 ? ` (${wrongAttempts} спроби — зосередься)` : ''}
                  </Text>
                )}
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
    fontSize: 13,
    fontWeight: '600',
  },
  progressHint: {
    color: colors.subtleText,
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
