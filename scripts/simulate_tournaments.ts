import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, getDocs, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { GameMode, MatchStatus } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

// Firebase configuration
const envRaw = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
const apiKeyMatch = envRaw.match(/VITE_FIREBASE_API_KEY="([^"]+)"/);
const apiKey = apiKeyMatch ? apiKeyMatch[1] : "";

const configRaw = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
const config = JSON.parse(configRaw);
config.apiKey = apiKey;

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const SIM_PREFIX = "SIMULATION_V3_";
const CREATOR_ID = "SIMULATOR";

async function simulateMode(mode: GameMode) {
  console.log(`\n🚀 [${mode}] Starting deep simulation...`);
  
  const isTeamMode = [
    GameMode.SWISS_SYSTEM,
    GameMode.SINGLE_ELIMINATION,
    GameMode.DOUBLE_ELIMINATION,
    GameMode.TEAM_AMERICANO,
    GameMode.TEAM_MEXICANO,
    GameMode.ROUND_ROBIN
  ].includes(mode);

  const isMixMode = mode === GameMode.MIX_AMERICANO || mode === GameMode.MIXED_MEXICANO;

  const numPlayers = 16;
  const players = Array.from({ length: numPlayers }, (_, i) => ({
    name: `Player_${String(i + 1).padStart(2, '0')}`,
    gender: (i % 2 === 0 ? 'man' : 'woman') as 'man' | 'woman'
  }));

  const name = `${SIM_PREFIX}${mode}`;
  const tData = {
    name, mode, creatorId: CREATOR_ID, status: 'active',
    createdAt: new Date().toISOString(), players,
    currentRound: 1, courtsCount: 1, pointsToPlay: 24
  };

  try {
    const docRef = await addDoc(collection(db, 'tournaments'), tData);
    const tId = docRef.id;
    console.log(`  Created Tournament: ${tId}`);

    let matchPairs: any[] = [];
    
    // For simplicity, we just trigger the initial matches
    if (mode === GameMode.SINGLE_ELIMINATION || mode === GameMode.DOUBLE_ELIMINATION) {
       let teams: string[][] = [];
       for (let i = 0; i < players.length; i += 2) teams.push([players[i].name, players[i+1].name]);
       const powerOf2 = Math.pow(2, Math.ceil(Math.log2(teams.length)));
       
       // WB Round 1
       for (let i = 0; i < powerOf2 / 2; i++) {
         const t1 = (i * 2 < teams.length) ? teams[i*2] : ['BYE'];
         const t2 = (i * 2 + 1 < teams.length) ? teams[i*2+1] : ['BYE'];
         matchPairs.push({ id: `wb-1-${i}`, team1: t1, team2: t2, round: 1, matchIndex: i });
       }

       if (mode === GameMode.DOUBLE_ELIMINATION) {
         // LB Round 1 (now shifted to round 1)
         const lbRound1Matches = powerOf2 / 4;
         for (let i = 0; i < lbRound1Matches; i++) {
           matchPairs.push({ id: `lb-1-${i}`, team1: ['TBD'], team2: ['TBD'], round: 1, matchIndex: i, isLosersBracket: true });
         }
         // GF
         matchPairs.push({ id: 'gf-1', team1: ['TBD'], team2: ['TBD'], round: Math.log2(powerOf2) + 1, court: 1 });
       }
    } else if (isTeamMode || mode === GameMode.SWISS_SYSTEM) {
       let teams: string[][] = [];
       for (let i = 0; i < players.length; i += 2) teams.push([players[i].name, players[i+1].name]);
       for (let i = 0; i < teams.length; i += 2) {
         if (i + 1 < teams.length) matchPairs.push({ team1: teams[i], team2: teams[i+1], round: 1 });
       }
    } else if (isMixMode) {
       const men = players.filter(p => p.gender === 'man').map(p => p.name);
       const women = players.filter(p => p.gender === 'woman').map(p => p.name);
       for (let i = 0; i < Math.min(men.length, women.length); i += 2) {
         matchPairs.push({ team1: [men[i], women[i]], team2: [men[i+1], women[i+1]], round: 1 });
       }
    } else {
       // Player modes
       for (let i = 0; i < players.length; i += 4) {
         matchPairs.push({ team1: [players[i].name, players[i+1].name], team2: [players[i+2].name, players[i+3].name], round: 1 });
       }
    }

    // Save matches
    const matchIds: string[] = [];
    for (const m of matchPairs) {
      const { id, ...data } = m;
      if (id) {
        await setDoc(doc(db, `tournaments/${tId}/matches`, id), {
          ...data, tournamentId: tId, score1: 0, score2: 0, sets1: [0], sets2: [0], status: MatchStatus.PENDING, court: 1, serverIndex: 0
        });
        matchIds.push(id);
      } else {
        const resp = await addDoc(collection(db, `tournaments/${tId}/matches`), {
          ...data, tournamentId: tId, score1: 0, score2: 0, sets1: [0], sets2: [0], status: MatchStatus.PENDING, court: 1, serverIndex: 0
        });
        matchIds.push(resp.id);
      }
    }

    console.log(`  Generated ${matchIds.length} matches for Round 1.`);

    // If deep simulation requested (non-bracket)
    const isBracketMode = [GameMode.SWISS_SYSTEM, GameMode.SINGLE_ELIMINATION, GameMode.DOUBLE_ELIMINATION].includes(mode);
    if (!isBracketMode) {
      console.log(`  Scoring Round 1 matches as 24-0...`);
      for (const mId of matchIds) {
        await updateDoc(doc(db, `tournaments/${tId}/matches`, mId), {
           score1: 24, score2: 0, status: MatchStatus.COMPLETED, winner: 1, sets1: [24], sets2: [0]
        });
      }

      // Mock "Generate Next Round" Logic
      console.log(`  Generating Round 2...`);
      await updateDoc(doc(db, 'tournaments', tId), { currentRound: 2 });
      
      // For simplicity in simulation, we just generate generic R2 matches
      // In a real app, this would use leaderboard logic
      for (const m of matchPairs) {
        await addDoc(collection(db, `tournaments/${tId}/matches`), {
          ...m, round: 2, tournamentId: tId, score1: 0, score2: 0, sets1: [0], sets2: [0], status: MatchStatus.PENDING, court: 1, serverIndex: 0
        });
      }
      console.log(`  Round 2 Generated.`);
    }

    console.log(`  ✅ Done.`);
    return tId;
  } catch (err) {
    console.error(`  ❌ Error: ${err}`);
    return null;
  }
}

async function runAll() {
  const modes = Object.values(GameMode);
  console.log(`🏁 Starting Full Tournament Simulation (Persistence: ON)`);
  console.log(`---------------------------------------------------------`);
  
  for (const mode of modes) {
    await simulateMode(mode);
  }

  console.log(`\n🎉 All simulations complete. Check your Firestore for SIMULATION_V2_ prefixes.`);
  process.exit(0);
}

runAll();
