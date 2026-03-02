'use client';

import React from 'react';
import { AuthProvider } from '../hooks/useAuth';
import '../styles/globals.css';

export default function App({ Component, pageProps }: any) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
