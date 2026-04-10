import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  UserCheck,
  Users,
  Edit2,
  Check,
  X as CloseIcon,
  ChevronDown
} from 'lucide-react';
import { ManIcon, WomanIcon } from '../common/Icons';
import { getPredefinedPlayers, addPredefinedPlayer, deletePredefinedPlayer, updatePredefinedPlayer, getPredefinedTeams, addPredefinedTeam, deletePredefinedTeam, updatePredefinedTeam } from '../../lib/userService';
import { PredefinedPlayer, PredefinedTeam } from '../../types';
import { KATAPGAMA_TEAMS } from '../../constants';
import { User } from 'firebase/auth';

interface PredefinedManagerProps {
  user: User;
  onBack: () => void;
}

export default function PredefinedManager({ user, onBack }: PredefinedManagerProps) {
  const [activeTab, setActiveTab] = useState<'players' | 'teams'>('players');
  const [players, setPlayers] = useState<PredefinedPlayer[]>([]);
  const [teams, setTeams] = useState<PredefinedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form States
  const [newItemName, setNewItemName] = useState('');
  const [newGender, setNewGender] = useState<'man' | 'woman'>('man');
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');

  useEffect(() => {
    fetchData();
  }, [user.uid]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getPredefinedPlayers(user.uid);
      const t = await getPredefinedTeams(user.uid);
      setPlayers(p);
      setTeams(t);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch personnel data');
    } finally {
      setLoading(false);
    }
  };

  const handleImportKatapgama = async () => {
    setLoading(true);
    try {
      for (const t of KATAPGAMA_TEAMS) {
        await addPredefinedTeam(user.uid, { 
          name: t.teamName, 
          player1: t.name, 
          player2: t.partner 
        });
      }
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to import pack');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setError(null);

    try {
      if (activeTab === 'players') {
        if (editingId) {
          await updatePredefinedPlayer(user.uid, editingId, { name: newItemName.trim(), gender: newGender });
        } else {
          await addPredefinedPlayer(user.uid, { name: newItemName.trim(), gender: newGender });
        }
      } else {
        const player1 = players.find(p => p.id === p1Id)?.name || p1Id;
        const player2 = players.find(p => p.id === p2Id)?.name || p2Id;
        
        if (editingId) {
          await updatePredefinedTeam(user.uid, editingId, { 
            name: newItemName.trim(), 
            player1, 
            player2
          });
        } else {
          await addPredefinedTeam(user.uid, { 
            name: newItemName.trim(), 
            player1, 
            player2
          });
        }
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    }
  };

  const resetForm = () => {
    setNewItemName('');
    setP1Id('');
    setP2Id('');
    setEditingId(null);
  };

  const startEdit = (item: PredefinedPlayer | PredefinedTeam) => {
    setEditingId(item.id!);
    setNewItemName(item.name);
    if ('gender' in item) {
      setNewGender(item.gender || 'man');
      setActiveTab('players');
    } else {
      const team = item as PredefinedTeam;
      const foundP1 = players.find(p => p.name === team.player1);
      const foundP2 = players.find(p => p.name === team.player2);
      setP1Id(foundP1?.id || team.player1 || '');
      setP2Id(foundP2?.id || team.player2 || '');
      setActiveTab('teams');
    }
  };

  const handleDeleteItem = async (id: string) => {
    setError(null);
    try {
      if (activeTab === 'players') {
        await deletePredefinedPlayer(user.uid, id);
      } else {
        await deletePredefinedTeam(user.uid, id);
      }
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest p-6 md:p-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-8">
            <button 
              onClick={onBack}
              className="w-16 h-16 rounded-[1.5rem] bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-all group shadow-sm border border-on-surface/5"
            >
              <ArrowLeft className="w-6 h-6 text-on-surface/40 group-hover:text-on-surface group-hover:-translate-x-1 transition-all" />
            </button>
            <div>
              <h1 className="text-5xl font-black text-on-surface tracking-tighter uppercase italic leading-none mb-3">Manage Team</h1>
              <p className="text-on-surface/40 font-medium tracking-wide uppercase text-[10px]">Registry • Players & Teams</p>
            </div>
          </div>

          <div className="flex bg-surface-container-low p-2 rounded-[2rem] gap-2 h-20 w-full md:w-[400px] border border-on-surface/5 shadow-inner">
            <button 
              onClick={() => { setActiveTab('players'); resetForm(); }}
              className={`flex-1 flex items-center justify-center gap-4 rounded-[1.5rem] font-black transition-all text-[11px] uppercase tracking-[0.2em] ${activeTab === 'players' ? 'bg-on-surface text-surface-container-lowest shadow-xl' : 'text-on-surface/20 hover:text-on-surface/40 hover:bg-surface-container-lowest'}`}
            >
              <UserCheck className="w-5 h-5" strokeWidth={3} />
              Players
            </button>
            <button 
              onClick={() => { setActiveTab('teams'); resetForm(); }}
              className={`flex-1 flex items-center justify-center gap-4 rounded-[1.5rem] font-black transition-all text-[11px] uppercase tracking-[0.2em] ${activeTab === 'teams' ? 'bg-on-surface text-surface-container-lowest shadow-xl' : 'text-on-surface/20 hover:text-on-surface/40 hover:bg-surface-container-lowest'}`}
            >
              <Users className="w-5 h-5" strokeWidth={3} />
              Teams
            </button>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center gap-4 text-red-500"
          >
            <CloseIcon className="w-6 h-6 flex-shrink-0" />
            <p className="font-bold text-sm tracking-tight">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleAddItem} className="bg-surface-container-low p-8 md:p-12 rounded-[3rem] border border-on-surface/5 shadow-2xl relative overflow-hidden mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="flex-1 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-black tracking-[0.3em] text-on-surface/30 px-2 block">
                    {activeTab === 'players' ? 'Player Name' : 'Team Name'}
                  </label>
                  <input 
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={activeTab === 'players' ? "ENTER PLAYER NAME..." : "ENTER TEAM NAME..."}
                    className="w-full bg-surface-container-lowest text-on-surface text-2xl font-black px-8 py-7 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-on-surface/10 border border-on-surface/5 shadow-sm"
                  />
                </div>

                {activeTab === 'players' && (
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-black tracking-[0.3em] text-on-surface/30 px-2 block">Gender Selector</label>
                    <div className="flex bg-surface-container-lowest p-2 rounded-[1.5rem] h-[5.5rem] border border-on-surface/5 shadow-sm">
                      <button 
                        type="button"
                        onClick={() => setNewGender('man')}
                        className={`flex-1 rounded-[1.2rem] transition-all flex items-center justify-center gap-4 ${newGender === 'man' ? 'bg-blue-500/10 text-blue-500 shadow-sm border border-blue-500/20' : 'text-on-surface/10 hover:text-on-surface/30'}`}
                      >
                        <ManIcon className="w-7 h-7" />
                        <span className="font-black text-xs uppercase tracking-[0.2em]">Man</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewGender('woman')}
                        className={`flex-1 rounded-[1.2rem] transition-all flex items-center justify-center gap-4 ${newGender === 'woman' ? 'bg-pink-500/10 text-pink-500 shadow-sm border border-pink-500/20' : 'text-on-surface/10 hover:text-on-surface/30'}`}
                      >
                        <WomanIcon className="w-7 h-7" />
                        <span className="font-black text-xs uppercase tracking-[0.2em]">Woman</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'teams' && (
                  <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-black tracking-[0.3em] text-on-surface/30 px-2 block">Player One</label>
                      <div className="relative">
                        <select 
                          value={p1Id}
                          onChange={(e) => setP1Id(e.target.value)}
                          className="w-full h-[5.5rem] bg-surface-container-lowest border border-on-surface/5 rounded-[1.5rem] px-8 text-xl font-black outline-none focus:ring-4 focus:ring-primary/10 appearance-none text-on-surface shadow-sm"
                        >
                          <option value="">SELECT PLAYER 1...</option>
                          {players.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 text-on-surface/20 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-black tracking-[0.3em] text-on-surface/30 px-2 block">Player Two</label>
                      <div className="relative">
                        <select 
                          value={p2Id}
                          onChange={(e) => setP2Id(e.target.value)}
                          className="w-full h-[5.5rem] bg-surface-container-lowest border border-on-surface/5 rounded-[1.5rem] px-8 text-xl font-black outline-none focus:ring-4 focus:ring-primary/10 appearance-none text-on-surface shadow-sm"
                        >
                          <option value="">SELECT PLAYER 2...</option>
                          {players.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 text-on-surface/20 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              {editingId && (
                <button 
                  type="button"
                  onClick={resetForm}
                  className="w-[5.5rem] h-[5.5rem] bg-surface-container-lowest text-on-surface/20 rounded-[1.5rem] flex items-center justify-center hover:text-red-500 hover:bg-red-500/5 transition-all border border-on-surface/5 shadow-sm"
                >
                  <CloseIcon className="w-8 h-8" strokeWidth={3} />
                </button>
              )}
              <button 
                type="submit"
                className="flex-1 md:flex-none bg-on-surface text-surface-container-lowest px-16 h-[5.5rem] rounded-[1.5rem] font-black flex items-center justify-center gap-6 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-on-surface/20 text-[11px] uppercase tracking-[0.4em]"
              >
                {editingId ? <Check className="w-6 h-6" strokeWidth={4} /> : <Plus className="w-6 h-6" strokeWidth={4} />}
                {editingId ? 'Update Registry' : 'Add To List'}
              </button>
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface-container-low h-32 rounded-[2.5rem] animate-pulse border border-on-surface/5" />
              ))
            ) : (activeTab === 'players' ? players : teams).length === 0 ? (
              <div className="col-span-full py-32 text-center bg-surface-container-low/30 rounded-[3rem] border-2 border-dashed border-on-surface/5">
                <div className="w-24 h-24 bg-surface-container-low rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                  {activeTab === 'players' ? <UserCheck className="w-10 h-10 text-on-surface/10" /> : <Users className="w-10 h-10 text-on-surface/10" />}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-black text-on-surface">
                    {activeTab === 'players' ? 'Personnel' : 'Teams'}
                  </h2>
                  {activeTab === 'teams' && teams.length === 0 && (
                    <button
                      onClick={handleImportKatapgama}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary/20 transition-all text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Import Katapgama Pack
                    </button>
                  )}
                </div>
                <p className="text-on-surface/10 font-bold uppercase text-[10px] mt-2 tracking-widest">Start by adding your first {activeTab === 'players' ? 'player' : 'team'} above</p>
              </div>
            ) : (activeTab === 'players' ? players : teams).map((item) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => startEdit(item)}
                className={`group bg-surface-container-low/50 hover:bg-surface-container-low p-8 rounded-[2.5rem] border-2 transition-all flex flex-col cursor-pointer relative overflow-hidden ${editingId === item.id ? 'border-primary ring-4 ring-primary/10 bg-surface-container-low' : 'border-on-surface/5'}`}
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-8 overflow-hidden">
                    <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center flex-shrink-0 shadow-sm border border-on-surface/5 ${activeTab === 'players' ? ((item as PredefinedPlayer).gender === 'woman' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-500') : 'bg-surface-container-lowest text-on-surface/20'}`}>
                      {activeTab === 'players' ? (
                        (item as PredefinedPlayer).gender === 'woman' ? <WomanIcon className="w-9 h-9" /> : <ManIcon className="w-9 h-9" />
                      ) : (
                        <Users className="w-9 h-9" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-black text-on-surface text-2xl truncate uppercase tracking-tight italic leading-tight mb-2">{item.name}</h4>
                      {activeTab === 'players' ? (
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${(item as PredefinedPlayer).gender === 'woman' ? 'bg-pink-500' : 'bg-blue-500'}`} />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/30">{(item as PredefinedPlayer).gender || 'Unknown'}</p>
                        </div>
                      ) : (
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/30 truncate">
                          {(item as PredefinedTeam).player1} + {(item as PredefinedTeam).player2}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id!); }}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-on-surface/10 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 absolute top-4 right-4 bg-surface-container-lowest/50 backdrop-blur-sm"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
