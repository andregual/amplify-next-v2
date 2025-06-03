'use client';

import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';
import { Authenticator, Theme, ThemeProvider } from '@aws-amplify/ui-react';
import AuthContent from './components/AuthContent';

Amplify.configure(outputs);

const theme: Theme = {
  name: 'my-theme',
  tokens: {
    colors: {
      secondary: {
        value: '#abdc12',
      },
    },
  },
};

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <Authenticator.Provider>
        <AuthContent />
      </Authenticator.Provider>
    </ThemeProvider>
  );
}
