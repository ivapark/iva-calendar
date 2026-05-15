import React from 'react';
import { supabase } from '../supabaseClient.js';

export default function AuthButton({ session }) {
  async function signInWithGoogle() {
    const redirectTo = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error('Google login error:', error);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (!session) {
    return (
      <button className="auth-btn" onClick={signInWithGoogle}>
        Sign in
      </button>
    );
  }

  return (
    <button className="auth-btn" onClick={signOut}>
      Sign out
    </button>
  );
}