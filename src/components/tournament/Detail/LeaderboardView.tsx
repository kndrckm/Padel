import React from 'react';
import { Tournament, PlayerStats } from '../../../types';

interface LeaderboardViewProps {
  tournament: Tournament;
  leaderboard: PlayerStats[];
}

export const LeaderboardView = ({ tournament, leaderboard }: LeaderboardViewProps) => {
  return (
    <div className="w-full">
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-on-surface/5">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-on-surface/5">
                <th className="px-10 py-6 label-sm text-on-surface/40">Rank</th>
                <th className="px-10 py-6 label-sm text-on-surface/40">Player</th>
                <th className="px-10 py-6 label-sm text-on-surface/40 text-center">W-L-T</th>
                <th className="px-10 py-6 label-sm text-on-surface/40 text-center">Diff</th>
                <th className="px-10 py-6 label-sm text-on-surface/40 text-center">+M</th>
                <th className="px-10 py-6 label-sm text-on-surface/40 text-center">P</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-on-surface/5">
              {leaderboard.map((p, idx) => (
                <tr key={p.name} className={`transition-colors group ${idx === 0 ? 'bg-primary-container text-on-primary-container' : 'hover:bg-surface-container-low'}`}>
                  <td className="px-10 py-6">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-on-primary-container text-primary-container' : idx === 1 ? 'bg-surface-container-high text-on-surface/60' : idx === 2 ? 'bg-surface-container-low text-on-surface/40' : 'bg-surface-container-lowest text-on-surface/20 border border-on-surface/5'}`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className={`font-bold text-lg ${idx === 0 ? 'text-on-primary-container' : 'text-on-surface'}`}>{p.name}</div>
                    {(tournament.isKatapgama || tournament.mode.includes('Team')) && (
                      <div className={`text-xs font-medium mt-0.5 ${idx === 0 ? 'text-on-primary-container/60' : 'text-on-surface/40'}`}>
                        {tournament.players.filter(pl => pl.teamName === p.name || pl.name === p.name).map(pl => pl.name).join(' & ')}
                      </div>
                    )}
                  </td>
                  <td className={`px-10 py-6 text-center font-bold ${idx === 0 ? 'text-on-primary-container/60' : 'text-on-surface/60'}`}>{p.wins}-{p.losses}-{p.ties}</td>
                  <td className={`px-10 py-6 text-center font-bold ${idx === 0 ? 'text-on-primary-container/60' : 'text-on-surface/60'}`}>{p.pointsFor - p.pointsAgainst > 0 ? `+${p.pointsFor - p.pointsAgainst}` : p.pointsFor - p.pointsAgainst}</td>
                  <td className={`px-10 py-6 text-center font-bold ${idx === 0 ? 'text-on-primary-container/60' : 'text-on-surface/60'}`}>{p.missedPoints > 0 ? `+${p.missedPoints}` : ''}</td>
                  <td className={`px-10 py-6 text-center font-bold ${idx === 0 ? 'text-on-primary-container' : 'text-on-surface'}`}>{p.pointsFor + p.missedPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        <div className="p-10 bg-surface-container-low border-t border-on-surface/5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-on-surface/60 uppercase tracking-wider">Definitions</p>
              <p className="text-xs font-medium text-on-surface/40">W-L-T = Wins - Losses - Ties</p>
              <p className="text-xs font-medium text-on-surface/40">Diff = Point difference (Points For - Points Against)</p>
              <p className="text-xs font-medium text-on-surface/40">P = Total Points (Points For + Missed Points)</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-on-surface/60 uppercase tracking-wider">Missed Match Points (+M)</p>
              <p className="text-xs font-medium text-on-surface/40">+M = n × Pavg</p>
              <p className="text-xs font-medium text-on-surface/40 text-[10px] leading-relaxed">
                n: Number of missed matches<br/>
                Pavg: Your average points per match
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
