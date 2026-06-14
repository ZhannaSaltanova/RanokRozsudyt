import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useRef, useState} from 'react';
import {
  Dimensions,
  Image,
  PermissionsAndroid,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const logo = require('../assets/logo.webp');
import {SafeAreaView} from 'react-native-safe-area-context';
import {BlockedContacts} from '../native/BlockedContacts';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';

const {width} = Dimensions.get('window');
const ONBOARDING_KEY = '@onboarding_done';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const SLIDES = [
  {
    icon: 'moon-outline',
    title: 'Ранок Розсудить',
    subtitle: 'Твій захист від імпульсивних рішень',
    features: [
      {icon: 'shield-checkmark-outline', text: 'Захист від імпульсивних дзвінків'},
      {icon: 'pause-circle-outline', text: 'Пауза сьогодні. Спокій завтра.'},
      {icon: 'bar-chart-outline', text: 'Контроль. Статистика. Результат.'},
    ],
  },
  {
    icon: 'shield-outline',
    title: 'Як це працює',
    subtitle: 'Три прості кроки',
    steps: [
      {icon: 'person-outline', text: 'Додай контакт якому краще не телефонувати вночі'},
      {icon: 'lock-closed-outline', text: 'Увімкни захист коли відчуваєш що вечір стає непередбачуваним'},
      {icon: 'ban-outline', text: 'Якщо спробуєш зателефонувати — дзвінок заблокується і ти побачиш цей екран'},
    ],
  },
  {
    icon: 'checkmark-circle-outline',
    title: 'Майже готово',
    subtitle: 'Два дозволи — і ти під захистом',
    permissions: [
      {icon: 'people-outline', text: 'Контакти — щоб додавати людей зі своєї книги'},
      {icon: 'call-outline', text: 'Перевірка дзвінків — щоб блокувати вихідні дзвінки'},
    ],
  },
];

export function OnboardingScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const scrollRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [requesting, setRequesting] = useState(false);

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({x: index * width, animated: true});
    setCurrentSlide(index);
  };

  const handleScroll = (e: {nativeEvent: {contentOffset: {x: number}}}) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentSlide(index);
  };

  const handleFinish = async () => {
    setRequesting(true);
    try {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
      await BlockedContacts.requestCallRedirectionRole();
    } catch {}
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    navigation.replace('Home');
  };

  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}>
        {SLIDES.map((slide, i) => (
          <View key={i} style={styles.slide}>
            {i === 0
              ? <Image source={logo} style={styles.logo} resizeMode="contain" />
              : <Ionicons name={slide.icon} size={72} color={colors.primary} style={styles.mainIcon} />
            }
            {i !== 0 && <Text style={styles.title}>{slide.title}</Text>}
            {i !== 0 && <Text style={styles.subtitle}>{slide.subtitle}</Text>}

            {'features' in slide && slide.features && (
              <View style={styles.featureList}>
                {slide.features.map((f, j) => (
                  <View
                    key={j}
                    style={[
                      styles.featureRow,
                      j < slide.features!.length - 1 && styles.featureRowBorder,
                    ]}>
                    <View style={styles.featureIconWrap}>
                      <Ionicons name={f.icon} size={22} color={colors.primary} />
                    </View>
                    <Text style={styles.featureText}>{f.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {'steps' in slide && slide.steps && (
              <View style={styles.steps}>
                {slide.steps.map((step, j) => (
                  <View key={j} style={styles.stepRow}>
                    <Ionicons name={step.icon} size={22} color={colors.primary} />
                    <Text style={styles.stepText}>{step.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {'permissions' in slide && slide.permissions && (
              <View style={styles.steps}>
                {slide.permissions.map((p, j) => (
                  <View key={j} style={styles.stepRow}>
                    <Ionicons name={p.icon} size={22} color={colors.primary} />
                    <Text style={styles.stepText}>{p.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, currentSlide === i && styles.dotActive]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.footer}>
        {isLast ? (
          <Pressable
            style={[styles.btn, requesting && styles.btnDisabled]}
            onPress={requesting ? undefined : handleFinish}>
            <Text style={styles.btnText}>
              {requesting ? 'Секунду...' : 'Надати дозволи та почати'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.footerRow}>
            <Pressable onPress={() => {
              AsyncStorage.setItem(ONBOARDING_KEY, 'true');
              navigation.replace('Home');
            }}>
              <Text style={styles.skipText}>Пропустити</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => goTo(currentSlide + 1)}>
              <Text style={styles.btnText}>Далі</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    alignItems: 'center',
  },
  logo: {
    width: width * 0.83,
    height: width * 0.83,
    marginBottom: 16,
    borderRadius: 36,
  },
  mainIcon: {
    marginBottom: 24,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: colors.primary,
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  steps: {
    width: '100%',
    gap: 16,
    marginTop: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  stepText: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 15,
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: colors.border,
  },
  btnText: {
    color: colors.onPrimary,
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  skipText: {
    color: colors.subtleText,
    fontFamily: fonts.primary,
    fontSize: 15,
  },
  featureList: {
    width: '100%',
    marginTop: 16,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  featureRowBorder: {},
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.primary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
});
