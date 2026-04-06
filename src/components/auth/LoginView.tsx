import React from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { PadelRacket } from '../common/Icons';

interface LoginViewProps {
  onLogin: () => void;
}

export const LoginView = ({ onLogin }: LoginViewProps) => {
  return (
    <div className="min-h-screen bg-brand-neutral flex items-center justify-center p-6 bg-[#FDFBF3]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-container-lowest p-12 md:p-16 rounded-[3rem] shadow-2xl max-w-lg w-full text-center border border-on-surface/5"
      >
        <div className="w-24 h-24 bg-primary-container text-on-primary-container rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-lg shadow-primary/20">
          <PadelRacket className="w-12 h-12" />
        </div>
        <h1 className="text-5xl font-black text-on-surface mb-4 tracking-tight">Padel Tour</h1>
        <p className="text-on-surface/40 font-bold mb-12 text-lg uppercase tracking-widest">Tournament Manager</p>
        
        <button 
          onClick={onLogin}
          className="w-full bg-primary text-on-primary-container py-6 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
        >
          <img src="https://www.google.com/favicon.ico" className="w-6 h-6 rounded-full" alt="Google" />
          Sign in with Google
        </button>
        
        <p className="mt-10 text-on-surface/20 text-sm font-medium">
          Manage tournaments, tracks scores, and view brackets in real-time.
        </p>
      </motion.div>
    </div>
  );
};
