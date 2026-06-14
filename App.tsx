import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, DeviceEventEmitter} from 'react-native';
import {ContactsProvider, useBlockedContacts} from './src/context/ContactsContext';
import {BlockedContacts} from './src/native/BlockedContacts';
import {AppNavigator} from './src/navigation/AppNavigator';
import type {RootStackParamList} from './src/navigation/AppNavigator';

function AppContent({
  navRef,
  initialRoute,
}: {
  navRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
  initialRoute: keyof RootStackParamList;
}): React.JSX.Element {
  const {logAttempt, attempts, isLoading} = useBlockedContacts();

  // Ref завжди містить свіжі attempts — уникає stale closure при старті додатку
  const attemptsRef = useRef(attempts);
  useEffect(() => { attemptsRef.current = attempts; }, [attempts]);

  const checkPendingBlockedCall = useCallback(async () => {
    if (isLoading) {return;}
    const pending = await BlockedContacts.getPendingBlockedCall();
    if (!pending || !navRef.current) {return;}

    const nightStart = (() => {
      const t = new Date();
      t.setHours(22, 0, 0, 0);
      if (t.getTime() > Date.now()) {t.setDate(t.getDate() - 1);}
      return t.getTime();
    })();

    const tonightCount = attemptsRef.current.filter(
      a => a.contactId === pending.contactId && a.timestamp > nightStart,
    ).length;

    logAttempt({
      contactId: pending.contactId,
      contactName: pending.contactName,
      action: 'call',
      result: 'blocked',
      timestamp: Date.now(),
      riskScore: 0,
    });

    navRef.current.navigate('CallBlocked', {
      contactId: pending.contactId,
      contactName: pending.contactName,
      contactReason: pending.contactReason,
      contactNote: pending.contactNote,
      attemptNumber: tonightCount + 1,
    });
  }, [logAttempt, navRef, isLoading]);

  // Повторна перевірка щойно дані завантажились (race condition при холодному старті)
  useEffect(() => {
    if (!isLoading) {checkPendingBlockedCall();}
  }, [isLoading, checkPendingBlockedCall]);

  useEffect(() => {
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') {checkPendingBlockedCall();}
    });
    const eventSub = DeviceEventEmitter.addListener('onCallBlocked', () => {
      checkPendingBlockedCall();
    });
    return () => {
      appStateSub.remove();
      eventSub.remove();
    };
  }, [checkPendingBlockedCall]);

  return (
    <NavigationContainer ref={navRef} onReady={checkPendingBlockedCall}>
      <AppNavigator initialRoute={initialRoute} />
    </NavigationContainer>
  );
}

function App(): React.JSX.Element {
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@onboarding_done').then(val => {
      setInitialRoute(val ? 'Home' : 'Onboarding');
    });
  }, []);

  if (!initialRoute) {return <></>;}

  return (
    <ContactsProvider>
      <AppContent navRef={navRef} initialRoute={initialRoute} />
    </ContactsProvider>
  );
}

export default App;
