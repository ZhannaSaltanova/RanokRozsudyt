import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {AddContactScreen} from '../screens/AddContactScreen';
import {BlockedContactsScreen} from '../screens/BlockedContactsScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {WelcomeScreen} from '../screens/WelcomeScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  BlockedContacts: undefined;
  AddContact: {contactId?: string} | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="BlockedContacts" component={BlockedContactsScreen} />
      <Stack.Screen name="AddContact" component={AddContactScreen} />
    </Stack.Navigator>
  );
}
