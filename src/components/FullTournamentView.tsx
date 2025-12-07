/**
 * Full Tournament View - Display all 4 groups + Cross Finals in one screen
 * Layout: 4 groups in corners + Cross Finals in center/bottom
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { MatchCard } from './MatchCard';
import { getAdvancementInfo } from '@/lib/bracket-advancement';
import type { BracketMatch } from '@/types/bracket';

interface FullTournamentViewProps {
  allMatches: BracketMatch[];
  groupAMatches: BracketMatch[];
  groupBMatches: BracketMatch[];
  groupCMatches: BracketMatch[];
  groupDMatches: BracketMatch[];
  crossMatches: BracketMatch[];
  tournamentName?: string;
  isFullscreen?: boolean; // 📱 For mobile landscape layout
}

interface PositionedMatch extends BracketMatch {
  x: number;
  y: number;
  height: number;
}

interface GroupPositions {
  wb: PositionedMatch[];
  lbA: PositionedMatch[];
  lbB: PositionedMatch[];
}

/**
 * Calculate tree-style positions (same as FullBracketView)
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

  // Position first round
  const firstRound = rounds[roundNumbers[0]];
  for (let i = 0; i < firstRound.length; i++) {
    positioned.push({
      ...firstRound[i],
      x: 0,
      y: startY + i * (cardHeight + verticalGap),
      height: cardHeight
    });
  }

  // Position subsequent rounds (centered between source matches)
  for (let roundIdx = 1; roundIdx < roundNumbers.length; roundIdx++) {
    const currentRoundNum = roundNumbers[roundIdx];
    const prevRoundNum = roundNumbers[roundIdx - 1];
    const roundMatches = rounds[currentRoundNum];
    const x = roundIdx * (cardWidth + horizontalGap);

    for (let matchIdx = 0; matchIdx < roundMatches.length; matchIdx++) {
      const currentMatch = roundMatches[matchIdx];
      
      const prevRoundMatches = positioned.filter(m => m.round_number === prevRoundNum);
      
      // Check if this is a "same size" round (e.g., LB-B: 2→2 matches)
      const isSameSizeRound = roundMatches.length === prevRoundMatches.length;
      
      if (isSameSizeRound) {
        // Same number of matches - position vertically aligned with corresponding prev match
        const prevMatch = prevRoundMatches[matchIdx];
        if (prevMatch) {
          positioned.push({
            ...currentMatch,
            x,
            y: prevMatch.y,
            height: cardHeight
          });
        }
      } else if (prevRoundMatches.length >= 2) {
        // Normal bracket - center between 2 previous matches
        const pairStartIdx = matchIdx * 2;
        const prevMatch1 = prevRoundMatches[pairStartIdx];
        const prevMatch2 = prevRoundMatches[pairStartIdx + 1];

        if (prevMatch1 && prevMatch2) {
          const centerY = (prevMatch1.y + prevMatch2.y + prevMatch2.height) / 2 - cardHeight / 2;
          positioned.push({
            ...currentMatch,
            x,
            y: centerY,
            height: cardHeight
          });
        } else if (prevMatch1) {
          positioned.push({
            ...currentMatch,
            x,
            y: prevMatch1.y,
            height: cardHeight
          });
        }
      }
    }
  }

  return positioned;
}

/**
 * Calculate tree-style positions for RIGHT-TO-LEFT layout (Groups B & D)
 * Matches flow from right to left
 */
function calculateTreePositionsRTL(
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

  // Calculate total width needed
  const totalRounds = roundNumbers.length;
  const totalWidth = (totalRounds - 1) * (cardWidth + horizontalGap);

  // Position first round (rightmost)
  const firstRound = rounds[roundNumbers[0]];
  for (let i = 0; i < firstRound.length; i++) {
    positioned.push({
      ...firstRound[i],
      x: totalWidth, // Start from right
      y: startY + i * (cardHeight + verticalGap),
      height: cardHeight
    });
  }

  // Position subsequent rounds (flow leftward)
  for (let roundIdx = 1; roundIdx < roundNumbers.length; roundIdx++) {
    const currentRoundNum = roundNumbers[roundIdx];
    const prevRoundNum = roundNumbers[roundIdx - 1];
    const roundMatches = rounds[currentRoundNum];
    const prevRoundMatches = positioned.filter(m => m.round_number === prevRoundNum);
    const x = totalWidth - roundIdx * (cardWidth + horizontalGap); // Flow left

    // FIX: Handle LB-B same-size rounds (2→2→1)
    const isSameSizeRound = roundMatches.length === prevRoundMatches.length;

    for (let matchIdx = 0; matchIdx < roundMatches.length; matchIdx++) {
      const currentMatch = roundMatches[matchIdx];
      
      if (isSameSizeRound) {
        // Same size round: vertical alignment (e.g., round 201→202: both have 2 matches)
        const prevMatch = prevRoundMatches[matchIdx];
        if (prevMatch) {
          positioned.push({
            ...currentMatch,
            x,
            y: prevMatch.y, // Align vertically with corresponding previous match
            height: cardHeight
          });
        }
      } else if (prevRoundMatches.length >= 2) {
        // Standard elimination: center between two previous matches
        const pairStartIdx = matchIdx * 2;
        const prevMatch1 = prevRoundMatches[pairStartIdx];
        const prevMatch2 = prevRoundMatches[pairStartIdx + 1];

        if (prevMatch1 && prevMatch2) {
          const centerY = (prevMatch1.y + prevMatch2.y + prevMatch2.height) / 2 - cardHeight / 2;
          positioned.push({
            ...currentMatch,
            x,
            y: centerY,
            height: cardHeight
          });
        } else if (prevMatch1) {
          positioned.push({
            ...currentMatch,
            x,
            y: prevMatch1.y,
            height: cardHeight
          });
        }
      }
    }
  }

  return positioned;
}

function groupByRound(matches: BracketMatch[]): Record<number, BracketMatch[]> {
  return matches.reduce((acc, match) => {
    const round = match.round_number;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, BracketMatch[]>);
}

/**
 * Create orthogonal path between two points (right angle connectors)
 * Goes horizontal → vertical → horizontal
 */
function createPath(x1: number, y1: number, x2: number, y2: number): string {
  const midX = (x1 + x2) / 2;
  // H = horizontal line, V = vertical line
  return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
}

/**
 * Render connection lines between matches in same bracket
 */
function renderConnections(
  matches: PositionedMatch[],
  color: string,
  strokeWidth: number,
  cardWidth: number,
  flipHorizontal: boolean = false
): React.ReactNode[] {
  const connections: React.ReactNode[] = [];
  const rounds = groupByRound(matches);
  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  console.log('🔗 Rendering connections:', {
    totalMatches: matches.length,
    rounds: roundNumbers,
    roundCounts: roundNumbers.map(r => ({ round: r, count: rounds[r].length }))
  });

  for (let i = 0; i < roundNumbers.length - 1; i++) {
    const currentRound = rounds[roundNumbers[i]];
    const nextRound = rounds[roundNumbers[i + 1]];

    console.log(`  🔗 Round ${roundNumbers[i]} → Round ${roundNumbers[i + 1]}:`, {
      current: currentRound.length,
      next: nextRound.length
    });

    nextRound.forEach((nextMatch, idx) => {
      const posNext = matches.find(m => m.id === nextMatch.id);
      if (!posNext) return;

      // Connect from 2 previous matches
      const sourceMatch1 = currentRound[idx * 2];
      const sourceMatch2 = currentRound[idx * 2 + 1];

      if (sourceMatch1) {
        const pos1 = matches.find(m => m.id === sourceMatch1.id);
        if (pos1) {
          // RTL: connection goes from left to right (opposite of normal)
          const x1 = flipHorizontal ? pos1.x : pos1.x + cardWidth;
          const x2 = flipHorizontal ? posNext.x + cardWidth : posNext.x;
          
          connections.push(
            <path
              key={`${pos1.id}-${posNext.id}`}
              d={createPath(
                x1,
                pos1.y + pos1.height / 2,
                x2,
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
          // RTL: connection goes from left to right (opposite of normal)
          const x1 = flipHorizontal ? pos2.x : pos2.x + cardWidth;
          const x2 = flipHorizontal ? posNext.x + cardWidth : posNext.x;
          
          connections.push(
            <path
              key={`${pos2.id}-${posNext.id}`}
              d={createPath(
                x1,
                pos2.y + pos2.height / 2,
                x2,
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
 * Render Cross Finals connections with 4-CORNER layout
 * Structure: 4 corners (2 each) → 4 quarters → 2 semis → 1 final
 * Layout: Symmetric radial convergence to center
 */
function renderCrossFinalsConnections(
  matches: PositionedMatch[],
  cardWidth: number
): React.ReactNode[] {
  const connections: React.ReactNode[] = [];
  const rounds = groupByRound(matches);
  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  if (roundNumbers.length < 4) return connections; // Need R1(8), R2(4), Semis(2), Final(1)

  const round1 = rounds[roundNumbers[0]] || []; // 8 matches (4 corners × 2)
  const round2 = rounds[roundNumbers[1]] || []; // 4 matches (quarters)
  const semis = rounds[roundNumbers[2]] || [];   // 2 matches
  const final = rounds[roundNumbers[3]] || [];   // 1 match

  console.log('🔗 Cross Finals 4-CORNER Connections:', {
    round1: round1.length,
    round2: round2.length,
    semis: semis.length,
    final: final.length
  });

  const findPos = (match: BracketMatch) => matches.find(m => m.id === match.id);

  // === CORNERS → QUARTERS ===
  
  // TOP-LEFT CORNER (2 matches) → Top-Left Quarter
  const topLeft = round1.slice(0, 2);
  const topLeftQuarter = round2[0];
  
  if (topLeftQuarter) {
    const quarterPos = findPos(topLeftQuarter);
    if (quarterPos) {
      topLeft.forEach(cornerMatch => {
        const pos = findPos(cornerMatch);
        if (pos) {
          connections.push(
            <path
              key={`${cornerMatch.id}-${topLeftQuarter.id}`}
              d={createPath(
                pos.x + cardWidth, // From right edge
                pos.y + pos.height / 2,
                quarterPos.x, // To left edge
                quarterPos.y + quarterPos.height / 2
              )}
              stroke="#fbbf24"
              strokeWidth={2}
              fill="none"
              opacity={0.6}
            />
          );
        }
      });
    }
  }

  // TOP-RIGHT CORNER (2 matches) → Top-Right Quarter
  const topRight = round1.slice(2, 4);
  const topRightQuarter = round2[1];
  
  if (topRightQuarter) {
    const quarterPos = findPos(topRightQuarter);
    if (quarterPos) {
      topRight.forEach(cornerMatch => {
        const pos = findPos(cornerMatch);
        if (pos) {
          connections.push(
            <path
              key={`${cornerMatch.id}-${topRightQuarter.id}`}
              d={createPath(
                pos.x, // From left edge
                pos.y + pos.height / 2,
                quarterPos.x + cardWidth, // To right edge
                quarterPos.y + quarterPos.height / 2
              )}
              stroke="#fbbf24"
              strokeWidth={2}
              fill="none"
              opacity={0.6}
            />
          );
        }
      });
    }
  }

  // BOTTOM-LEFT CORNER (2 matches) → Bottom-Left Quarter
  const bottomLeft = round1.slice(4, 6);
  const bottomLeftQuarter = round2[2];
  
  if (bottomLeftQuarter) {
    const quarterPos = findPos(bottomLeftQuarter);
    if (quarterPos) {
      bottomLeft.forEach(cornerMatch => {
        const pos = findPos(cornerMatch);
        if (pos) {
          connections.push(
            <path
              key={`${cornerMatch.id}-${bottomLeftQuarter.id}`}
              d={createPath(
                pos.x + cardWidth, // From right edge
                pos.y + pos.height / 2,
                quarterPos.x, // To left edge
                quarterPos.y + quarterPos.height / 2
              )}
              stroke="#fbbf24"
              strokeWidth={2}
              fill="none"
              opacity={0.6}
            />
          );
        }
      });
    }
  }

  // BOTTOM-RIGHT CORNER (2 matches) → Bottom-Right Quarter
  const bottomRight = round1.slice(6, 8);
  const bottomRightQuarter = round2[3];
  
  if (bottomRightQuarter) {
    const quarterPos = findPos(bottomRightQuarter);
    if (quarterPos) {
      bottomRight.forEach(cornerMatch => {
        const pos = findPos(cornerMatch);
        if (pos) {
          connections.push(
            <path
              key={`${cornerMatch.id}-${bottomRightQuarter.id}`}
              d={createPath(
                pos.x, // From left edge
                pos.y + pos.height / 2,
                quarterPos.x + cardWidth, // To right edge
                quarterPos.y + quarterPos.height / 2
              )}
              stroke="#fbbf24"
              strokeWidth={2}
              fill="none"
              opacity={0.6}
            />
          );
        }
      });
    }
  }

  // === QUARTERS → SEMIS (HIGHLIGHTED CONNECTIONS) ===
  
  // Left quarters → Left Semi (M117)
  const leftSemi = semis[0];
  if (leftSemi && topLeftQuarter && bottomLeftQuarter) {
    const semiPos = findPos(leftSemi);
    const tlqPos = findPos(topLeftQuarter);
    
    // Top-Left Quarter → Left Semi (M113 → M117)
    if (semiPos && tlqPos) {
      connections.push(
        <path
          key={`${topLeftQuarter.id}-${leftSemi.id}`}
          d={createPath(
            tlqPos.x + cardWidth / 2,
            tlqPos.y + tlqPos.height,
            semiPos.x + cardWidth / 2,
            semiPos.y
          )}
          stroke="#fbbf24"
          strokeWidth={2.5}
          fill="none"
          opacity={0.7}
        />
      );
    }
  }

  // ⚠️ FIX: M114 → M117 (đường dọc thẳng)
  // M114 là topRightQuarter (round2[1]) nhưng đã swap vị trí xuống bottom-left
  const rightSemi = semis[1];
  if (leftSemi && topRightQuarter) {
    const semiPos = findPos(leftSemi);
    const m114Pos = findPos(topRightQuarter);  // M114 = round2[1]
    
    if (semiPos && m114Pos) {
      connections.push(
        <line
          key={`${topRightQuarter.id}-${leftSemi.id}-vertical`}
          x1={m114Pos.x + cardWidth / 2}
          y1={m114Pos.y}
          x2={semiPos.x + cardWidth / 2}
          y2={semiPos.y + semiPos.height}
          stroke="#fbbf24"
          strokeWidth={2.5}
          opacity={0.7}
        />
      );
    }
  }

  // ⚠️ FIX: M115 → M118 (đường dọc thẳng)
  // M115 là bottomLeftQuarter (round2[2]) nhưng đã swap vị trí lên top-right
  if (rightSemi && bottomLeftQuarter) {
    const semiPos = findPos(rightSemi);
    const m115Pos = findPos(bottomLeftQuarter);  // M115 = round2[2]
    
    if (semiPos && m115Pos) {
      connections.push(
        <line
          key={`${bottomLeftQuarter.id}-${rightSemi.id}-vertical`}
          x1={m115Pos.x + cardWidth / 2}
          y1={m115Pos.y + m115Pos.height}
          x2={semiPos.x + cardWidth / 2}
          y2={semiPos.y}
          stroke="#fbbf24"
          strokeWidth={2.5}
          opacity={0.7}
        />
      );
    }
  }

  // Right quarters → Right Semi (M118)
  if (rightSemi && topRightQuarter && bottomRightQuarter) {
    const semiPos = findPos(rightSemi);
    const brqPos = findPos(bottomRightQuarter);
    
    // Bottom-Right Quarter → Right Semi (M116 → M118)
    if (semiPos && brqPos) {
      connections.push(
        <path
          key={`${bottomRightQuarter.id}-${rightSemi.id}`}
          d={createPath(
            brqPos.x + cardWidth / 2,
            brqPos.y,
            semiPos.x + cardWidth / 2,
            semiPos.y + semiPos.height
          )}
          stroke="#fbbf24"
          strokeWidth={2.5}
          fill="none"
          opacity={0.7}
        />
      );
    }
  }

  // === SEMIS → FINAL (HORIZONTAL CONNECTIONS - HIGHLIGHTED) ===
  if (final[0]) {
    const finalPos = findPos(final[0]);
    if (finalPos) {
      // Left Semi → Final (horizontal right edge to left edge)
      if (leftSemi) {
        const semiPos = findPos(leftSemi);
        if (semiPos) {
          connections.push(
            <path
              key={`${leftSemi.id}-${final[0].id}`}
              d={createPath(
                semiPos.x + cardWidth,
                semiPos.y + semiPos.height / 2,
                finalPos.x,
                finalPos.y + finalPos.height / 2
              )}
              stroke="#fbbf24"
              strokeWidth={3}
              fill="none"
              opacity={0.8}
            />
          );
        }
      }

      // Right Semi → Final (horizontal left edge to right edge)
      if (rightSemi) {
        const semiPos = findPos(rightSemi);
        if (semiPos) {
          connections.push(
            <path
              key={`${rightSemi.id}-${final[0].id}`}
              d={createPath(
                semiPos.x,
                semiPos.y + semiPos.height / 2,
                finalPos.x + cardWidth,
                finalPos.y + finalPos.height / 2
              )}
              stroke="#fbbf24"
              strokeWidth={3}
              fill="none"
              opacity={0.8}
            />
          );
        }
      }
    }
  }

  console.log(`✅ Cross Finals 4-CORNER: Drew ${connections.length} connectors`);
  return connections;
}

export const FullTournamentView = ({
  allMatches,
  groupAMatches,
  groupBMatches,
  groupCMatches,
  groupDMatches,
  crossMatches,
  tournamentName = "SBP x DESTINY 9 BALL OPEN",
  isFullscreen = false
}: FullTournamentViewProps) => {
  // Zoom state
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isManualZoom, setIsManualZoom] = useState(false); // Track if user manually zoomed
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const MIN_SCALE = 0.3;
  const MAX_SCALE = 2;
  
  // 📱 MOBILE SUPPORT
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; dist: number } | null>(null);
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      const landscape = window.innerWidth > window.innerHeight;
      setIsMobile(mobile);
      setIsLandscape(landscape);
      
      // 📱 Mobile: Smaller initial zoom (có zoom/pan controls)
      if (mobile && !isManualZoom) {
        setScale(0.35); // Smaller zoom, user can zoom in with controls
        setTranslateX(0);
        setTranslateY(0);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isManualZoom]);
  
  // Touch event handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - pan
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX - translateX, y: touch.clientY - translateY });
    } else if (e.touches.length === 2) {
      // Two fingers - pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      setTouchStart({ x: centerX, y: centerY, dist });
      setIsPanning(false);
    }
  }, [translateX, translateY]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning) {
      // Pan with single finger
      const touch = e.touches[0];
      setTranslateX(touch.clientX - panStart.x);
      setTranslateY(touch.clientY - panStart.y);
    } else if (e.touches.length === 2 && touchStart) {
      // Pinch zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scaleChange = dist / touchStart.dist;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * scaleChange));
      
      setScale(newScale);
      setTouchStart({ ...touchStart, dist }); // Update distance for next move
      setIsManualZoom(true);
    }
  }, [isPanning, panStart, touchStart, scale, MIN_SCALE, MAX_SCALE]);
  
  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    setTouchStart(null);
  }, []);
  
  // Zoom to cursor position
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // Only zoom with Ctrl/Cmd key
    if (!e.ctrlKey && !e.metaKey) return;
    
    e.preventDefault();
    
    if (!svgRef.current || !containerRef.current) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    // Get mouse position relative to SVG
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate mouse position in SVG coordinates (before zoom)
    const svgX = (mouseX - translateX) / scale;
    const svgY = (mouseY - translateY) / scale;
    
    // Calculate new scale
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
    
    if (newScale === scale) return;
    
    // Calculate new translate to keep mouse position fixed
    const newTranslateX = mouseX - svgX * newScale;
    const newTranslateY = mouseY - svgY * newScale;
    
    setScale(newScale);
    setTranslateX(newTranslateX);
    setTranslateY(newTranslateY);
    setIsManualZoom(true); // User manually zoomed
  }, [scale, translateX, translateY, MIN_SCALE, MAX_SCALE]);

  // Pan (drag) functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsPanning(true);
    setPanStart({ x: e.clientX - translateX, y: e.clientY - translateY });
  }, [translateX, translateY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const newTranslateX = e.clientX - panStart.x;
    const newTranslateY = e.clientY - panStart.y;
    
    setTranslateX(newTranslateX);
    setTranslateY(newTranslateY);
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Layout configuration - STANDARD SIZE (mobile có zoom/pan)
  const CARD_WIDTH = 135;
  const CARD_HEIGHT = 85;
  const HORIZONTAL_GAP = 45;
  const VERTICAL_GAP = 12;
  const CROSS_FINALS_VERTICAL_GAP = 30;
  const SECTION_VERTICAL_SPACING = 30;
  const HEADER_HEIGHT = 28;
  const GROUP_HORIZONTAL_GAP = 120;
  const GROUP_VERTICAL_GAP = 45;

  // Helper to calculate positions for one group (LEFT-TO-RIGHT)
  // NEW: WB on left, LB-A + LB-B stacked on right
  const calculateGroupPositions = (matches: BracketMatch[]): GroupPositions => {
    const wbMatches = matches.filter(m => m.bracket_type === 'WB');
    const lbAMatches = matches.filter(m => m.bracket_type === 'LB-A');
    const lbBMatches = matches.filter(m => m.bracket_type === 'LB-B');

    console.log('🔍 calculateGroupPositions:', {
      total: matches.length,
      wb: wbMatches.length,
      lbA: lbAMatches.length,
      lbB: lbBMatches.length,
      lbBMatches: lbBMatches.map(m => ({ id: m.match_number, round: m.round_number }))
    });

    const positioned: GroupPositions = { wb: [], lbA: [], lbB: [] };

    // Position Winner Bracket on the LEFT
    positioned.wb = calculateTreePositions(
      wbMatches,
      HEADER_HEIGHT,
      CARD_WIDTH,
      CARD_HEIGHT,
      HORIZONTAL_GAP,
      VERTICAL_GAP
    );

    // Calculate WB width to position LB on the RIGHT
    const wbWidth = Math.max(...positioned.wb.map(m => m.x + CARD_WIDTH), 0);
    const lbStartX = wbWidth + 60; // Tight gap between WB and LB

    // Position Loser Bracket A on RIGHT (top stack)
    const lbAPositioned = calculateTreePositions(
      lbAMatches,
      HEADER_HEIGHT,
      CARD_WIDTH,
      CARD_HEIGHT,
      HORIZONTAL_GAP,
      VERTICAL_GAP
    );
    positioned.lbA = lbAPositioned.map(m => ({ ...m, x: m.x + lbStartX }));

    // Position Loser Bracket B on RIGHT (bottom stack, below LB-A)
    const lbAHeight = Math.max(...positioned.lbA.map(m => m.y + m.height), HEADER_HEIGHT);
    const lbBStartY = lbAHeight + SECTION_VERTICAL_SPACING + HEADER_HEIGHT;
    
    console.log('📐 LB-B Positioning (LTR):', {
      lbAHeight,
      lbBStartY,
      lbBMatchesCount: lbBMatches.length,
      SECTION_VERTICAL_SPACING
    });
    
    const lbBPositioned = calculateTreePositions(
      lbBMatches,
      lbBStartY,
      CARD_WIDTH,
      CARD_HEIGHT,
      HORIZONTAL_GAP,
      VERTICAL_GAP
    );
    positioned.lbB = lbBPositioned.map(m => ({ ...m, x: m.x + lbStartX }));

    return positioned;
  };

  // Helper to calculate positions for RIGHT-TO-LEFT groups (B & D)
  // NEW: WB on right, LB-A + LB-B stacked on left (mirrored)
  const calculateGroupPositionsRTL = (matches: BracketMatch[]): GroupPositions => {
    const wbMatches = matches.filter(m => m.bracket_type === 'WB');
    const lbAMatches = matches.filter(m => m.bracket_type === 'LB-A');
    const lbBMatches = matches.filter(m => m.bracket_type === 'LB-B');

    const positioned: GroupPositions = { wb: [], lbA: [], lbB: [] };

    // Position Winner Bracket on the RIGHT (RTL)
    positioned.wb = calculateTreePositionsRTL(
      wbMatches,
      HEADER_HEIGHT,
      CARD_WIDTH,
      CARD_HEIGHT,
      HORIZONTAL_GAP,
      VERTICAL_GAP
    );

    // Calculate WB leftmost position to place LB on the LEFT
    const wbMinX = Math.min(...positioned.wb.map(m => m.x), 0);
    const lbStartX = wbMinX - 60; // Tight gap between WB and LB

    // Position Loser Bracket A on LEFT (top stack)
    const lbAPositioned = calculateTreePositionsRTL(
      lbAMatches,
      HEADER_HEIGHT,
      CARD_WIDTH,
      CARD_HEIGHT,
      HORIZONTAL_GAP,
      VERTICAL_GAP
    );
    // Shift LB-A to left of WB
    const lbAMaxX = Math.max(...lbAPositioned.map(m => m.x + CARD_WIDTH), 0);
    const lbAShift = lbStartX - lbAMaxX;
    positioned.lbA = lbAPositioned.map(m => ({ ...m, x: m.x + lbAShift }));

    // Position Loser Bracket B on LEFT (bottom stack, below LB-A)
    const lbAHeight = Math.max(...positioned.lbA.map(m => m.y + m.height), HEADER_HEIGHT);
    const lbBStartY = lbAHeight + SECTION_VERTICAL_SPACING + HEADER_HEIGHT;
    const lbBPositioned = calculateTreePositionsRTL(
      lbBMatches,
      lbBStartY,
      CARD_WIDTH,
      CARD_HEIGHT,
      HORIZONTAL_GAP,
      VERTICAL_GAP
    );
    // Shift LB-B to same X as LB-A
    positioned.lbB = lbBPositioned.map(m => ({ ...m, x: m.x + lbAShift }));

    // NORMALIZE: Shift all positions so minimum X = 0 (remove negative space)
    const allPositions = [...positioned.wb, ...positioned.lbA, ...positioned.lbB];
    const minX = Math.min(...allPositions.map(m => m.x), 0);
    if (minX < 0) {
      const normalizeShift = -minX;
      positioned.wb = positioned.wb.map(m => ({ ...m, x: m.x + normalizeShift }));
      positioned.lbA = positioned.lbA.map(m => ({ ...m, x: m.x + normalizeShift }));
      positioned.lbB = positioned.lbB.map(m => ({ ...m, x: m.x + normalizeShift }));
    }

    return positioned;
  };

  // Calculate positions for all groups
  const groupA = useMemo(() => calculateGroupPositions(groupAMatches), [groupAMatches]);
  const groupB = useMemo(() => calculateGroupPositionsRTL(groupBMatches), [groupBMatches]);
  const groupC = useMemo(() => calculateGroupPositions(groupCMatches), [groupCMatches]);
  const groupD = useMemo(() => calculateGroupPositionsRTL(groupDMatches), [groupDMatches]);

  // Calculate group dimensions
  const getGroupDimensions = (group: GroupPositions) => {
    const allPositioned = [...group.wb, ...group.lbA, ...group.lbB];
    const width = Math.max(...allPositioned.map(m => m.x + CARD_WIDTH), 800);
    const height = Math.max(...allPositioned.map(m => m.y + m.height), 600);
    return { width, height };
  };

  const groupADim = getGroupDimensions(groupA);
  const groupBDim = getGroupDimensions(groupB);
  const groupCDim = getGroupDimensions(groupC);
  const groupDDim = getGroupDimensions(groupD);

  // Calculate Cross Finals layout - SYMMETRIC BRACKET (Đối xứng 2 bên)
  // Left side: 4 matches → converge to center
  // Right side: 4 matches → converge to center
  // Final at center
  const { crossPositioned, crossDimensions } = useMemo(() => {
    if (crossMatches.length === 0) {
      return { crossPositioned: [], crossDimensions: { width: CARD_WIDTH + 50, height: 600 } };
    }

    const rounds = groupByRound(crossMatches);
    const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
    const positioned: PositionedMatch[] = [];

    console.log('🔍 Cross Finals Debug:', {
      totalMatches: crossMatches.length,
      rounds: Object.keys(rounds).map(r => ({ round: r, count: rounds[r].length })),
      roundNumbers,
      allMatches: crossMatches.map(m => ({
        id: m.id,
        round: m.round_number,
        bracket: m.bracket_type
      }))
    });

    if (roundNumbers.length === 0) {
      return { crossPositioned: [], crossDimensions: { width: CARD_WIDTH + 50, height: 600 } };
    }

    // Cross Finals - 4-CORNER LAYOUT: Professional radial convergence design
    // EXPERT ANALYSIS: Symmetric flow from 4 corners → quarters → semis → final
    const bracketWidth = 1100;
    const bracketHeight = 1000; // INCREASED for trophy spacing (was 800)
    
    // 4-corner symmetric positioning with mathematical precision
    if (roundNumbers.length >= 4) { // R1(8), R2(4), Semis(2), Final(1)
      const round1Matches = rounds[roundNumbers[0]] || []; // 8 matches
      const round2Matches = rounds[roundNumbers[1]] || []; // 4 matches (quarter-finals)
      const semiMatches = rounds[roundNumbers[2]] || [];   // 2 matches  
      const finalMatch = rounds[roundNumbers[3]] || [];    // 1 match
      
      console.log(`🏆 Cross Finals 4-CORNER: R1=${round1Matches.length}, R2=${round2Matches.length}, Semis=${semiMatches.length}, Final=${finalMatch.length}`);
      
      // LAYOUT CONSTANTS - Professional spacing with extra room for trophy
      const edgeMargin = 40;           // Distance from edges for LEFT side
      const edgeMarginRight = -80;     // Distance from edges for RIGHT side (NEGATIVE to shift right)
      const cornerVerticalGap = 40;    // Gap between 2 matches in corner (increased from 35)
      const horizontalStep = 200;      // Horizontal distance per round (R1→R2→Semis)
      
      // CENTER CALCULATIONS (adjusted for right-side shift)
      const visualCenterOffset = edgeMarginRight / 2; // Compensate for asymmetric margins
      const centerX = bracketWidth / 2 - CARD_WIDTH / 2 + visualCenterOffset;
      const centerY = HEADER_HEIGHT + bracketHeight / 2 + 60; // Extra offset for trophy
      
      // === ROUND 1: 4 CORNERS (2 matches each) - SYMMETRIC PLACEMENT ===
      
      const cornerStartY_Top = HEADER_HEIGHT + 100; // More top margin for trophy
      const cornerStartY_Bottom = HEADER_HEIGHT + bracketHeight - 100 - (CARD_HEIGHT * 2 + cornerVerticalGap);
      
      // TOP-LEFT corner (MT05, MT06) - KHÔNG ĐỔI
      round1Matches.slice(0, 2).forEach((match, idx) => {
        positioned.push({
          ...match,
          x: edgeMargin,
          y: cornerStartY_Top + idx * (CARD_HEIGHT + cornerVerticalGap),
          height: CARD_HEIGHT
        });
      });
      
      // ⚠️ SWAP: TOP-RIGHT (M107, M108) ↔ BOTTOM-LEFT (M111, M112)
      // TOP-RIGHT corner (MT07, MT08) - M109, M110 → ĐỔI xuống BOTTOM-LEFT
      round1Matches.slice(2, 4).forEach((match, idx) => {
        positioned.push({
          ...match,
          x: edgeMargin,  // Sang bên TRÁI
          y: cornerStartY_Bottom + idx * (CARD_HEIGHT + cornerVerticalGap),  // Xuống DƯỚI
          height: CARD_HEIGHT
        });
      });
      
      // BOTTOM-LEFT corner (MT09, MT10) - M111, M112 → ĐỔI lên TOP-RIGHT
      round1Matches.slice(4, 6).forEach((match, idx) => {
        positioned.push({
          ...match,
          x: bracketWidth - CARD_WIDTH - edgeMarginRight,  // Sang bên PHẢI
          y: cornerStartY_Top + idx * (CARD_HEIGHT + cornerVerticalGap),  // Lên TRÊN
          height: CARD_HEIGHT
        });
      });
      
      // BOTTOM-RIGHT corner (MT11, MT12) - KHÔNG ĐỔI
      round1Matches.slice(6, 8).forEach((match, idx) => {
        positioned.push({
          ...match,
          x: bracketWidth - CARD_WIDTH - edgeMarginRight,
          y: cornerStartY_Bottom + idx * (CARD_HEIGHT + cornerVerticalGap),
          height: CARD_HEIGHT
        });
      });
      
      // === ROUND 2: 4 QUARTERS - POSITIONED BETWEEN CORNERS AND SEMIS ===
      
      // Calculate CENTER Y of each corner pair for perfect alignment
      const topCornerCenterY = cornerStartY_Top + CARD_HEIGHT + cornerVerticalGap / 2;
      const bottomCornerCenterY = cornerStartY_Bottom + CARD_HEIGHT + cornerVerticalGap / 2;
      
      // X positions: One step closer to center from corners
      const quarterX_Left = edgeMargin + horizontalStep;
      const quarterX_Right = bracketWidth - CARD_WIDTH - edgeMarginRight - horizontalStep;
      
      // Top-Left Quarter (MT13) - Aligned with top-left corner pair
      if (round2Matches[0]) {
        positioned.push({
          ...round2Matches[0],
          x: quarterX_Left,
          y: topCornerCenterY - CARD_HEIGHT / 2,
          height: CARD_HEIGHT
        });
      }
      
      // ⚠️ SWAP: M114 ↔ M115 (đổi tọa độ)
      // Top-Right Quarter (MT14) - M114 → ĐỔI xuống BOTTOM-LEFT
      if (round2Matches[1]) {
        positioned.push({
          ...round2Matches[1],
          x: quarterX_Left,  // ĐỔI sang trái
          y: bottomCornerCenterY - CARD_HEIGHT / 2,  // ĐỔI xuống dưới
          height: CARD_HEIGHT
        });
      }
      
      // Bottom-Left Quarter (MT15) - M115 → ĐỔI lên TOP-RIGHT
      if (round2Matches[2]) {
        positioned.push({
          ...round2Matches[2],
          x: quarterX_Right,  // ĐỔI sang phải
          y: topCornerCenterY - CARD_HEIGHT / 2,  // ĐỔI lên trên
          height: CARD_HEIGHT
        });
      }
      
      // Bottom-Right Quarter (MT16) - Aligned with bottom-right corner pair
      if (round2Matches[3]) {
        positioned.push({
          ...round2Matches[3],
          x: quarterX_Right,
          y: bottomCornerCenterY - CARD_HEIGHT / 2,
          height: CARD_HEIGHT
        });
      }
      
      // === SEMIS: 2 matches - SAME COLUMN AS QUARTERS ===
      
      // Y position: Exactly between top and bottom quarters
      const semiY = (topCornerCenterY + bottomCornerCenterY) / 2 - CARD_HEIGHT / 2;
      
      // X positions: SAME AS QUARTERS (no horizontal step)
      const semiX_Left = quarterX_Left;
      const semiX_Right = quarterX_Right;
      
      // Left Semi (MT17)
      if (semiMatches[0]) {
        positioned.push({
          ...semiMatches[0],
          x: semiX_Left,
          y: semiY,
          height: CARD_HEIGHT
        });
      }
      
      // Right Semi (MT18)
      if (semiMatches[1]) {
        positioned.push({
          ...semiMatches[1],
          x: semiX_Right,
          y: semiY,
          height: CARD_HEIGHT
        });
      }
      
      // === FINAL: CENTER - Equidistant from both semis ===
      if (finalMatch[0]) {
        // Calculate center position between left and right semis
        const leftSemiCenter = semiX_Left + CARD_WIDTH / 2;
        const rightSemiCenter = semiX_Right + CARD_WIDTH / 2;
        const exactCenter = (leftSemiCenter + rightSemiCenter) / 2;
        const finalX = exactCenter - CARD_WIDTH / 2;
        
        positioned.push({
          ...finalMatch[0],
          x: finalX,
          y: semiY, // Same Y as semis for horizontal alignment
          height: CARD_HEIGHT
        });
      }
    } else {
      // Fallback for unexpected structure
      for (let roundIndex = 0; roundIndex < roundNumbers.length; roundIndex++) {
        const roundNum = roundNumbers[roundIndex];
        const roundMatches = rounds[roundNum];
        const xPosition = roundIndex * (CARD_WIDTH + 80) + 100;
        const startY = HEADER_HEIGHT + 100;
        
        for (let matchIndex = 0; matchIndex < roundMatches.length; matchIndex++) {
          const match = roundMatches[matchIndex];
          positioned.push({
            ...match,
            x: xPosition,
            y: startY + matchIndex * (CARD_HEIGHT + 20),
            height: CARD_HEIGHT
          });
        }
      }
    }

    // Calculate dimensions for symmetric bracket
    const width = bracketWidth + 100;  // Add padding
    const height = bracketHeight + HEADER_HEIGHT + 50; // Add header + padding

    console.log('✅ Cross Finals Layout Complete:', {
      totalPositioned: positioned.length,
      byRound: Object.entries(
        positioned.reduce((acc, m) => {
          acc[m.round_number] = (acc[m.round_number] || 0) + 1;
          return acc;
        }, {} as Record<number, number>)
      ).sort((a, b) => Number(a[0]) - Number(b[0])),
      dimensions: { width: Math.round(width), height: Math.round(height) }
    });

    return { 
      crossPositioned: positioned, 
      crossDimensions: { width, height } 
    };
  }, [crossMatches]);

  const crossFinalsWidth = crossDimensions.width;
  
  // LAYOUT CÂN BẰNG - Cross Finals ở TRUNG TÂM
  // Layout:    [Group A]        [Group B]
  //               [Cross Finals]
  //            [Group C]        [Group D]
  
  const leftGroupWidth = Math.max(groupADim.width, groupCDim.width);
  const rightGroupWidth = Math.max(groupBDim.width, groupDDim.width);
  
  // Tính toán để Cross Finals ở giữa hoàn toàn
  const totalContentWidth = leftGroupWidth + GROUP_HORIZONTAL_GAP + 
                             crossFinalsWidth + GROUP_HORIZONTAL_GAP + 
                             rightGroupWidth;
  
  // Group A & C ở bên trái
  const groupAOffset = { x: 0, y: 0 };
  const groupCOffset = { 
    x: 0, 
    y: groupADim.height + GROUP_VERTICAL_GAP 
  };
  
  // Cross Finals ở TRUNG TÂM (cân bằng giữa trái và phải)
  const leftGroupsHeight = Math.max(
    groupADim.height + GROUP_VERTICAL_GAP + groupCDim.height,
    groupBDim.height + GROUP_VERTICAL_GAP + groupDDim.height
  );
  const crossFinalsOffset = { 
    x: leftGroupWidth + GROUP_HORIZONTAL_GAP,
    y: Math.max(0, (leftGroupsHeight - crossDimensions.height) / 2)  // CENTERED vertically
  };
  
  // Group B & D ở bên phải (cân bằng với bên trái)
  const groupBOffset = { 
    x: leftGroupWidth + GROUP_HORIZONTAL_GAP + crossFinalsWidth + GROUP_HORIZONTAL_GAP, 
    y: 0 
  };
  const groupDOffset = { 
    x: leftGroupWidth + GROUP_HORIZONTAL_GAP + crossFinalsWidth + GROUP_HORIZONTAL_GAP, 
    y: groupBDim.height + GROUP_VERTICAL_GAP 
  };

  const totalWidth = leftGroupWidth + GROUP_HORIZONTAL_GAP + 
                     crossFinalsWidth + GROUP_HORIZONTAL_GAP + 
                     rightGroupWidth + 40;  // Minimal padding
  const totalHeight = leftGroupsHeight + 40;  // Minimal padding

  // Find the 4 winners from each group who advance to Cross Finals
  // DE16: 2 from WB (winner + runner-up) + 1 from LB-A + 1 from LB-B = 4 total
  const getGroupWinners = (matches: BracketMatch[], positions: GroupPositions) => {
    const wbMatches = matches.filter(m => m.bracket_type === 'WB');
    const lbAMatches = matches.filter(m => m.bracket_type === 'LB-A');
    const lbBMatches = matches.filter(m => m.bracket_type === 'LB-B');
    
    // 1. Top 2 from WB Round 3 (final WB match - both winner and loser advance)
    const wbFinals = wbMatches
      .filter(m => m.round_number === 3)
      .map(m => positions.wb.find(p => p.id === m.id))
      .filter((p): p is PositionedMatch => p !== undefined);
    
    // 2. Winner from LB-A last round
    const lbAMaxRound = Math.max(...lbAMatches.map(m => m.round_number), 0);
    const lbAWinners = lbAMatches
      .filter(m => m.round_number === lbAMaxRound)
      .map(m => positions.lbA.find(p => p.id === m.id))
      .filter((p): p is PositionedMatch => p !== undefined);
    
    // 3. Winner from LB-B last round
    const lbBMaxRound = Math.max(...lbBMatches.map(m => m.round_number), 0);
    const lbBWinners = lbBMatches
      .filter(m => m.round_number === lbBMaxRound)
      .map(m => positions.lbB.find(p => p.id === m.id))
      .filter((p): p is PositionedMatch => p !== undefined);
    
    // Return 4 winners: WB finals (1 match with 2 players) + LB-A winner + LB-B winner
    return [...wbFinals, ...lbAWinners, ...lbBWinners];
  };

  const groupAWinners = getGroupWinners(groupAMatches, groupA);
  const groupBWinners = getGroupWinners(groupBMatches, groupB);
  const groupCWinners = getGroupWinners(groupCMatches, groupC);
  const groupDWinners = getGroupWinners(groupDMatches, groupD);

  // Helper: Get match color based on which group it belongs to
  const getMatchGroupColor = (matchId: string): string | null => {
    if (groupAWinners.some(w => w.id === matchId)) return '#3b82f6'; // Blue for Group A
    if (groupBWinners.some(w => w.id === matchId)) return '#ef4444'; // Red for Group B
    if (groupCWinners.some(w => w.id === matchId)) return '#22c55e'; // Green for Group C
    if (groupDWinners.some(w => w.id === matchId)) return '#f59e0b'; // Amber for Group D
    return null;
  };

  // Helper: Get Cross Finals Round 1 match color (based on position 0-11 for 12 matches)
  const getCrossFinalsR1Color = (match: PositionedMatch): string | null => {
    if (match.round_number !== 1) return null;
    
    const r1Matches = crossPositioned.filter(m => m.round_number === 1);
    
    // Split into left side (6 matches) and right side (6 matches)
    // SYMMETRICAL: Top matches from A & B, Bottom matches from C & D
    const leftSide = r1Matches.filter(m => m.x < 100).sort((a, b) => a.y - b.y);
    const rightSide = r1Matches.filter(m => m.x >= 100).sort((a, b) => a.y - b.y);
    
    // Symmetric mapping for visual balance:
    // Left top (0-2): Group A - Blue
    // Right top (3-5): Group B - Red (SYMMETRIC with A)
    // Left bottom (6-8): Group C - Green  
    // Right bottom (9-11): Group D - Amber (SYMMETRIC with C)
    const sorted = [...leftSide.slice(0, 3), ...rightSide.slice(0, 3), ...leftSide.slice(3, 6), ...rightSide.slice(3, 6)];
    const index = sorted.findIndex(m => m.id === match.id);
    
    if (index >= 0 && index <= 2) return '#3b82f6';   // Group A - Blue (Left top)
    if (index >= 3 && index <= 5) return '#ef4444';   // Group B - Red (Right top)
    if (index >= 6 && index <= 8) return '#22c55e';   // Group C - Green (Left bottom)
    if (index >= 9 && index <= 11) return '#f59e0b';  // Group D - Amber (Right bottom)
    return null;
  };

  // Helper: Get Cross Finals match color based on bracket origin of players
  const getCrossFinalsMatchColor = (match: PositionedMatch): string | null => {
    // For Cross Finals, determine color based on bracket origin of players
    // Find source matches where winners advance to this Cross Finals match
    const sourceMatches = allMatches.filter(sourceMatch => {
      return sourceMatch.winner_id === match.player1_id || 
             sourceMatch.winner_id === match.player2_id;
    });
    
    // Determine bracket colors from source matches
    const bracketColors = new Set<string>();
    
    sourceMatches.forEach(sourceMatch => {
      if (sourceMatch.bracket_type === 'WB') {
        bracketColors.add('#fbbf24'); // Gold for WB in Cross Finals
      } else if (sourceMatch.bracket_type === 'LB-A') {
        bracketColors.add('#f97316'); // Orange for LB-A
      } else if (sourceMatch.bracket_type === 'LB-B') {
        bracketColors.add('#ef4444'); // Red for LB-B
      }
    });
    
    // Priority: WB > LB-A > LB-B (if multiple bracket types)
    if (bracketColors.has('#fbbf24')) return '#fbbf24'; // WB priority (Gold in Cross Finals)
    if (bracketColors.has('#f97316')) return '#f97316'; // LB-A second
    if (bracketColors.has('#ef4444')) return '#ef4444'; // LB-B third
    
    // Fallback: Default Cross Finals color
    return '#a78bfa'; // Purple for Cross Finals default
  };

  // Helper: Check if match is Cross Finals qualifying match (should hide outer border)
  const shouldHideBorderForCrossFinalsMatch = (match: PositionedMatch): boolean => {
    return (
      // WB Round 3 matches - winners qualify for Cross Finals
      (match.bracket_type === 'WB' && match.round_number === 3) ||
      // LB-A Final - winner qualifies for Cross Finals  
      (match.bracket_type === 'LB-A' && match.round_number === 103) ||
      // LB-B Final - winner qualifies for Cross Finals
      (match.bracket_type === 'LB-B' && match.round_number === 203)
    );
  };

  // Render a single group with color highlights for winners
  const renderGroup = (
    groupName: string,
    positions: GroupPositions,
    offset: { x: number; y: number },
    matches: BracketMatch[],
    isRTL: boolean = false // RTL layout for Groups B & D
  ) => {
    const wbMatches = matches.filter(m => m.bracket_type === 'WB');
    const lbAMatches = matches.filter(m => m.bracket_type === 'LB-A');
    const lbBMatches = matches.filter(m => m.bracket_type === 'LB-B');

    // Simple translate (no flip)
    const transform = `translate(${offset.x}, ${offset.y})`;

    // Helper to render match with bracket-specific winner colors
    const renderMatch = (match: PositionedMatch) => {
      const highlightColor = getMatchGroupColor(match.id);
      
      // Determine bracket-specific winner colors
      let matchHighlightColor: string | null = null;
      if (match.bracket_type === 'WB') {
        matchHighlightColor = '#22c55e'; // Green for WB winners
      } else if (match.bracket_type === 'LB-A') {
        matchHighlightColor = '#f97316'; // Orange for LB-A winners  
      } else if (match.bracket_type === 'LB-B') {
        matchHighlightColor = '#ef4444'; // Red for LB-B winners
      }
      
      return (
        <g key={match.id}>
          {/* Highlight border if this is a winner AND NOT a Cross Finals qualifying match */}
          {highlightColor && !shouldHideBorderForCrossFinalsMatch(match) && (
            <rect
              x={match.x - 3}
              y={match.y - 3}
              width={CARD_WIDTH + 6}
              height={CARD_HEIGHT + 6}
              fill="none"
              stroke={highlightColor}
              strokeWidth={3}
              rx={8}
              opacity={0.8}
            />
          )}
          <foreignObject
            x={match.x}
            y={match.y}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
          >
            <MatchCard 
              match={match} 
              allMatches={allMatches} 
              highlightColor={matchHighlightColor || '#22c55e'}
            />
          </foreignObject>
        </g>
      );
    };
    
    // Calculate Group label X position - symmetric relative to Cross Finals center
    // For LTR groups (A, C): Place label on the right side (near Cross Finals)
    // For RTL groups (B, D): Place label on the left side (default x=10)
    const groupLabelX = isRTL ? 10 : Math.max(...positions.wb.map(m => m.x + CARD_WIDTH), 0) + 
                                      (positions.lbA.length > 0 ? Math.min(...positions.lbA.map(m => m.x)) : 0) - 60;
    
    return (
      <g transform={transform}>
        {/* Group label - Symmetric positioning */}
        <text 
          x={groupLabelX} 
          y="20" 
          fontSize="20" 
          fontWeight="bold" 
          fill="#60a5fa"
        >
          Group {groupName}
        </text>

        {/* Winner Bracket */}
        <g>
          {/* Connections first (behind cards) */}
          {renderConnections(positions.wb, '#22c55e', 2, CARD_WIDTH, isRTL)}
          
          <text 
            x={positions.wb[0]?.x || 10} 
            y={(positions.wb[0]?.y || HEADER_HEIGHT) - 12} 
            fontSize="11" 
            fontWeight="bold" 
            fill="#22c55e"
          >
            🏆 WB
          </text>
          {positions.wb.map(renderMatch)}
        </g>

        {/* Loser Bracket A */}
        {lbAMatches.length > 0 && positions.lbA.length > 0 && (
          <g>
            {/* Connections first (behind cards) */}
            {renderConnections(positions.lbA, '#f97316', 2, CARD_WIDTH, isRTL)}
            
            <text 
              x={positions.lbA[0]?.x || 10} 
              y={(positions.lbA[0]?.y || 0) - 12} 
              fontSize="11" 
              fontWeight="bold" 
              fill="#f97316"
            >
              🎯 LB-A
            </text>
            {positions.lbA.map(renderMatch)}
          </g>
        )}

        {/* Loser Bracket B */}
        {lbBMatches.length > 0 && positions.lbB.length > 0 && (
          <g>
            {/* Connections first (behind cards) */}
            {renderConnections(positions.lbB, '#ef4444', 2, CARD_WIDTH, isRTL)}
            
            <text 
              x={positions.lbB[0]?.x || 10} 
              y={(positions.lbB[0]?.y || 0) - 12} 
              fontSize="11" 
              fontWeight="bold" 
              fill="#ef4444"
            >
              ⚠️ LB-B
            </text>
            {positions.lbB.map(renderMatch)}
          </g>
        )}
      </g>
    );
  };

  // Auto-fit: Calculate optimal scale to fit viewport
  const calculateFitScale = useCallback(() => {
    if (!containerRef.current) return 1;
    const container = containerRef.current;
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;
    
    // Calculate scale to fit both width and height with some padding
    const scaleX = (viewportWidth - 40) / totalWidth;
    const scaleY = (viewportHeight - 40) / totalHeight;
    
    // Use the smaller scale to ensure everything fits
    return Math.min(scaleX, scaleY, 1); // Max 1x to avoid upscaling
  }, [totalWidth, totalHeight]);

  // Zoom controls
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, MAX_SCALE));
    setIsManualZoom(true);
  };
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, MIN_SCALE));
    setIsManualZoom(true);
  };
  const handleResetZoom = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    setIsManualZoom(true);
  };
  const handleFitToScreen = () => {
    setScale(calculateFitScale());
    setTranslateX(0);
    setTranslateY(0);
    setIsManualZoom(false); // This is intentional fit, allow auto-fit again
  };
  
  // Handle zoom input change
  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value);
    if (Number.isNaN(value)) return;
    
    const newScale = Math.max(MIN_SCALE * 100, Math.min(MAX_SCALE * 100, value)) / 100;
    setScale(newScale);
    setIsManualZoom(true);
  };
  
  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  // Auto-fit on mount and window resize
  useEffect(() => {
    // Only auto-fit if user hasn't manually zoomed
    if (isManualZoom) return;
    
    const fitScale = calculateFitScale();
    if (fitScale < 1) {
      setScale(fitScale);
      setTranslateX(0);
      setTranslateY(0);
    }
    
    const handleResize = () => {
      // Only auto-fit on resize if user hasn't manually zoomed
      if (isManualZoom) return;
      
      const newFitScale = calculateFitScale();
      if (scale < 1 && newFitScale !== scale) {
        setScale(newFitScale);
        setTranslateX(0);
        setTranslateY(0);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateFitScale, scale, isManualZoom]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-slate-950 overflow-auto"
      onWheel={handleWheel}
    >
      {/* 📱 Mobile Helper Hint - Hidden in fullscreen */}
      {isMobile && !isFullscreen && (
        <div className="absolute top-4 left-4 z-10 bg-blue-900/90 text-white px-3 py-2 rounded-lg text-xs max-w-[200px] backdrop-blur-sm border border-blue-700">
          <p className="font-semibold mb-1">💡 Mẹo:</p>
          <p>• Kéo 1 ngón: Di chuyển</p>
          <p>• Chụm 2 ngón: Zoom</p>
        </div>
      )}
      
      {/* Zoom Controls - Always visible */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleZoomOut}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-colors"
          title="Zoom Out (Ctrl/Cmd -)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleFitToScreen}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-colors"
          title="Fit to Screen"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
        <div className="relative flex items-center">
          <input
            type="number"
            value={Math.round(scale * 100)}
            onChange={handleZoomInputChange}
            onKeyDown={handleZoomInputKeyDown}
            onDoubleClick={handleResetZoom}
            min={MIN_SCALE * 100}
            max={MAX_SCALE * 100}
            className="w-20 px-2 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-colors font-mono text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Zoom % (Click to edit, Double-click to reset)"
          />
          <span className="absolute right-2 text-slate-400 text-xs pointer-events-none">%</span>
        </div>
        <button
          onClick={handleZoomIn}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-colors"
          title="Zoom In (Ctrl/Cmd +)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      <svg
        ref={svgRef}
        width={totalWidth}
        height={totalHeight}
        className="bg-slate-900/50"
        style={{
          cursor: isPanning ? 'grabbing' : 'grab',
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          transformOrigin: '0 0',
          touchAction: 'none' // Prevent default touch behaviors
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <g>
        {/* Render all 4 groups */}
        {renderGroup('A', groupA, groupAOffset, groupAMatches, false)}
        {renderGroup('B', groupB, groupBOffset, groupBMatches, true)}
        {renderGroup('C', groupC, groupCOffset, groupCMatches, false)}
        {renderGroup('D', groupD, groupDOffset, groupDMatches, true)}

        {/* Cross Finals - CLEAN LAYOUT */}
        <g transform={`translate(${crossFinalsOffset.x}, ${crossFinalsOffset.y})`}>
          {/* TÊN GIẢI ĐẤU - Trung tâm phía trên */}
          <g transform={`translate(${crossFinalsWidth / 2}, -80)`}>
            {/* Background glow */}
            <rect
              x="-250"
              y="-35"
              width="500"
              height="60"
              fill="rgba(251, 191, 36, 0.1)"
              rx="12"
              filter="drop-shadow(0 0 20px rgba(251, 191, 36, 0.3))"
            />
            {/* Tên giải đấu */}
            <text
              x="0"
              y="0"
              fontSize="32"
              fontWeight="900"
              fill="#fbbf24"
              textAnchor="middle"
              letterSpacing="6"
              style={{ 
                filter: 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 24px rgba(255, 215, 0, 0.4))',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              {tournamentName}
            </text>
            {/* Subtitle - Cross Finals */}
            <text
              x="0"
              y="25"
              fontSize="14"
              fontWeight="600"
              fill="#fbbf24"
              textAnchor="middle"
              letterSpacing="3"
              opacity="0.8"
            >
              🏆 VÒNG CHUNG KẾT
            </text>
          </g>
          
          <text x="10" y="20" fontSize="20" fontWeight="bold" fill="#fbbf24">
            🏆 Cross Finals ({crossMatches.length})
          </text>
          
          {/* Cross Finals connections (between rounds) - DE16 structure */}
          {renderCrossFinalsConnections(crossPositioned, CARD_WIDTH)}
          
          {/* Cross Finals matches with PREMIUM FINAL CARD */}
          {crossPositioned.map(match => {
            const bracketColor = getCrossFinalsMatchColor(match);
            
            // Calculate max round number in Cross Finals to identify Semis and Final
            const maxRound = Math.max(...crossPositioned.map(m => m.round_number || 0));
            const isSemiFinal = match.round_number === maxRound - 1; // 2nd to last round (Semis)
            const isFinal = match.round_number === maxRound; // Last round (Final)
            
            // SCALE for visual hierarchy - content size unchanged
            const scale = isFinal ? 1.35 : isSemiFinal ? 1.10 : 1.08;
            const borderWidth = isFinal ? '4px' : isSemiFinal ? '3px' : '2px'; // Giảm độ dày viền
            
            // ULTRA PREMIUM GLOW for Final
            const glowIntensity = isFinal 
              ? '0 0 40px rgba(255, 215, 0, 1), 0 0 30px rgba(251, 191, 36, 0.9), 0 0 20px rgba(255, 255, 255, 0.8), 0 0 10px rgba(255, 215, 0, 0.6)' 
              : isSemiFinal 
                ? '0 0 18px rgba(251, 191, 36, 0.7), 0 0 8px rgba(212, 175, 55, 0.5)' 
                : '0 0 12px rgba(251, 191, 36, 0.6)';
            
            // PREMIUM BORDER STYLE - BỎ HẾT viền khung, chỉ giữ glow
            const borderStyle = isFinal ? {
              boxShadow: glowIntensity,
              borderRadius: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative' as const,
              overflow: 'visible',
              // Premium background for Final card
              background: 'linear-gradient(135deg, rgba(30, 20, 10, 0.95) 0%, rgba(40, 30, 15, 0.98) 50%, rgba(30, 20, 10, 0.95) 100%)',
            } : {
              // BỎ HẾT border cho Cross Finals cards
              boxShadow: glowIntensity,
              borderRadius: '8px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            };
            
            // Tăng kích thước cho TẤT CẢ Cross Finals cards
            const crossFinalsWidth = isFinal ? 280 : isSemiFinal ? 160 : 150;
            const crossFinalsHeight = isFinal ? 180 : isSemiFinal ? 105 : 100;
            const offsetX = (crossFinalsWidth - CARD_WIDTH) / 2;
            const offsetY = (crossFinalsHeight - CARD_HEIGHT) / 2;
            
            // Trophy size
            const trophySize = 80;
            const trophyYOffset = -170;
            const trophyFontSize = 16;
            
            return (
              <g key={match.id}>
                {/* Beautiful Trophy Cup for Final */}
                {isFinal && (
                  <g transform={`translate(${match.x - offsetX + crossFinalsWidth / 2}, ${match.y - offsetY + trophyYOffset})`}>
                    {/* Championship label */}
                    <text 
                      x="0" 
                      y="0" 
                      fontSize={trophyFontSize} 
                      fontWeight="900"
                      fill="#ffd700"
                      textAnchor="middle"
                      letterSpacing="4"
                      style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 1))' }}
                    >
                      CHUNG KẾT
                    </text>
                    
                    {/* Massive Glow behind cup */}
                    <circle
                      cx="0"
                      cy="65"
                      r={trophySize * 0.625}
                      fill="rgba(255, 215, 0, 0.3)"
                      filter="blur(20px)"
                    />
                    
                    {/* Trophy Cup Emoji - RESPONSIVE */}
                    <text
                      x="0"
                      y="95"
                      fontSize={trophySize}
                      textAnchor="middle"
                      style={{ 
                        filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 1)) drop-shadow(0 0 40px rgba(255, 215, 0, 0.6))',
                      }}
                    >
                      🏆
                    </text>
                  </g>
                )}
                
                {isSemiFinal && (
                  <text 
                    x={match.x + CARD_WIDTH / 2} 
                    y={match.y - 15} 
                    fontSize="20" 
                    textAnchor="middle"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.8))' }}
                  >
                    🥈
                  </text>
                )}
                
                {/* Container size via dimensions only - NO scale transform */}
                <foreignObject
                  x={match.x - offsetX}
                  y={match.y - offsetY}
                  width={crossFinalsWidth}
                  height={crossFinalsHeight}
                >
                  <div style={borderStyle}>
                    <MatchCard 
                      match={match} 
                      allMatches={allMatches} 
                      highlightColor={bracketColor}
                      isFinalMatch={isFinal}
                    />
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
        
        {/* BỎ ARROWS - dùng màu sắc thay thế */}
        </g>
      </svg>
    </div>
  );
};
