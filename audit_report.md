# Padel Tournament Maker: Detailed Logic Audit (Refined)

This report provides a comprehensive breakdown of the tournament logic for each game mode, presented in a structured table format for clarity.

---

### 1. Mixed Americano (Fixed-Team Rotation)
| Category | Logic & Case Studies |
| :--- | :--- |
| **Initiation Logic** | **Fixed-Team Circle Method**: Players are paired as [1 Man + 1 Woman] at start. These teams stay together for the whole tournament. |
| **Progression Logic** | **Fixed Schedule**: All matches for all rounds are pre-generated at the start using a circular rotation algorithm. No ranking-based swapping. |
| **4 Player Example (2M/2W)** | 2 Fixed Teams. R1: T1 vs T2. R2: T1 vs T2 (Rematch). Total 1 match type possible. |
| **6 Player Example (3M/3W)** | 3 Fixed Teams. R1: T1 vs T2 (T3 sits). R2: T1 vs T3 (T2 sits). R3: T2 vs T3 (T1 sits). Everyone plays 2/3 games. |
| **7 Player Case** | System requires even gender counts. If 7 players, 1 "BYE" team is added. Circular rotation ensures the "BYE" (sit-out) is shared equally. |
| **Reduced Matches** | If matches are reduced from default (e.g., 3 rounds instead of 5), the schedule simply truncates. Balance is maintained up to the stop point. |

---

### 2. Mixed Mexicano (Dynamic Performance)
| Category | Logic & Case Studies |
| :--- | :--- |
| **Initiation Logic** | **Random Start**: Round 1 is initialized with randomized [1 Man + 1 Woman] pairs. Only Round 1 is generated initially. |
| **Progression Logic** | **Performance Climb**: Pairs Top-ranked Man + Top-ranked Woman vs 2nd Man + 2nd Woman. Teams are re-paired *every round* based on individual standings. |
| **4 Player Example** | R1: Random. R2: Top M/W join forces to play the 2nd M/W. |
| **6 Player Example** | R1: 3 Pairs. Court 1: [Best M+W] vs [2nd Best M+W]. Court 2: [3rd Best M+W] vs [Sub-optimal/Bottom M+W if available]. |
| **7 Player Case** | Odd numbers cause 1 player (lowest priority) to sit out. This player gets top priority (guaranteed play) in the next round. |
| **Reduced Matches** | System generates "Next Round" one at a time. If matches are reduced, the "Final" is simply the last generated round's standings. |

---

### 3. True Swiss System (Skeleton & Record-Based)
| Category | Logic & Case Studies |
| :--- | :--- |
| **Initiation Logic** | **Skeleton Generation**: Creates placeholder (TBD) matches for Rounds 1–5 upfront. R1 is filled with random team pairings. |
| **Progression Logic** | **Record Grouping**: Teams with identical records (e.g., 1-0 vs 1-0) are paired. Updates the TBD Skeletons dynamically when "Next Round" is clicked. |
| **4 Team Example** | R1: [A vs B], [C vs D]. R2 Skeletons exist. After R1, winners [A, C] are updated in R2 Court 1; Losers [B, D] in Court 2. |
| **6 Team Example** | R1: 3 matches. R2: 3 matches. Pairs 3-0 teams together, 2-1 teams together, etc. |
| **7 Team Case** | Uses a "BYE" for the bottom-ranked team. The "BYE" team receives 1 Win point to stay in the middle of the pack for future pairings. |
| **Reduced Matches** | Skeletons for future rounds remain "Upcoming (TBD)". If the tournament is ended early, unused skeletons are simply ignored. |

---

### 4. Normal Mexicano (Top-2 Strict Rule)
| Category | Logic & Case Studies |
| :--- | :--- |
| **Initiation Logic** | **Qualifier**: R1 generated as a randomized balanced set of matches to establish initial points. |
| **Progression Logic** | **Strict Top-2**: Ensures the player ranked #1 and player ranked #2 *always* compete on Court 1 every round (either as partners or opponents). |
| **6 Player Example** | Court 1: Players [1, 2, 3, 4] from leaderboard. Match: [1+4] vs [2+3] (Standard Balance). |
| **Reduced Matches** | Even if the match count is low, the system prioritizes the "Climb". The gap between Court 1 and Court 2 remains strictly performance-based. |

---

### 5. Round Robin & Team Americano
| Category | Logic & Case Studies |
| :--- | :--- |
| **Initiation Logic** | **Circular Schedule**: Generates a full matrix where every team is scheduled to play every other team exactly once. |
| **Progression Logic** | Sequential round advancement. Current round is simply an index into the pre-calculated circle matrix. |
| **Reduced Matches** | Balanced playtime is naturally preserved even if truncated, as the circle method spreads sit-outs and court assignments uniformly. |

---

*Audit conducted and verified by Antigravity AI - 2026-04-02*
*System Status: Logic Refined and Skeleton Visualization Implemented.*
