import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  RotateCcw,
  Users,
  AlertCircle
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { KATAPGAMA_TEAMS } from '../../constants';
import { User } from 'firebase/auth';

interface KatapgamaManagerProps {
  user: User;
  onBack: () => void;
}

export default function KatapgamaManager({ user, onBack }: KatapgamaManagerProps) {
  const [teams, setTeams] = useState(KATAPGAMA_TEAMS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchTeams();
  }, [user.uid]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, `users/${user.uid}/settings`, 'katapgama_pack');
      const d = await getDoc(docRef);
      if (d.exists()) {
        setTeams(d.data().teams);
      }
    } catch (err) {
      console.error('Error fetching katapgama teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = (index: number, field: string, value: string) => {
    const next = [...teams];
    next[index] = { ...next[index], [field]: value };
    setTeams(next);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const docRef = doc(db, `users/${user.uid}/settings`, 'katapgama_pack');
      await setDoc(docRef, { teams, updatedAt: new Date().toISOString() });
      setMessage({ type: 'success', text: 'Katapgama Pack updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all 16 teams to their original Katapgama names?')) {
      setTeams(KATAPGAMA_TEAMS);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-5xl mx-auto px-6 py-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container-low text-on-surface/60 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-on-surface tracking-tight">Katapgama Teams</h1>
            <p className="text-on-surface/40 font-bold uppercase text-xs tracking-[0.2em] mt-2">Manage all 16 registered team slots</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-2 px-6 py-3 bg-surface-container-low text-on-surface/40 rounded-xl font-bold hover:bg-error/10 hover:text-error transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-8 p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-bold text-sm tracking-wide">{message.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map((t, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-surface-container-lowest border border-on-surface/5 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-primary/10 transition-all group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary font-black text-xs">
                    {idx + 1}
                  </span>
                  <input
                    value={t.teamName}
                    onChange={(e) => handleUpdateTeam(idx, 'teamName', e.target.value)}
                    className="bg-transparent text-xl font-black text-on-surface focus:outline-none focus:text-primary transition-colors border-b-2 border-transparent focus:border-primary/20"
                    placeholder={`Team ${idx + 1}`}
                  />
                </div>
                <Users className="w-5 h-5 text-on-surface/5 group-hover:text-primary/20 transition-colors" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30">Player 1</label>
                  <input
                    value={t.name}
                    onChange={(e) => handleUpdateTeam(idx, 'name', e.target.value)}
                    className="w-full bg-surface-container-low px-4 py-3 rounded-xl font-bold text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30">Player 2</label>
                  <input
                    value={t.partner}
                    onChange={(e) => handleUpdateTeam(idx, 'partner', e.target.value)}
                    className="w-full bg-surface-container-low px-4 py-3 rounded-xl font-bold text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
