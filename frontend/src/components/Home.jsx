import React from 'react';
import figPetHome from '../assets/FigPetHome.svg';
import AuthButton from './AuthButton.jsx';
import './Home.css';

export default function Home() {
  return (
    <div className="home-screen">
      <h1 className="home-title">Goal Calendar</h1>
      <img src={figPetHome} className="home-pet" alt="" />
      <p className="home-subtitle">Sign in to save your calendar, journal, goals, and todos.</p>
      <AuthButton />
    </div>
  );
}
