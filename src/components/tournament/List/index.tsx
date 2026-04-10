import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'firebase/auth';
import { LogOut, Plus, ChevronRight, UserCheck } from 'lucide-react';
import { Tournament } from '../../../types';
import { PadelBall } from '../../common/Icons';

interface TournamentListProps {
  tournaments: Tournament[];
  onSelect: (t: Tournament) => void;
  onCreateNew: () => void;
  onManage: () => void;
  onLogout: () => void;
  user: User | null;
}

export default function TournamentList({ tournaments, onSelect, onCreateNew, onManage, onLogout, user }: TournamentListProps) {
  return (
    <motion.div 
      key="list"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full max-w-7xl mx-auto px-6 md:px-12 py-10"
    >
      {/* Header with User Info */}
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-6">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-16 h-16 rounded-2xl shadow-lg" />
          ) : (
            <div className="w-16 h-16 bg-surface-container-low rounded-2xl flex items-center justify-center font-bold text-2xl text-on-surface/20">
              {user?.displayName?.[0] || user?.email?.[0] || 'U'}
            </div>
          )}
          <div>
            <p className="label-sm mb-1">Welcome back,</p>
            <h2 className="text-2xl font-bold text-on-surface truncate max-w-[200px] md:max-w-md">
              {user?.displayName || user?.email?.split('@')[0] || 'Player'}
            </h2>
          </div>
        </div>
        <div className="flex-1 flex justify-end items-center gap-4">
          <button 
            onClick={onManage}
            className="flex items-center gap-3 bg-surface-container-low text-on-surface px-8 py-4 rounded-xl font-bold hover:bg-surface-container-high transition-all shadow-sm"
            title="Manage Players & Teams"
          >
            <UserCheck className="w-6 h-6" />
            <span className="hidden md:inline">Manage Personnel</span>
          </button>
          <button 
            onClick={onLogout}
            className="p-4 rounded-xl bg-surface-container-low hover:bg-red-500/10 transition-all text-on-surface/40 hover:text-red-500 group"
            title="Sign Out"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>
      {tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-start pt-0 pb-16 text-center">
          <p className="label-sm mb-4">Welcome to the Club</p>
          <h2 className="text-5xl font-bold text-on-surface mb-16 max-w-lg">Your Tournaments</h2>
          
          <div className="mb-20">
            <div className="w-24 h-24 bg-surface-container-low rounded-2xl flex items-center justify-center mx-auto mb-8">
              <PadelBall className="w-12 h-12 text-on-surface/20" />
            </div>
            <p className="text-on-surface/40 font-medium text-xl">No tournaments yet. Create your first one!</p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <button 
              onClick={onCreateNew}
              className="w-32 h-32 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center hover:scale-105 transition-all active:scale-95 shadow-xl shadow-primary/10 group"
            >
              <Plus className="w-16 h-16 group-hover:rotate-90 transition-transform duration-300" />
            </button>
            <span className="text-2xl font-bold text-on-surface">New Tournament</span>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-16">
            <div>
              <p className="label-sm mb-2">Overview</p>
              <h2 className="text-4xl font-bold text-on-surface">Your Tournaments</h2>
            </div>
            <button 
              onClick={onCreateNew}
              className="flex items-center gap-3 bg-primary-container text-on-primary-container px-8 py-4 rounded-xl font-bold hover:brightness-95 transition-all active:scale-95 shadow-lg shadow-primary/10"
            >
              <Plus className="w-6 h-6" />
              New Tournament
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tournaments.map((t) => (
              <div 
                key={t.id}
                onClick={() => onSelect(t)}
                className="bg-surface-container-lowest p-10 rounded-2xl hover:shadow-2xl hover:shadow-on-surface/5 transition-all cursor-pointer group relative overflow-hidden border border-on-surface/5"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-container opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <span className={`label-sm px-3 py-1 rounded-lg mb-4 inline-block ${t.status === 'active' ? 'bg-secondary/10 text-secondary' : 'bg-on-surface/5 text-on-surface/60'}`}>
                      {t.status}
                    </span>
                    <h3 className="text-2xl font-bold text-on-surface">{t.name}</h3>
                  </div>
                  <div className="p-3 bg-surface-container-low rounded-xl group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex items-center gap-8 text-sm font-medium text-on-surface/60">
                  <div className="flex items-center gap-2.5">
                    <PadelBall className="w-5 h-5 text-on-surface/30" />
                    {t.players.length} Players
                  </div>
                  <div className="flex items-center gap-2.5">
                    <PadelBall className="w-5 h-5 text-on-surface/30" />
                    {t.mode}
                  </div>
                </div>
              </div>
            ))}
          </div>
      </>
      )}
    </motion.div>
  );
}
