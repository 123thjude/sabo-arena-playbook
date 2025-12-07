/**
 * Full Bracket View - Display all 3 brackets (WB, LB-A, LB-B) in one screen
 * Professional tournament bracket visualization with connecting lines
 */

import React, { useMemo } from 'react';
import { MatchCard } from './MatchCard';
import type { BracketMatch } from '@/types/bracket';
import { Trophy, Target, AlertCircle } from 'lucide-react';

interface FullBracketViewProps {
  matches: BracketMatch[];
  groupName: string;
  allMatches: BracketMatch[];
  crossFinalMatches?: BracketMatch[]; // Optional: để vẽ đường nối đến Cross Finals
}

interface PositionedMatch extends BracketMatch {
  x: number;
  y: number;
  height: number;
}

/**
 * Calculate tree-style positions where each match is centered between its 2 source matches
 * This creates the classic tournament bracket tree layout
 * Handles both Winner Bracket (WB) and Loser Bracket (LB-A, LB-B) structures
 */
function calculateTreePositions(
  matches: BracketMatch[],
  startY: number,
  cardWidth: number,
  cardHeight: number,
  horizontalGap: number,
  verticalGap: number
): PositionedMatch[] {
  if (matches.length === 0) return [];

  const rounds = groupByRound(matches);
  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
  const positioned: PositionedMatch[] = [];
  
  // Determine bracket type from first match
  const bracketType = matches[0]?.bracket_type || 'WB';
  const isWinnerBracket = bracketType === 'WB';

  // Position first round (leftmost) - these are evenly spaced
  const firstRound = rounds[roundNumbers[0]];
  for (let i = 0; i < firstRound.length; i++) {
    positioned.push({
      ...firstRound[i],
      x: 0,
      y: startY + i * (cardHeight + verticalGap),
      height: cardHeight
    });
  }

  // Position subsequent rounds
  for (let roundIdx = 1; roundIdx < roundNumbers.length; roundIdx++) {
    const currentRoundNum = roundNumbers[roundIdx];
    const prevRoundNum = roundNumbers[roundIdx - 1];
    const roundMatches = rounds[currentRoundNum];
    const x = roundIdx * (cardWidth + horizontalGap);

    for (let matchIdx = 0; matchIdx < roundMatches.length; matchIdx++) {
      const currentMatch = roundMatches[matchIdx];
      
      let prevMatch1: PositionedMatch | undefined;
      let prevMatch2: PositionedMatch | undefined;

      // Both WB and LB use the same logic:
      // Each match takes winners/players from 2 consecutive matches in previous round
      // Use index-based pairing, not match_number
      const prevRoundMatches = positioned.filter(m => m.round_number === prevRoundNum);
      
      if (prevRoundMatches.length >= 2) {
        // Take pairs of matches from previous round based on current match index
        const pairStartIdx = matchIdx * 2;
        prevMatch1 = prevRoundMatches[pairStartIdx];
        prevMatch2 = prevRoundMatches[pairStartIdx + 1];
      }

      // Calculate centered Y position between the two source matches
      let y = startY + matchIdx * (cardHeight + verticalGap) * Math.pow(2, roundIdx);
      
      if (prevMatch1 && prevMatch2) {
        // Perfect case: center between the two source matches
        const centerY1 = prevMatch1.y + prevMatch1.height / 2;
        const centerY2 = prevMatch2.y + prevMatch2.height / 2;
        const midPoint = (centerY1 + centerY2) / 2;
        y = midPoint - cardHeight / 2;
      } else if (prevMatch1) {
        // Only one source found, align with it
        y = prevMatch1.y;
      } else if (prevMatch2) {
        y = prevMatch2.y;
      }

      positioned.push({
        ...currentMatch,
        x,
        y,
        height: cardHeight
      });
    }
  }

  return positioned;
}

export const FullBracketView: React.FC<FullBracketViewProps> = ({
  matches,
  groupName,
  allMatches,
  crossFinalMatches = []
}) => {
  // Separate by bracket type
  const wbMatches = matches.filter(m => m.bracket_type === 'WB');
  const lbAMatches = matches.filter(m => m.bracket_type === 'LB-A');
  const lbBMatches = matches.filter(m => m.bracket_type === 'LB-B');
  
  // Find the 3 final winners from this group who advance to Cross Finals:
  // 1. Winner from WB Round 3 (final WB match)
  // 2. Winner from LB-A last round
  // 3. Winner from LB-B last round (final LB match)
  const wbWinner = wbMatches.filter(m => m.round_number === 3); // WB final round
  const lbAWinner = lbAMatches.length > 0 
    ? lbAMatches.filter(m => m.round_number === Math.max(...lbAMatches.map(x => x.round_number)))
    : [];
  const lbBWinner = lbBMatches.length > 0 
    ? lbBMatches.filter(m => m.round_number === Math.max(...lbBMatches.map(x => x.round_number)))
    : [];
  const groupWinners = [...wbWinner, ...lbAWinner, ...lbBWinner];

  // Layout configuration
  const CARD_WIDTH = 200; // Giảm từ 280 xuống 200
  const CARD_HEIGHT = 90; // Giảm từ 120 xuống 90
  const HORIZONTAL_GAP = 120;
  const VERTICAL_GAP = 5; // Giảm từ 10 xuống 5
  const SECTION_VERTICAL_SPACING = 30; // Giảm từ 40 xuống 30
  const HEADER_HEIGHT = 40; // Giảm từ 50 xuống 40

  // Calculate positions for each bracket with centered tournament tree layout
  const positionedMatches = useMemo(() => {
    const positioned: {
      wb: PositionedMatch[];
      lbA: PositionedMatch[];
      lbB: PositionedMatch[];
    } = { wb: [], lbA: [], lbB: [] };

    // Position Winner Bracket at top with centered tree layout (leave space for header)
    positioned.wb = calculateTreePositions(
      wbMatches, 
      HEADER_HEIGHT, 
      CARD_WIDTH, 
      CARD_HEIGHT, 
      HORIZONTAL_GAP, 
      VERTICAL_GAP
    );

    // Calculate total height of WB
    const wbHeight = Math.max(...positioned.wb.map(m => m.y + m.height), 0);
    
    // Position Loser Bracket A below WB (add HEADER_HEIGHT for title space)
    const lbAStartY = wbHeight + SECTION_VERTICAL_SPACING + HEADER_HEIGHT;
    positioned.lbA = calculateTreePositions(
      lbAMatches, 
      lbAStartY, 
      CARD_WIDTH, 
      CARD_HEIGHT, 
      HORIZONTAL_GAP, 
      VERTICAL_GAP
    );

    // Calculate total height including LB-A
    const lbAHeight = Math.max(...positioned.lbA.map(m => m.y + m.height), lbAStartY);
    
    // Position Loser Bracket B below LB-A (add HEADER_HEIGHT for title space)
    const lbBStartY = lbAHeight + SECTION_VERTICAL_SPACING + HEADER_HEIGHT;
    positioned.lbB = calculateTreePositions(
      lbBMatches, 
      lbBStartY, 
      CARD_WIDTH, 
      CARD_HEIGHT, 
      HORIZONTAL_GAP, 
      VERTICAL_GAP
    );

    return positioned;
  }, [wbMatches, lbAMatches, lbBMatches]);

  // Calculate total dimensions with extra padding on the right
  const EXTRA_RIGHT_PADDING = 200; // Extra space on the right to prevent cutoff
  const totalWidth = Math.max(
    ...positionedMatches.wb.map(m => m.x + CARD_WIDTH),
    ...positionedMatches.lbA.map(m => m.x + CARD_WIDTH),
    ...positionedMatches.lbB.map(m => m.x + CARD_WIDTH),
    1000
  ) + EXTRA_RIGHT_PADDING;

  const totalHeight = Math.max(
    ...positionedMatches.wb.map(m => m.y + m.height),
    ...positionedMatches.lbA.map(m => m.y + m.height),
    ...positionedMatches.lbB.map(m => m.y + m.height),
    800
  );

  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Chưa có trận đấu trong group {groupName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-950 p-8">
      <div
        className="relative"
        style={{ width: totalWidth + 100, height: totalHeight + 100 }}
      >
        {/* Connection lines SVG layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={totalWidth + 100}
          height={totalHeight + 100}
          style={{ zIndex: 0 }}
        >
          {/* Winner Bracket connections */}
          {renderConnections(positionedMatches.wb, '#22c55e', 2, CARD_WIDTH)}
          
          {/* Loser Bracket A connections */}
          {renderConnections(positionedMatches.lbA, '#f97316', 2, CARD_WIDTH)}
          
          {/* Loser Bracket B connections */}
          {renderConnections(positionedMatches.lbB, '#ef4444', 2, CARD_WIDTH)}
          
          {/* Connections from WB to LB-A (losers) */}
          {renderLoserConnections(
            positionedMatches.wb,
            positionedMatches.lbA,
            '#64748b',
            true
          )}
          
          {/* Connections from LB-A to LB-B (losers) */}
          {renderLoserConnections(
            positionedMatches.lbA,
            positionedMatches.lbB,
            '#64748b',
            true
          )}
          
          {/* Connections from Group Winners to Cross Finals */}
          {crossFinalMatches.length > 0 && renderCrossFinalConnections(
            [
              ...positionedMatches.wb.filter(m => groupWinners.some(w => w.id === m.id)),
              ...positionedMatches.lbA.filter(m => groupWinners.some(w => w.id === m.id)),
              ...positionedMatches.lbB.filter(m => groupWinners.some(w => w.id === m.id))
            ],
            totalWidth,
            '#a78bfa'
          )}
        </svg>

        {/* Winner Bracket */}
        <div className="absolute" style={{ top: 0, left: 0 }}>
          <div className="flex items-center gap-2 mb-4 ml-2">
            <Trophy className="w-5 h-5 text-green-400" />
            <span className="text-sm font-bold text-green-400">Winner Bracket</span>
            <span className="text-xs text-slate-500">({wbMatches.length} matches)</span>
          </div>
          {positionedMatches.wb.map(match => (
            <div
              key={match.id}
              className="absolute"
              style={{
                left: match.x,
                top: match.y,
                width: CARD_WIDTH,
                zIndex: 10
              }}
            >
              <MatchCard match={match} allMatches={allMatches} />
            </div>
          ))}
        </div>

        {/* Loser Bracket A */}
        {lbAMatches.length > 0 && (
          <div className="absolute" style={{ top: (positionedMatches.lbA[0]?.y || 0) - HEADER_HEIGHT, left: 0 }}>
            <div className="flex items-center gap-2 mb-4 ml-2">
              <Target className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-bold text-orange-400">Loser Bracket A</span>
              <span className="text-xs text-slate-500">({lbAMatches.length} matches)</span>
            </div>
            {positionedMatches.lbA.map(match => (
              <div
                key={match.id}
                className="absolute"
                style={{
                  left: match.x,
                  top: match.y - (positionedMatches.lbA[0]?.y || 0) + HEADER_HEIGHT,
                  width: CARD_WIDTH,
                  zIndex: 10
                }}
              >
                <MatchCard match={match} allMatches={allMatches} />
              </div>
            ))}
          </div>
        )}

        {/* Loser Bracket B */}
        {lbBMatches.length > 0 && (
          <div className="absolute" style={{ top: (positionedMatches.lbB[0]?.y || 0) - HEADER_HEIGHT, left: 0 }}>
            <div className="flex items-center gap-2 mb-4 ml-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm font-bold text-red-400">Loser Bracket B</span>
              <span className="text-xs text-slate-500">({lbBMatches.length} matches)</span>
            </div>
            {positionedMatches.lbB.map(match => (
              <div
                key={match.id}
                className="absolute"
                style={{
                  left: match.x,
                  top: match.y - (positionedMatches.lbB[0]?.y || 0) + HEADER_HEIGHT,
                  width: CARD_WIDTH,
                  zIndex: 10
                }}
              >
                <MatchCard match={match} allMatches={allMatches} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Group matches by round number
 */
function groupByRound(matches: BracketMatch[]): { [round: number]: BracketMatch[] } {
  const rounds: { [round: number]: BracketMatch[] } = {};
  for (const match of matches) {
    const round = match.round_number;
    if (!rounds[round]) rounds[round] = [];
    rounds[round].push(match);
  }
  // Sort matches within each round by match_number
  Object.keys(rounds).forEach(round => {
    rounds[Number(round)].sort((a, b) => a.match_number - b.match_number);
  });
  return rounds;
}

/**
 * Render connection lines between matches in same bracket
 */
function renderConnections(
  matches: PositionedMatch[],
  color: string,
  strokeWidth: number,
  cardWidth: number
): React.ReactNode[] {
  const connections: React.ReactNode[] = [];
  const rounds = groupByRound(matches);
  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  for (let i = 0; i < roundNumbers.length - 1; i++) {
    const currentRound = rounds[roundNumbers[i]];
    const nextRound = rounds[roundNumbers[i + 1]];

    nextRound.forEach((nextMatch, idx) => {
      const posNext = matches.find(m => m.id === nextMatch.id);
      if (!posNext) return;

      // Connect from 2 previous matches
      const sourceMatch1 = currentRound[idx * 2];
      const sourceMatch2 = currentRound[idx * 2 + 1];

      if (sourceMatch1) {
        const pos1 = matches.find(m => m.id === sourceMatch1.id);
        if (pos1) {
          connections.push(
            <path
              key={`${pos1.id}-${posNext.id}`}
              d={createPath(
                pos1.x + cardWidth,
                pos1.y + pos1.height / 2,
                posNext.x,
                posNext.y + posNext.height / 2
              )}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              opacity={0.5}
            />
          );
        }
      }

      if (sourceMatch2) {
        const pos2 = matches.find(m => m.id === sourceMatch2.id);
        if (pos2) {
          connections.push(
            <path
              key={`${pos2.id}-${posNext.id}`}
              d={createPath(
                pos2.x + cardWidth,
                pos2.y + pos2.height / 2,
                posNext.x,
                posNext.y + posNext.height / 2
              )}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              opacity={0.5}
            />
          );
        }
      }
    });
  }

  return connections;
}

/**
 * Render loser connections (dashed lines) between brackets
 */
function renderLoserConnections(
  fromMatches: PositionedMatch[],
  toMatches: PositionedMatch[],
  color: string,
  dashed: boolean
): React.ReactNode[] {
  const connections: React.ReactNode[] = [];
  
  // Simple heuristic: connect based on round numbers
  // This is simplified - in production you'd use actual advancement data
  fromMatches.forEach((fromMatch, idx) => {
    const toMatch = toMatches[idx];
    if (toMatch) {
      connections.push(
        <path
          key={`loser-${fromMatch.id}-${toMatch.id}`}
          d={createPath(
            fromMatch.x + 280,
            fromMatch.y + fromMatch.height / 2,
            toMatch.x,
            toMatch.y + toMatch.height / 2
          )}
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray={dashed ? '4,4' : 'none'}
          fill="none"
          opacity={0.3}
        />
      );
    }
  });

  return connections;
}

/**
 * Render connections from group winners to Cross Finals
 * Shows where the 2 group winners advance to next
 */
function renderCrossFinalConnections(
  groupWinners: PositionedMatch[],
  totalWidth: number,
  color: string = '#a78bfa' // Purple for cross finals
): React.ReactNode[] {
  const connections: React.ReactNode[] = [];
  
  if (groupWinners.length === 0) return connections;
  
  // Draw arrow indicators showing winners go to Cross Finals
  groupWinners.forEach((winner, idx) => {
    const startX = winner.x + 280; // Right edge of card
    const startY = winner.y + winner.height / 2;
    const endX = totalWidth + 80; // Beyond the visible area
    const endY = startY;
    
    connections.push(
      <g key={`cross-${winner.id}`}>
        {/* Main line */}
        <path
          d={`M ${startX} ${startY} L ${endX} ${endY}`}
          stroke={color}
          strokeWidth={3}
          strokeDasharray="8,4"
          fill="none"
          opacity={0.6}
        />
        {/* Arrow head */}
        <polygon
          points={`${endX},${endY} ${endX-10},${endY-5} ${endX-10},${endY+5}`}
          fill={color}
          opacity={0.6}
        />
        {/* Label */}
        <text
          x={endX - 70}
          y={startY - 10}
          fill={color}
          fontSize="12"
          fontWeight="bold"
          opacity={0.8}
        >
          → Cross Finals
        </text>
      </g>
    );
  });
  
  return connections;
}

/**
 * Create SVG path with right angles (professional bracket look)
 */
function createPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const midX = (fromX + toX) / 2;
  return `
    M ${fromX} ${fromY}
    L ${midX} ${fromY}
    L ${midX} ${toY}
    L ${toX} ${toY}
  `;
}

export default FullBracketView;
