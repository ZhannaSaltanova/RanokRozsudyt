import React, {useState} from 'react';
import {BlockedContactsScreen} from './src/screens/BlockedContactsScreen';
import {WelcomeScreen} from './src/screens/WelcomeScreen';

type Screen = 'welcome' | 'blockedContacts';

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('welcome');

  if (screen === 'blockedContacts') {
    return <BlockedContactsScreen onBack={() => setScreen('welcome')} />;
  }

  return <WelcomeScreen onStart={() => setScreen('blockedContacts')} />;
}

export default App;
