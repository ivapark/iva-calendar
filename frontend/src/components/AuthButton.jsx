import React from 'react';
import { supabase } from '../supabaseClient.js';
import './AuthButton.css';

export default function AuthButton() {
  async function signInWithGoogle() {
    const redirectTo = window.location.origin;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
  }

  return (
    <button className="auth-btn" onClick={signInWithGoogle}>
      Sign in
    </button>
  );
}
