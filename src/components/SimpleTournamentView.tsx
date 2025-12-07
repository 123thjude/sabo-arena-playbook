/**
 * Simple Tournament View - Full SVG bracket for DE16/DE32 (no groups)
 * Layout: WB on top-left, LB-A below, LB-B below that, SABO Finals on right
 * Mobile/Tablet optimized with touch support
 * View only - Score entry via "Kết quả" tab
 */

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Hand } from 'lucide-react';
import type { BracketMatch } from '@/types/bracket';

interface SimpleTournamentViewProps {
  wbMatches: BracketMatch[];
  lbaMatches: BracketMatch[];
  lbbMatches: BracketMatch[];
  saboMatches: BracketMatch[];
  allMatches: BracketMatch[];
  tournamentName?: string;
}

interface PositionedMatch extends BracketMatch {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Responsive card dimensions
const getCardDimensions = (isMobile: boolean, isTablet: boolean) => {
  if (isMobile) {
    return { CARD_WIDTH: 160, CARD_HEIGHT: 56, HORIZONTAL_GAP: 40, VERTICAL_GAP: 16, SECTION_GAP: 60 };
  }
  if (isTablet) {
    return { CARD_WIDTH: 190, CARD_HEIGHT: 64, HORIZONTAL_GAP: 55, VERTICAL_GAP: 20, SECTION_GAP: 80 };
  }
  return { CARD_WIDTH: 220, CARD_HEIGHT: 70, HORIZONTAL_GAP: 70, VERTICAL_GAP: 25, SECTION_GAP: 100 };
};

// Default card dimensions (desktop)
const CARD_WIDTH = 220;
const CARD_HEIGHT = 70;
const HORIZONTAL_GAP = 70;
const VERTICAL_GAP = 25;
const SECTION_GAP = 100;

// Colors
const COLORS = {
  wb: { bg: '#065f46', border: '#10b981', text: '#34d399', label: 'Winner Bracket' },
  lba: { bg: '#7c2d12', border: '#f97316', text: '#fb923c', label: 'Loser Bracket A' },
  lbb: { bg: '#7f1d1d', border: '#ef4444', text: '#f87171', label: 'Loser Bracket B' },
  sabo: { bg: '#581c87', border: '#a855f7', text: '#c084fc', label: 'SABO Finals' },
};

function groupByRound(matches: BracketMatch[]): Record<number, BracketMatch[]> {
  const groups: Record<number, BracketMatch[]> = {};
  matches.forEach(m => {
    if (!groups[m.round_number]) groups[m.round_number] = [];
    groups[m.round_number].push(m);
  });
  // Sort matches within each round
  Object.values(groups).forEach(roundMatches => {
    roundMatches.sort((a, b) => a.match_number - b.match_number);
  });
  return groups;
}

/**
 * Calculate bracket tree positions
 * Special handling for LB-B style brackets where some rounds receive external players
 */
function calculateBracketPositions(
  matches: BracketMatch[],
  startX: number,
  startY: number,
  bracketType?: string
): PositionedMatch[] {
  if (matches.length === 0) return [];

  const rounds = groupByRound(matches);
  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
  const positioned: PositionedMatch[] = [];

  // SABO Finals special layout - pyramid style with trophy on top
  // Layout:  Semi1     Semi2
  //              Final
  //               🏆
  const isSABO = bracketType === 'SABO';
  if (isSABO) {
    const totalMatches = matches.length;
    
    // For 3 matches (typical SABO): 2 semis on top, 1 final below centered
    if (totalMatches === 3 || (roundNumbers.length >= 2)) {
      // Find semi-finals (first 2 matches by match_number or first round with 2 matches)
      const r1 = rounds[roundNumbers[0]] || [];
      const r2 = roundNumbers.length > 1 ? rounds[roundNumbers[1]] : [];
      const r3 = roundNumbers.length > 2 ? rounds[roundNumbers[2]] : [];
      
      // Check if we have 2 semis + 1 final pattern
      const hasTwoSemis = r1.length === 2 || (r1.length === 1 && r2.length === 1);
      
      if (hasTwoSemis && r1.length === 2) {
        // Pattern: R1 has 2 semis, R2 has final
        const semiSpacing = CARD_WIDTH + 80; // Horizontal space between semis
        
        // Semi 1 (left)
        positioned.push({
          ...r1[0],
          x: startX,
          y: startY,
          width: CARD_WIDTH,
          height: CARD_HEIGHT
        });
        
        // Semi 2 (right)
        positioned.push({
          ...r1[1],
          x: startX + semiSpacing,
          y: startY,
          width: CARD_WIDTH,
          height: CARD_HEIGHT
        });
        
        // Final (centered below)
        if (r2.length > 0) {
          positioned.push({
            ...r2[0],
            x: startX + semiSpacing / 2,
            y: startY + CARD_HEIGHT + 50,
            width: CARD_WIDTH,
            height: CARD_HEIGHT
          });
        }
        
        // Reset match if exists (below final)
        if (r3.length > 0) {
          positioned.push({
            ...r3[0],
            x: startX + semiSpacing / 2,
            y: startY + 2 * (CARD_HEIGHT + 50),
            width: CARD_WIDTH,
            height: CARD_HEIGHT
          });
        }
      } else {
        // Pattern: 3 separate rounds (1-1-1 pattern for DE16 SABO)
        // Treat R1 and R2 as semis, R3 as final
        const semiSpacing = CARD_WIDTH + 80;
        
        // Match 1 / Semi 1 (left)
        if (r1.length > 0) {
          positioned.push({
            ...r1[0],
            x: startX,
            y: startY,
            width: CARD_WIDTH,
            height: CARD_HEIGHT
          });
        }
        
        // Match 2 / Semi 2 (right, same row)
        if (r2.length > 0) {
          positioned.push({
            ...r2[0],
            x: startX + semiSpacing,
            y: startY,
            width: CARD_WIDTH,
            height: CARD_HEIGHT
          });
        }
        
        // Match 3 / Final (centered below)
        if (r3.length > 0) {
          positioned.push({
            ...r3[0],
            x: startX + semiSpacing / 2,
            y: startY + CARD_HEIGHT + 50,
            width: CARD_WIDTH,
            height: CARD_HEIGHT
          });
        }
      }
      
      return positioned;
    }
    
    // Fallback: simple horizontal layout
    matches.forEach((match, i) => {
      positioned.push({
        ...match,
        x: startX + i * (CARD_WIDTH + HORIZONTAL_GAP),
        y: startY,
        width: CARD_WIDTH,
        height: CARD_HEIGHT
      });
    });
    
    return positioned;
  }

  // For LB-B, we have a special structure:
  // SABO DE16 LB-B has 5 matches (#22-26) across 3 rounds:
  // Round 1: 2 matches (#22, #23)
  // Round 2: 2 matches (#24, #25) 
  // Round 3: 1 match (#26 - final)
  const isLBB = bracketType === 'LB-B';
  
  // Analyze the bracket structure
  const roundSizes = roundNumbers.map(r => rounds[r].length);
  // LB-B pattern: [2, 2, 1] - R1 and R2 have same size, then R3 is final
  const hasInterleavedRounds = roundSizes.length >= 3 && 
    roundSizes[0] === roundSizes[1] && 
    roundSizes[2] < roundSizes[1];

  // Force LB-B layout when explicitly marked, regardless of detected pattern
  if (isLBB) {
    // Distribute matches into visual columns based on round number
    // Group consecutive same-size rounds together
    
    // For LB-B with 5 matches, we want:
    // Column 0: R1 matches (2)
    // Column 1: R2 matches (2)  
    // Column 2: R3 match (1 - centered)
    
    let currentX = startX;
    let lastRoundEndY = startY;
    
    for (let rIdx = 0; rIdx < roundNumbers.length; rIdx++) {
      const roundNum = roundNumbers[rIdx];
      const roundMatches = rounds[roundNum];
      const prevRoundNum = rIdx > 0 ? roundNumbers[rIdx - 1] : null;
      const prevRoundPositioned = prevRoundNum 
        ? positioned.filter(m => m.round_number === prevRoundNum)
        : [];
      
      if (rIdx === 0) {
        // First round - position vertically
        roundMatches.forEach((match, i) => {
          positioned.push({
            ...match,
            x: currentX,
            y: startY + i * (CARD_HEIGHT + VERTICAL_GAP),
            width: CARD_WIDTH,
            height: CARD_HEIGHT
          });
        });
      } else if (roundMatches.length === prevRoundPositioned.length) {
        // Same size round - align with previous
        roundMatches.forEach((match, i) => {
          const prevMatch = prevRoundPositioned[i];
          positioned.push({
            ...match,
            x: currentX,
            y: prevMatch ? prevMatch.y : startY + i * (CARD_HEIGHT + VERTICAL_GAP),
            width: CARD_WIDTH,
            height: CARD_HEIGHT
          });
        });
      } else {
        // Smaller round - center between previous matches
        roundMatches.forEach((match, matchIdx) => {
          const pairStartIdx = matchIdx * 2;
          const prev1 = prevRoundPositioned[pairStartIdx];
          const prev2 = prevRoundPositioned[pairStartIdx + 1];
          
          if (prev1 && prev2) {
            const centerY = (prev1.y + prev2.y + CARD_HEIGHT) / 2 - CARD_HEIGHT / 2;
            positioned.push({
              ...match,
              x: currentX,
              y: centerY,
              width: CARD_WIDTH,
              height: CARD_HEIGHT
            });
          } else if (prev1) {
            positioned.push({
              ...match,
              x: currentX,
              y: prev1.y,
              width: CARD_WIDTH,
              height: CARD_HEIGHT
            });
          }
        });
      }
      
      currentX += CARD_WIDTH + HORIZONTAL_GAP;
    }
    
    return positioned;
  }

  if (hasInterleavedRounds) {
    // Special LB-B layout: stack R1 and R2 vertically, then R3 centered
    // Column 0: R1 matches (top)
    // Column 0: R2 matches (bottom, offset)  
    // Column 1: R3 match (centered)
    
    const r1Matches = rounds[roundNumbers[0]];
    const r2Matches = rounds[roundNumbers[1]];
    const r3Matches = roundNumbers.length > 2 ? rounds[roundNumbers[2]] : [];
    
    // R1 at top
    r1Matches.forEach((match, i) => {
      positioned.push({
        ...match,
        x: startX,
        y: startY + i * (CARD_HEIGHT + VERTICAL_GAP),
        width: CARD_WIDTH,
        height: CARD_HEIGHT
      });
    });
    
    // R2 next column, aligned with R1
    const r2StartX = startX + CARD_WIDTH + HORIZONTAL_GAP;
    r2Matches.forEach((match, i) => {
      positioned.push({
        ...match,
        x: r2StartX,
        y: startY + i * (CARD_HEIGHT + VERTICAL_GAP),
        width: CARD_WIDTH,
        height: CARD_HEIGHT
      });
    });
    
    // R3 (and beyond) - centered between previous round
    let currentX = r2StartX + CARD_WIDTH + HORIZONTAL_GAP;
    for (let rIdx = 2; rIdx < roundNumbers.length; rIdx++) {
      const currentRoundNum = roundNumbers[rIdx];
      const prevRoundNum = roundNumbers[rIdx - 1];
      const roundMatches = rounds[currentRoundNum];
      const prevRoundPositioned = positioned.filter(m => m.round_number === prevRoundNum);
      
      roundMatches.forEach((match, matchIdx) => {
        const pairStartIdx = matchIdx * 2;
        const prev1 = prevRoundPositioned[pairStartIdx];
        const prev2 = prevRoundPositioned[pairStartIdx + 1];
        
        if (prev1 && prev2) {
          const centerY = (prev1.y + prev2.y + CARD_HEIGHT) / 2 - CARD_HEIGHT / 2;
          positioned.push({
            ...match,
            x: currentX,
            y: centerY,
            width: CARD_WIDTH,
            height: CARD_HEIGHT
          });
        } else if (prev1) {
          positioned.push({
            ...match,
            x: currentX,
            y: prev1.y,
            width: CARD_WIDTH,
            height: CARD_HEIGHT
          });
        }
      });
      
      currentX += CARD_WIDTH + HORIZONTAL_GAP;
    }
    
    return positioned;
  }

  // Standard bracket positioning (WB, LB-A, SABO)
  // Position first round
  const firstRound = rounds[roundNumbers[0]];
  firstRound.forEach((match, i) => {
    positioned.push({
      ...match,
      x: startX,
      y: startY + i * (CARD_HEIGHT + VERTICAL_GAP),
      width: CARD_WIDTH,
      height: CARD_HEIGHT
    });
  });

  // Position subsequent rounds (centered between source matches)
  for (let roundIdx = 1; roundIdx < roundNumbers.length; roundIdx++) {
    const currentRoundNum = roundNumbers[roundIdx];
    const prevRoundNum = roundNumbers[roundIdx - 1];
    const roundMatches = rounds[currentRoundNum];
    const x = startX + roundIdx * (CARD_WIDTH + HORIZONTAL_GAP);
    const prevRoundPositioned = positioned.filter(m => m.round_number === prevRoundNum);

    // Check if same size round (like LB-A drop-down patterns)
    const isSameSizeRound = roundMatches.length === prevRoundPositioned.length;

    roundMatches.forEach((match, matchIdx) => {
      if (isSameSizeRound) {
        // Align with corresponding match
        const prevMatch = prevRoundPositioned[matchIdx];
        if (prevMatch) {
          positioned.push({
            ...match,
            x,
            y: prevMatch.y,
            width: CARD_WIDTH,
            height: CARD_HEIGHT
          });
        }
      } else {
        // Center between 2 previous matches
        const pairStartIdx = matchIdx * 2;
        const prevMatch1 = prevRoundPositioned[pairStartIdx];
        const prevMatch2 = prevRoundPositioned[pairStartIdx + 1];

        if (prevMatch1 && prevMatch2) {
          const centerY = (prevMatch1.y + prevMatch2.y + CARD_HEIGHT) / 2 - CARD_HEIGHT / 2;
          positioned.push({
            ...match,
            x,
            y: centerY,
            width: CARD_WIDTH,
            height: CARD_HEIGHT
          });
        } else if (prevMatch1) {
          positioned.push({
            ...match,
            x,
            y: prevMatch1.y,
            width: CARD_WIDTH,
            height: CARD_HEIGHT
          });
        }
      }
    });
  }

  return positioned;
}

/**
 * Calculate section dimensions
 */
function getSectionBounds(matches: PositionedMatch[]): { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number } {
  if (matches.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  
  const minX = Math.min(...matches.map(m => m.x));
  const maxX = Math.max(...matches.map(m => m.x + m.width));
  const minY = Math.min(...matches.map(m => m.y));
  const maxY = Math.max(...matches.map(m => m.y + m.height));
  
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Match Card Component - View only
 */
const MatchCardSVG: React.FC<{
  match: PositionedMatch;
  colors: typeof COLORS.wb;
}> = ({ match, colors }) => {
  // Get player names from various possible fields
  const getPlayerName = (player: BracketMatch['player1'], playerName: string | null): string => {
    if (player) {
      return player.full_name || player.display_name || player.username || 'TBD';
    }
    return playerName || 'TBD';
  };

  // Get player rank
  const getPlayerRank = (player: BracketMatch['player1']): string | null => {
    if (player && player.rank) {
      return player.rank;
    }
    return null;
  };

  const player1Name = getPlayerName(match.player1, match.player1_name);
  const player2Name = getPlayerName(match.player2, match.player2_name);
  const player1Avatar = match.player1?.avatar_url;
  const player2Avatar = match.player2?.avatar_url;
  const player1Rank = getPlayerRank(match.player1);
  const player2Rank = getPlayerRank(match.player2);
  
  const isComplete = match.status === 'completed';
  const winner = isComplete ? (match.winner_id === match.player1_id ? 1 : match.winner_id === match.player2_id ? 2 : 0) : 0;

  // Truncate name helper
  const truncateName = (name: string, maxLen: number) => 
    name.length > maxLen ? name.substring(0, maxLen - 1) + '…' : name;

  // Rank color helper
  const getRankColor = (rank: string | null): string => {
    if (!rank) return '#888';
    const r = rank.toUpperCase();
    if (r.includes('K')) return '#f59e0b';
    if (r.includes('I+') || r.includes('I-PLUS')) return '#a855f7';
    if (r.includes('I')) return '#3b82f6';
    if (r.includes('H')) return '#10b981';
    return '#888';
  };

  return (
    <g transform={`translate(${match.x}, ${match.y})`}>
      {/* Card background with gradient effect */}
      <defs>
        <linearGradient id={`grad-${match.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.bg} stopOpacity="1" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
        </linearGradient>
        {/* Clip paths for avatars - position depends on rank badge presence */}
        <clipPath id={`avatar1-${match.id}`}>
          <circle cx={player1Rank ? 46 : 18} cy={18} r={10} />
        </clipPath>
        <clipPath id={`avatar2-${match.id}`}>
          <circle cx={player2Rank ? 46 : 18} cy={48} r={10} />
        </clipPath>
      </defs>
      
      <rect
        x={0}
        y={0}
        width={match.width}
        height={match.height}
        rx={8}
        fill={`url(#grad-${match.id})`}
        stroke={colors.border}
        strokeWidth={2}
      />
      
      {/* Match number badge */}
      <rect
        x={match.width - 32}
        y={3}
        width={28}
        height={16}
        rx={4}
        fill={colors.border}
        opacity={0.4}
      />
      <text
        x={match.width - 18}
        y={14}
        fontSize={10}
        fill="#fff"
        textAnchor="middle"
        fontWeight="bold"
      >
        #{match.match_number}
      </text>

      {/* Player 1 Row */}
      <rect
        x={4}
        y={5}
        width={match.width - 44}
        height={28}
        rx={4}
        fill={winner === 1 ? colors.border : 'rgba(0,0,0,0.4)'}
        opacity={winner === 1 ? 0.5 : 1}
      />
      {/* Player 1 Rank Badge - Before Avatar */}
      {player1Rank && (
        <>
          <rect
            x={8}
            y={10}
            width={24}
            height={14}
            rx={3}
            fill={getRankColor(player1Rank)}
            opacity={0.9}
          />
          <text
            x={20}
            y={20}
            fontSize={9}
            fill="#fff"
            textAnchor="middle"
            fontWeight="bold"
          >
            {player1Rank}
          </text>
        </>
      )}
      {/* Player 1 Avatar */}
      {player1Avatar ? (
        <g clipPath={`url(#avatar1-${match.id})`}>
          <image
            href={player1Avatar}
            x={player1Rank ? 36 : 8}
            y={8}
            width={20}
            height={20}
            preserveAspectRatio="xMidYMid slice"
          />
        </g>
      ) : (
        <circle cx={player1Rank ? 46 : 18} cy={18} r={10} fill="rgba(255,255,255,0.2)" />
      )}
      {/* Player 1 Name */}
      <text
        x={player1Rank ? 62 : 34}
        y={23}
        fontSize={12}
        fill={winner === 1 ? '#fff' : '#ddd'}
        fontWeight={winner === 1 ? 'bold' : 'normal'}
      >
        {truncateName(player1Name, player1Rank ? 10 : 14)}
      </text>
      {/* Player 1 Score */}
      {isComplete && (
        <text
          x={match.width - 50}
          y={23}
          fontSize={13}
          fill={winner === 1 ? '#4ade80' : '#888'}
          textAnchor="end"
          fontWeight="bold"
        >
          {match.player1_score ?? 0}
        </text>
      )}

      {/* Divider line */}
      <line x1={8} y1={35} x2={match.width - 40} y2={35} stroke={colors.border} strokeOpacity={0.3} strokeWidth={1} />

      {/* Player 2 Row */}
      <rect
        x={4}
        y={37}
        width={match.width - 44}
        height={28}
        rx={4}
        fill={winner === 2 ? colors.border : 'rgba(0,0,0,0.4)'}
        opacity={winner === 2 ? 0.5 : 1}
      />
      {/* Player 2 Rank Badge - Before Avatar */}
      {player2Rank && (
        <>
          <rect
            x={8}
            y={42}
            width={24}
            height={14}
            rx={3}
            fill={getRankColor(player2Rank)}
            opacity={0.9}
          />
          <text
            x={20}
            y={52}
            fontSize={9}
            fill="#fff"
            textAnchor="middle"
            fontWeight="bold"
          >
            {player2Rank}
          </text>
        </>
      )}
      {/* Player 2 Avatar */}
      {player2Avatar ? (
        <g clipPath={`url(#avatar2-${match.id})`}>
          <image
            href={player2Avatar}
            x={player2Rank ? 36 : 8}
            y={38}
            width={20}
            height={20}
            preserveAspectRatio="xMidYMid slice"
          />
        </g>
      ) : (
        <circle cx={player2Rank ? 46 : 18} cy={48} r={10} fill="rgba(255,255,255,0.2)" />
      )}
      {/* Player 2 Name */}
      <text
        x={player2Rank ? 62 : 34}
        y={55}
        fontSize={12}
        fill={winner === 2 ? '#fff' : '#ddd'}
        fontWeight={winner === 2 ? 'bold' : 'normal'}
      >
        {truncateName(player2Name, player2Rank ? 10 : 14)}
      </text>
      {/* Player 2 Score */}
      {isComplete && (
        <text
          x={match.width - 50}
          y={55}
          fontSize={13}
          fill={winner === 2 ? '#4ade80' : '#888'}
          textAnchor="end"
          fontWeight="bold"
        >
          {match.player2_score ?? 0}
        </text>
      )}
    </g>
  );
};

/**
 * Section Label
 */
const SectionLabel: React.FC<{
  x: number;
  y: number;
  text: string;
  color: string;
  matchCount: number;
}> = ({ x, y, text, color, matchCount }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect
      x={0}
      y={0}
      width={180}
      height={24}
      rx={4}
      fill={color}
      opacity={0.2}
    />
    <text
      x={10}
      y={16}
      fontSize={12}
      fill={color}
      fontWeight="bold"
    >
      {text}
    </text>
    <text
      x={170}
      y={16}
      fontSize={10}
      fill={color}
      textAnchor="end"
      opacity={0.7}
    >
      {matchCount} trận
    </text>
  </g>
);

/**
 * Connection lines between matches
 */
const ConnectionLines: React.FC<{
  matches: PositionedMatch[];
  color: string;
  bracketType?: string;
}> = ({ matches, color, bracketType }) => {
  const rounds = groupByRound(matches);
  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
  const lines: React.ReactNode[] = [];

  // Special handling for SABO pyramid layout (semis on top, final below)
  if (bracketType === 'SABO' && matches.length >= 2) {
    // Find semis and final based on round numbers
    const finalMatch = matches.find(m => m.round_number === Math.max(...matches.map(s => s.round_number)));
    const semiMatches = matches.filter(m => m.id !== finalMatch?.id);
    
    // Draw lines from each semi down to the final
    semiMatches.forEach((semi, idx) => {
      if (finalMatch) {
        const startX = semi.x + semi.width / 2;
        const startY = semi.y + semi.height;
        const endX = finalMatch.x + finalMatch.width / 2;
        const endY = finalMatch.y;
        const midY = (startY + endY) / 2;

        lines.push(
          <path
            key={`sabo-line-${semi.id}`}
            d={`M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`}
            stroke={color}
            strokeWidth={2}
            fill="none"
            opacity={0.7}
          />
        );
      }
    });

    return <>{lines}</>;
  }

  for (let roundIdx = 1; roundIdx < roundNumbers.length; roundIdx++) {
    const currentRoundNum = roundNumbers[roundIdx];
    const prevRoundNum = roundNumbers[roundIdx - 1];
    const currentPositioned = matches.filter(m => m.round_number === currentRoundNum);
    const prevPositioned = matches.filter(m => m.round_number === prevRoundNum);

    const isSameSize = currentPositioned.length === prevPositioned.length;

    currentPositioned.forEach((match, matchIdx) => {
      if (isSameSize) {
        const prevMatch = prevPositioned[matchIdx];
        if (prevMatch) {
          const startX = prevMatch.x + prevMatch.width;
          const startY = prevMatch.y + prevMatch.height / 2;
          const endX = match.x;
          const endY = match.y + match.height / 2;
          const midX = (startX + endX) / 2;

          lines.push(
            <path
              key={`line-${match.id}`}
              d={`M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`}
              stroke={color}
              strokeWidth={1.5}
              fill="none"
              opacity={0.5}
            />
          );
        }
      } else {
        const pairStartIdx = matchIdx * 2;
        const prev1 = prevPositioned[pairStartIdx];
        const prev2 = prevPositioned[pairStartIdx + 1];

        if (prev1 && prev2) {
          const startX1 = prev1.x + prev1.width;
          const startY1 = prev1.y + prev1.height / 2;
          const startX2 = prev2.x + prev2.width;
          const startY2 = prev2.y + prev2.height / 2;
          const endX = match.x;
          const endY = match.y + match.height / 2;
          const midX = (startX1 + endX) / 2;

          lines.push(
            <g key={`lines-${match.id}`}>
              <path
                d={`M ${startX1} ${startY1} L ${midX} ${startY1} L ${midX} ${endY}`}
                stroke={color}
                strokeWidth={1.5}
                fill="none"
                opacity={0.5}
              />
              <path
                d={`M ${startX2} ${startY2} L ${midX} ${startY2} L ${midX} ${endY}`}
                stroke={color}
                strokeWidth={1.5}
                fill="none"
                opacity={0.5}
              />
              <path
                d={`M ${midX} ${endY} L ${endX} ${endY}`}
                stroke={color}
                strokeWidth={1.5}
                fill="none"
                opacity={0.5}
              />
            </g>
          );
        }
      }
    });
  }

  return <>{lines}</>;
};

/**
 * Main Component
 */
export const SimpleTournamentView: React.FC<SimpleTournamentViewProps> = ({
  wbMatches,
  lbaMatches,
  lbbMatches,
  saboMatches,
  allMatches,
  tournamentName = 'SABO Tournament'
}) => {
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Touch state for pinch-to-zoom
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastTouchCenter, setLastTouchCenter] = useState<{ x: number; y: number } | null>(null);

  // Detect device type and container size
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Calculate positions for each section
  const { wbPositioned, lbaPositioned, lbbPositioned, saboPositioned, svgWidth, svgHeight } = useMemo(() => {
    const PADDING = 40;
    const LABEL_HEIGHT = 35;
    
    // WB at top
    const wbStart = { x: PADDING, y: PADDING + LABEL_HEIGHT };
    const wbPos = calculateBracketPositions(wbMatches, wbStart.x, wbStart.y, 'WB');
    const wbBounds = getSectionBounds(wbPos);

    // LB-A below WB
    const lbaStartY = wbBounds.maxY + SECTION_GAP + LABEL_HEIGHT;
    const lbaPos = calculateBracketPositions(lbaMatches, PADDING, lbaStartY, 'LB-A');
    const lbaBounds = getSectionBounds(lbaPos);

    // LB-B below LB-A - uses special layout
    const lbbStartY = lbaBounds.maxY + SECTION_GAP + LABEL_HEIGHT;
    const lbbPos = calculateBracketPositions(lbbMatches, PADDING, lbbStartY, 'LB-B');
    const lbbBounds = getSectionBounds(lbbPos);

    // SABO Finals - on the right side, CENTERED between LB-A and LB-B
    const mainBracketWidth = Math.max(wbBounds.width, lbaBounds.width, lbbBounds.width);
    const saboStartX = PADDING + mainBracketWidth + SECTION_GAP + 50; // Extra padding
    // Center SABO vertically in the middle of the entire bracket
    const totalBracketHeight = lbbBounds.maxY - wbBounds.minY;
    const saboHeight = 2 * CARD_HEIGHT + 80; // 2 semi-finals + gap
    const saboStartY = wbBounds.minY + (totalBracketHeight - saboHeight) / 2;
    const saboPos = calculateBracketPositions(saboMatches, saboStartX, Math.max(saboStartY, lbaBounds.minY), 'SABO');
    const saboBounds = getSectionBounds(saboPos);

    // Calculate total dimensions - add extra space for trophy
    const trophyWidth = 120; // Trophy takes about 120px
    const width = Math.max(wbBounds.maxX, lbaBounds.maxX, lbbBounds.maxX, saboBounds.maxX) + PADDING + trophyWidth;
    const height = Math.max(lbbBounds.maxY, saboBounds.maxY) + PADDING;

    return {
      wbPositioned: wbPos,
      lbaPositioned: lbaPos,
      lbbPositioned: lbbPos,
      saboPositioned: saboPos,
      svgWidth: Math.max(width, 1400), // Increased min width
      svgHeight: Math.max(height, 800)
    };
  }, [wbMatches, lbaMatches, lbbMatches, saboMatches]);

  // Mouse handlers for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - pan
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    } else if (e.touches.length === 2) {
      // Two fingers - pinch to zoom
      setLastTouchDistance(getTouchDistance(e.touches));
      setLastTouchCenter(getTouchCenter(e.touches));
    }
  }, [pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging) {
      // Pan
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && lastTouchDistance !== null) {
      // Pinch to zoom
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / lastTouchDistance;
      
      setZoom(prev => {
        const newZoom = Math.round(prev * scale);
        return Math.min(200, Math.max(25, newZoom));
      });
      
      setLastTouchDistance(currentDistance);
    }
  }, [isDragging, dragStart, lastTouchDistance]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setLastTouchDistance(null);
    setLastTouchCenter(null);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    setZoom(prev => Math.min(200, Math.max(25, prev + delta)));
  }, []);

  const resetView = useCallback(() => {
    // Auto-fit zoom based on container size
    if (containerRef.current && svgWidth && svgHeight) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      const fitZoomX = (containerWidth / svgWidth) * 100;
      const fitZoomY = (containerHeight / svgHeight) * 100;
      const fitZoom = Math.min(fitZoomX, fitZoomY, 100);
      
      setZoom(Math.max(25, Math.round(fitZoom)));
    } else {
      setZoom(isMobile ? 40 : isTablet ? 60 : 100);
    }
    setPan({ x: 0, y: 0 });
  }, [isMobile, isTablet, svgWidth, svgHeight]);

  // Auto-fit on initial load for mobile/tablet
  useEffect(() => {
    if ((isMobile || isTablet) && containerRef.current) {
      const timer = setTimeout(() => {
        resetView();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobile, isTablet]);

  // Zoom step for mobile (larger steps for easier control)
  const zoomStep = isMobile ? 15 : 25;

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden touch-none" ref={containerRef}>
      {/* Controls - Responsive */}
      <div className={`absolute z-20 flex gap-1 sm:gap-2 bg-slate-800/95 rounded-lg p-1.5 sm:p-2 border border-slate-700 shadow-lg backdrop-blur-sm
        ${isMobile ? 'top-2 right-2' : 'top-3 right-3'}`}
      >
        <button
          onClick={() => setZoom(z => Math.min(200, z + zoomStep))}
          className="p-1.5 sm:p-2 hover:bg-slate-700 active:bg-slate-600 rounded text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
        </button>
        <span className={`flex items-center text-slate-300 justify-center font-mono
          ${isMobile ? 'text-xs px-1 min-w-[40px]' : 'text-sm px-2 min-w-[50px]'}`}
        >
          {zoom}%
        </span>
        <button
          onClick={() => setZoom(z => Math.max(25, z - zoomStep))}
          className="p-1.5 sm:p-2 hover:bg-slate-700 active:bg-slate-600 rounded text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
        </button>
        <div className="w-px bg-slate-600" />
        <button
          onClick={resetView}
          className="p-1.5 sm:p-2 hover:bg-slate-700 active:bg-slate-600 rounded text-white transition-colors"
          title="Fit to Screen"
        >
          <RotateCcw className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
        </button>
      </div>

      {/* Stats - Responsive */}
      <div className={`absolute z-20 bg-slate-800/95 rounded-lg border border-slate-700 shadow-lg backdrop-blur-sm
        ${isMobile ? 'top-2 left-2 p-2' : 'top-3 left-3 p-3'}`}
      >
        <div className={`text-amber-400 font-bold mb-1.5 truncate max-w-[150px] sm:max-w-none
          ${isMobile ? 'text-xs' : 'text-sm'}`}
        >
          {tournamentName}
        </div>
        <div className={`flex flex-wrap gap-2 sm:gap-4 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
          <span className="text-green-400">WB: {wbMatches.length}</span>
          <span className="text-orange-400">LB-A: {lbaMatches.length}</span>
          <span className="text-red-400">LB-B: {lbbMatches.length}</span>
          <span className="text-purple-400">SABO: {saboMatches.length}</span>
        </div>
      </div>

      {/* Mobile gesture hint */}
      {isMobile && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 bg-slate-800/90 rounded-full px-3 py-1.5 border border-slate-700 flex items-center gap-2 text-xs text-slate-400">
          <Hand className="w-3.5 h-3.5" />
          <span>Kéo để di chuyển • Chụm để zoom</span>
        </div>
      )}

      {/* SVG Canvas with touch support */}
      <div
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          style={{
            transform: `scale(${zoom / 100}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'top left'
          }}
        >
          {/* Background */}
          <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="#0f172a" />

          {/* WB Section */}
          {wbPositioned.length > 0 && (
            <g>
              <SectionLabel
                x={40}
                y={15}
                text={COLORS.wb.label}
                color={COLORS.wb.text}
                matchCount={wbMatches.length}
              />
              <ConnectionLines matches={wbPositioned} color={COLORS.wb.border} />
              {wbPositioned.map(match => (
                <MatchCardSVG key={match.id} match={match} colors={COLORS.wb} />
              ))}
            </g>
          )}

          {/* LB-A Section */}
          {lbaPositioned.length > 0 && (
            <g>
              <SectionLabel
                x={40}
                y={getSectionBounds(wbPositioned).maxY + SECTION_GAP - 20}
                text={COLORS.lba.label}
                color={COLORS.lba.text}
                matchCount={lbaMatches.length}
              />
              <ConnectionLines matches={lbaPositioned} color={COLORS.lba.border} />
              {lbaPositioned.map(match => (
                <MatchCardSVG key={match.id} match={match} colors={COLORS.lba} />
              ))}
            </g>
          )}

          {/* LB-B Section */}
          {lbbPositioned.length > 0 && (
            <g>
              <SectionLabel
                x={40}
                y={getSectionBounds(lbaPositioned).maxY + SECTION_GAP - 20}
                text={COLORS.lbb.label}
                color={COLORS.lbb.text}
                matchCount={lbbMatches.length}
              />
              <ConnectionLines matches={lbbPositioned} color={COLORS.lbb.border} />
              {lbbPositioned.map(match => (
                <MatchCardSVG key={match.id} match={match} colors={COLORS.lbb} />
              ))}
            </g>
          )}

          {/* SABO Finals Section */}
          {saboPositioned.length > 0 && (
            <g>
              <SectionLabel
                x={getSectionBounds(saboPositioned).minX}
                y={getSectionBounds(saboPositioned).minY - 30}
                text={COLORS.sabo.label}
                color={COLORS.sabo.text}
                matchCount={saboMatches.length}
              />
              <ConnectionLines matches={saboPositioned} color={COLORS.sabo.border} bracketType="SABO" />
              {saboPositioned.map(match => (
                <MatchCardSVG key={match.id} match={match} colors={COLORS.sabo} />
              ))}
              
              {/* Trophy icon below the final match in SABO Finals */}
              {(() => {
                const saboBounds = getSectionBounds(saboPositioned);
                const finalMatch = saboPositioned.find(m => m.round_number === Math.max(...saboPositioned.map(s => s.round_number)));
                if (finalMatch) {
                  // Position trophy below and centered under the final match
                  const trophyX = finalMatch.x + finalMatch.width / 2 - 30;
                  const trophyY = finalMatch.y + finalMatch.height + 25;
                  return (
                    <g transform={`translate(${trophyX}, ${trophyY})`}>
                      {/* Trophy glow */}
                      <circle cx={30} cy={30} r={40} fill="#fbbf24" opacity={0.15} />
                      <circle cx={30} cy={30} r={30} fill="#fbbf24" opacity={0.2} />
                      
                      {/* Trophy base */}
                      <rect x={15} y={48} width={30} height={8} rx={2} fill="#b45309" />
                      <rect x={10} y={52} width={40} height={6} rx={2} fill="#92400e" />
                      
                      {/* Trophy cup */}
                      <path
                        d="M 10 10 L 10 30 Q 10 45 30 45 Q 50 45 50 30 L 50 10 Z"
                        fill="url(#trophyGradient)"
                        stroke="#fbbf24"
                        strokeWidth={2}
                      />
                      
                      {/* Trophy handles */}
                      <path
                        d="M 10 15 Q 0 15 0 25 Q 0 35 10 35"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={3}
                      />
                      <path
                        d="M 50 15 Q 60 15 60 25 Q 60 35 50 35"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={3}
                      />
                      
                      {/* Star on trophy */}
                      <polygon
                        points="30,18 33,26 42,26 35,31 38,40 30,35 22,40 25,31 18,26 27,26"
                        fill="#fef3c7"
                        stroke="#f59e0b"
                        strokeWidth={1}
                      />
                      
                      {/* Champion text */}
                      <text
                        x={30}
                        y={72}
                        fontSize={10}
                        fill="#fbbf24"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        CHAMPION
                      </text>
                      
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fcd34d" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                      </defs>
                    </g>
                  );
                }
                return null;
              })()}
            </g>
          )}

          {/* Simplified feeder lines - just labels showing source brackets */}
          {saboPositioned.length > 0 && (
            <g>
              {/* Source labels for SABO semi-finals */}
              {saboPositioned.filter(m => m.round_number === Math.min(...saboPositioned.map(s => s.round_number))).map((match, idx) => {
                const sources = idx === 0 
                  ? ['WB Winner', 'LB-A Winner'] 
                  : ['WB Runner-up', 'LB-B Winner'];
                return (
                  <g key={`source-${match.id}`}>
                    <text
                      x={match.x - 10}
                      y={match.y + 20}
                      fontSize={9}
                      fill="#94a3b8"
                      textAnchor="end"
                    >
                      ← {sources[0]}
                    </text>
                    <text
                      x={match.x - 10}
                      y={match.y + match.height - 8}
                      fontSize={9}
                      fill="#94a3b8"
                      textAnchor="end"
                    >
                      ← {sources[1]}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* Help text - Desktop only */}
      {!isMobile && (
        <div className="absolute bottom-3 left-3 text-xs text-slate-500">
          Kéo để di chuyển • Cuộn chuột để zoom
        </div>
      )}
    </div>
  );
};

export default SimpleTournamentView;
