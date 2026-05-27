import {NavigationContainer} from '@react-navigation/native';
import React from 'react';
import {ContactsProvider} from './src/context/ContactsContext';
import {AppNavigator} from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <ContactsProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </ContactsProvider>
  );
}

export default App;
