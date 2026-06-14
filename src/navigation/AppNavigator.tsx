import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {AddContactScreen} from '../screens/AddContactScreen';
import {BlockedContactsScreen} from '../screens/BlockedContactsScreen';
import {CallBlockedScreen} from '../screens/CallBlockedScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {OnboardingScreen} from '../screens/OnboardingScreen';
import {SoberTestScreen} from '../screens/SoberTestScreen';
import type {AttemptAction} from '../types/lock';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  BlockedContacts: undefined;
  AddContact: {contactId?: string} | undefined;
  SoberTest: {
    contactId: string;
    contactName: string;
    action: AttemptAction;
    riskScore: number;
  };
  CallBlocked: {
    contactId: string;
    contactName: string;
    contactReason: string;
    contactNote?: string;
    attemptNumber: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator({
  initialRoute,
}: {
  initialRoute: keyof RootStackParamList;
}): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="BlockedContacts" component={BlockedContactsScreen} />
      <Stack.Screen name="AddContact" component={AddContactScreen} />
      <Stack.Screen name="SoberTest" component={SoberTestScreen} />
      <Stack.Screen name="CallBlocked" component={CallBlockedScreen} />
    </Stack.Navigator>
  );
}
