import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTournamentBracket } from "@/hooks/useTournamentBracket";
import { MatchCard } from "./MatchCard";
import { FullBracketView } from "./FullBracketView";
import { FullTournamentView } from "./FullTournamentView";
import { SimpleTournamentView } from "./SimpleTournamentView";
import type { BracketMatch } from "@/types/bracket";
import { AlertCircle, Award, Maximize2, ZoomIn, ZoomOut, Move, Grid3x3, Layers, X } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";

interface DE64BracketVisualizationProps {
  tournamentId: string;
}

/**
 * Display full DE64 (Double Elimination 64) bracket
 * Structure: 4 Groups (A, B, C, D) + Cross Finals
 * Each group has: Winner Bracket, Loser A, Loser B
 */
export const DE64BracketVisualization = ({ tournamentId }: DE64BracketVisualizationProps) => {
  const { data: bracketData, isLoading, error, refetch } = useTournamentBracket(tournamentId);
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  // Refresh bracket data callback
  const handleRefreshBracket = useCallback(() => {
    refetch();
    // Also invalidate the query to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['tournament-bracket', tournamentId] });
  }, [refetch, queryClient, tournamentId]);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Debug: Log fullscreen API support on mobile
      if (mobile) {
        console.log('📱 Mobile detected. Fullscreen API support:', {
          standard: !!document.documentElement.requestFullscreen,
          webkit: !!(document.documentElement as any).webkitRequestFullscreen,
          moz: !!(document.documentElement as any).mozRequestFullScreen,
          ms: !!(document.documentElement as any).msRequestFullscreen,
          orientationAPI: !!screen.orientation,
          orientationLock: !!screen.orientation?.lock
        });
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle fullscreen toggle - CSS-based for better mobile support
  const toggleFullscreen = useCallback(async () => {
    setIsFullscreen(!isFullscreen);
    
    // Try to lock orientation on mobile when entering fullscreen
    if (!isFullscreen && isMobile) {
      try {
        if (screen.orientation?.lock) {
          await screen.orientation.lock('landscape');
          console.log('✅ Locked to landscape');
        }
      } catch (err) {
        console.log('⚠️ Could not lock orientation:', err);
      }
    } else if (isFullscreen && screen.orientation?.unlock) {
      // Unlock when exiting
      screen.orientation.unlock();
    }
  }, [isFullscreen, isMobile]);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          resetZoom();
        }
      }
      // F key for fullscreen
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [zoom]); // Re-bind when zoom changes

  // Zoom controls
  const zoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const zoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const resetZoom = () => {
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 100) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Đang tải bảng đấu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load bracket data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!bracketData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No bracket data available for this tournament yet.
        </AlertDescription>
      </Alert>
    );
  }

  // Get all matches from bracket data
  const getAllMatches = () => {
    if (!bracketData.winner_bracket && !bracketData.loser_bracket) return [];
    
    return [
      ...bracketData.winner_bracket.flatMap(r => r.matches),
      ...bracketData.loser_bracket.flatMap(r => r.matches),
      ...bracketData.grand_finals
    ];
  };

  const allBracketMatches = getAllMatches();
  
  // Check if this is a grouped tournament (DE64) or simple tournament (DE16)
  const hasGroups = allBracketMatches.some(m => 
    m.bracket_group && ['A', 'B', 'C', 'D'].includes(m.bracket_group)
  );

  // Group matches by bracket_group (A, B, C, D, Cross) - for DE64
  const getMatchesByGroup = (group: string) => {
    const filtered = allBracketMatches.filter(m => {
      const bracketGroup = m.bracket_group;
      
      // Handle Cross Finals - match both 'CROSS' and matches not in A,B,C,D
      if (group === 'Cross') {
        return bracketGroup?.toUpperCase() === 'CROSS' ||
               bracketGroup?.toLowerCase() === 'cross' ||
               (bracketGroup !== 'A' && bracketGroup !== 'B' && 
                bracketGroup !== 'C' && bracketGroup !== 'D');
      }
      
      return bracketGroup === group;
    });
    
    return filtered;
  };

  // Group matches by bracket_type (WB, LB-A, LB-B, SABO) - for DE16/simple formats
  const getMatchesByType = (type: string) => {
    return allBracketMatches.filter(m => m.bracket_type === type);
  };

  // For DE64 with groups
  const groupAMatches = getMatchesByGroup('A');
  const groupBMatches = getMatchesByGroup('B');
  const groupCMatches = getMatchesByGroup('C');
  const groupDMatches = getMatchesByGroup('D');
  const crossMatches = getMatchesByGroup('Cross');

  // For DE16/simple formats
  const wbMatches = getMatchesByType('WB');
  const lbaMatches = getMatchesByType('LB-A');
  const lbbMatches = getMatchesByType('LB-B');
  const saboMatches = getMatchesByType('SABO');

  // Collect all matches for advancement calculation
  const allMatches = hasGroups 
    ? [...groupAMatches, ...groupBMatches, ...groupCMatches, ...groupDMatches, ...crossMatches]
    : allBracketMatches;

  return (
    <div 
      ref={containerRef}
      className="h-full w-full flex flex-col bg-slate-950 relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        cursor: isPanning ? 'grabbing' : zoom > 100 ? 'grab' : 'default'
      }}
    >
      {/* Fullscreen Controls Toolbar - Hide zoom controls in fullscreen mobile */}
      <div className="absolute top-16 right-4 z-50 flex gap-2">
        {/* Zoom Controls - Hide in mobile fullscreen */}
        {!(isFullscreen && isMobile) && (
          <div className="flex gap-1 bg-slate-800/90 backdrop-blur-sm rounded-lg p-1 border border-slate-700">
            <button
              onClick={zoomOut}
            disabled={zoom <= 50}
            className="p-2 hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 text-white" />
          </button>
          <div className="px-3 py-2 text-white text-sm font-mono min-w-[60px] text-center">
            {zoom}%
          </div>
          <button
            onClick={zoomIn}
            disabled={zoom >= 300}
            className="p-2 hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={resetZoom}
            className="p-2 hover:bg-slate-700 rounded transition-colors border-l border-slate-600 ml-1"
            title="Reset Zoom & Pan"
          >
            <Move className="w-5 h-5 text-white" />
          </button>
        </div>
        )}

        {/* Fullscreen Toggle - Hide when fullscreen (portal has X button) */}
        {!isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg"
            title={isMobile ? 'Fullscreen + Landscape Mode' : 'Enter Fullscreen (F)'}
          >
            <Maximize2 className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Main Content with Zoom & Pan */}
      <div 
        className="flex-1 flex flex-col transition-transform duration-200"
        style={{
          transform: `scale(${zoom / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'top left'
        }}
      >
        <Tabs defaultValue="fullTournament" className="flex-1 flex flex-col">
          {/* Hide TabsList in mobile fullscreen */}
          {!(isFullscreen && isMobile) && (
            hasGroups ? (
              <TabsList className="grid w-full grid-cols-6 bg-slate-800 border-b border-slate-700">
                <TabsTrigger value="fullTournament" className="text-amber-400">
                  <Layers className="w-4 h-4 mr-1" />
                  Full Tournament
                </TabsTrigger>
                <TabsTrigger value="groupA">
                  Group A ({groupAMatches.length})
                </TabsTrigger>
                <TabsTrigger value="groupB">
                  Group B ({groupBMatches.length})
                </TabsTrigger>
                <TabsTrigger value="groupC">
                  Group C ({groupCMatches.length})
                </TabsTrigger>
                <TabsTrigger value="groupD">
                  Group D ({groupDMatches.length})
                </TabsTrigger>
                <TabsTrigger value="cross" className="text-purple-400">
                  <Award className="w-4 h-4 mr-1" />
                  Cross Finals ({crossMatches.length})
                </TabsTrigger>
              </TabsList>
            ) : (
              <TabsList className="grid w-full grid-cols-5 bg-slate-800 border-b border-slate-700">
                <TabsTrigger value="fullTournament" className="text-amber-400">
                  <Layers className="w-4 h-4 mr-1" />
                  Toàn Bộ
                </TabsTrigger>
                <TabsTrigger value="wb" className="text-green-400">
                  WB ({wbMatches.length})
                </TabsTrigger>
                <TabsTrigger value="lba" className="text-orange-400">
                  LB-A ({lbaMatches.length})
                </TabsTrigger>
                <TabsTrigger value="lbb" className="text-red-400">
                  LB-B ({lbbMatches.length})
                </TabsTrigger>
                <TabsTrigger value="sabo" className="text-purple-400">
                  <Award className="w-4 h-4 mr-1" />
                  Finals ({saboMatches.length})
                </TabsTrigger>
              </TabsList>
            )
          )}

        <TabsContent value="fullTournament" className="flex-1 overflow-auto">
          {hasGroups ? (
            <FullTournamentView 
              allMatches={allMatches}
              groupAMatches={groupAMatches}
              groupBMatches={groupBMatches}
              groupCMatches={groupCMatches}
              groupDMatches={groupDMatches}
              crossMatches={crossMatches}
              isFullscreen={isFullscreen}
            />
          ) : (
            <SimpleTournamentView 
              wbMatches={wbMatches}
              lbaMatches={lbaMatches}
              lbbMatches={lbbMatches}
              saboMatches={saboMatches}
              allMatches={allMatches}
            />
          )}
        </TabsContent>

        {/* Group tabs for DE64 */}
        {hasGroups && (
          <>
            <TabsContent value="groupA" className="flex-1 overflow-auto">
              <GroupView matches={groupAMatches} groupName="A" allMatches={allMatches} crossFinalMatches={crossMatches} />
            </TabsContent>
            
            <TabsContent value="groupB" className="flex-1 overflow-auto">
              <GroupView matches={groupBMatches} groupName="B" allMatches={allMatches} crossFinalMatches={crossMatches} />
            </TabsContent>
            
            <TabsContent value="groupC" className="flex-1 overflow-auto">
              <GroupView matches={groupCMatches} groupName="C" allMatches={allMatches} crossFinalMatches={crossMatches} />
            </TabsContent>
            
            <TabsContent value="groupD" className="flex-1 overflow-auto">
              <GroupView matches={groupDMatches} groupName="D" allMatches={allMatches} crossFinalMatches={crossMatches} />
            </TabsContent>
            
            <TabsContent value="cross" className="flex-1 overflow-auto">
              <CrossFinalsView matches={crossMatches} allMatches={allMatches} />
            </TabsContent>
          </>
        )}

        {/* Bracket type tabs for DE16/DE32 */}
        {!hasGroups && (
          <>
            <TabsContent value="wb" className="flex-1 overflow-auto">
              <BracketTypeView matches={wbMatches} typeName="Winner Bracket" color="green" />
            </TabsContent>
            
            <TabsContent value="lba" className="flex-1 overflow-auto">
              <BracketTypeView matches={lbaMatches} typeName="Loser Bracket A" color="orange" />
            </TabsContent>
            
            <TabsContent value="lbb" className="flex-1 overflow-auto">
              <BracketTypeView matches={lbbMatches} typeName="Loser Bracket B" color="red" />
            </TabsContent>
            
            <TabsContent value="sabo" className="flex-1 overflow-auto">
              <BracketTypeView matches={saboMatches} typeName="SABO Finals" color="purple" />
            </TabsContent>
          </>
        )}
      </Tabs>

        {/* Statistics Footer - Hide in fullscreen */}
        {!isFullscreen && (
          <Card className="p-3 bg-slate-800/50 border-slate-700 rounded-none border-x-0 border-b-0">
            <div className="flex items-center justify-between text-sm">
              <div className="text-slate-400">
                {hasGroups ? (
                  <>Groups: <span className="text-white font-bold">4</span></>
                ) : (
                  <>Format: <span className="text-white font-bold">SABO DE16</span></>
                )}
              </div>
              <div className="text-slate-400">
                Total Matches: <span className="text-white font-bold">{bracketData.total_matches}</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Keyboard Shortcuts Help - HIDDEN */}
      {false && isFullscreen && (
        <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-sm p-3 rounded-lg border border-slate-700 text-xs text-slate-300 space-y-1">
          <div className="font-bold mb-2 text-sm">⌨️ Keyboard Shortcuts</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="text-slate-400">ESC</div>
            <div>Exit fullscreen</div>
            
            <div className="text-slate-400">F</div>
            <div>Toggle fullscreen</div>
            
            <div className="text-slate-400">Ctrl/Cmd +</div>
            <div>Zoom in</div>
            
            <div className="text-slate-400">Ctrl/Cmd -</div>
            <div>Zoom out</div>
            
            <div className="text-slate-400">Ctrl/Cmd 0</div>
            <div>Reset zoom</div>
            
            <div className="text-slate-400 col-span-2 mt-2 border-t border-slate-600 pt-2">
              💡 Drag to pan when zoomed
            </div>
          </div>
        </div>
      )}

      {/* 🎬 FULLSCREEN PORTAL OVERLAY - Like YouTube */}
      {isFullscreen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col animate-in fade-in duration-200">
          {/* Exit Button - Top Right */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-50 p-3 bg-slate-800/90 hover:bg-slate-700 rounded-lg transition-colors shadow-lg"
            title="Exit Fullscreen (ESC)"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Full Tournament View - Takes full screen */}
          <div className="w-full h-full">
            {hasGroups ? (
              <FullTournamentView 
                allMatches={allMatches}
                groupAMatches={groupAMatches}
                groupBMatches={groupBMatches}
                groupCMatches={groupCMatches}
                groupDMatches={groupDMatches}
                crossMatches={crossMatches}
                isFullscreen={true}
              />
            ) : (
              <SimpleTournamentView 
                wbMatches={wbMatches}
                lbaMatches={lbaMatches}
                lbbMatches={lbbMatches}
                saboMatches={saboMatches}
                allMatches={allMatches}
              />
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

/**
 * Group View - Show WB, LB-A, LB-B for a specific group
 */
interface GroupViewProps {
  matches: BracketMatch[];
  groupName: string;
  allMatches: BracketMatch[]; // For advancement calculation
  crossFinalMatches: BracketMatch[]; // For showing progression arrows
}

const GroupView = ({ matches, groupName, allMatches, crossFinalMatches }: GroupViewProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Separate by bracket_type - matching mobile app's exact logic
  const wbMatches = matches.filter(m => {
    const type = m.bracket_type as string;
    return type === 'WB';
  });
  
  const lbAMatches = matches.filter(m => {
    const type = m.bracket_type as string;
    return type === 'LB-A';
  });
  
  const lbBMatches = matches.filter(m => {
    const type = m.bracket_type as string;
    return type === 'LB-B';
  });

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.5, zoom + delta), 2);
    setZoom(newZoom);
  };

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 bg-slate-800/90 p-2 rounded-lg border border-slate-700">
        <button
          onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="text-xs text-center text-slate-400 py-1">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={resetView}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <Tabs defaultValue="full" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="full" className="flex items-center gap-1">
            <Grid3x3 className="w-3.5 h-3.5" />
            Full View
          </TabsTrigger>
          <TabsTrigger value="wb">Winner ({wbMatches.length})</TabsTrigger>
          <TabsTrigger value="lba">LB-A ({lbAMatches.length})</TabsTrigger>
          <TabsTrigger value="lbb">LB-B ({lbBMatches.length})</TabsTrigger>
        </TabsList>

        <TabsContent 
          value="full" 
          className="flex-1 overflow-hidden min-h-0 relative"
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
            className="w-full h-full"
          >
            <FullBracketView 
              matches={matches} 
              groupName={groupName} 
              allMatches={allMatches}
              crossFinalMatches={crossFinalMatches}
            />
          </div>
        </TabsContent>

        <TabsContent 
          value="wb" 
          className="flex-1 overflow-hidden min-h-0 relative"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
            className="w-full h-full overflow-auto"
          >
            <FullBracketView 
              matches={wbMatches} 
              groupName={`${groupName} - Winner Bracket`} 
              allMatches={allMatches}
              crossFinalMatches={crossFinalMatches}
            />
          </div>
        </TabsContent>

        <TabsContent 
          value="lba" 
          className="flex-1 overflow-hidden min-h-0 relative"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
            className="w-full h-full overflow-auto"
          >
            <FullBracketView 
              matches={lbAMatches} 
              groupName={`${groupName} - LB-A`} 
              allMatches={allMatches}
              crossFinalMatches={crossFinalMatches}
            />
          </div>
        </TabsContent>

        <TabsContent 
          value="lbb" 
          className="flex-1 overflow-hidden min-h-0 relative"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
            className="w-full h-full overflow-auto"
          >
            <FullBracketView 
              matches={lbBMatches} 
              groupName={`${groupName} - LB-B`} 
              allMatches={allMatches}
              crossFinalMatches={crossFinalMatches}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Cross Finals View - Show final matches across groups
 */
interface CrossFinalsViewProps {
  matches: BracketMatch[];
  allMatches: BracketMatch[]; // For advancement calculation
}

const CrossFinalsView = ({ matches, allMatches }: CrossFinalsViewProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.5, zoom + delta), 2);
    setZoom(newZoom);
  };

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="text-center">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Chưa có trận đấu chung kết</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 bg-slate-800/90 p-2 rounded-lg border border-slate-700">
        <button
          onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="text-xs text-center text-slate-400 py-1">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={resetView}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div 
        className="h-full overflow-auto"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            minWidth: 'fit-content',
            minHeight: 'fit-content',
          }}
        >
          <div className="p-8">
            <h2 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6" />
              Cross Finals - Vòng Chung Kết
            </h2>
            <BracketTree matches={matches} allMatches={allMatches} color="purple" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Bracket Tree - Display matches in horizontal rounds with connections
 */
interface BracketTreeProps {
  matches: BracketMatch[];
  allMatches: BracketMatch[]; // For advancement calculation
  color: 'green' | 'orange' | 'red' | 'purple';
}

const BracketTree = ({ matches, allMatches, color }: BracketTreeProps) => {
  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <p>Chưa có trận đấu</p>
      </div>
    );
  }

  // Constants for layout
  const CARD_WIDTH = 200; // Giảm từ 280 xuống 200 để đồng bộ
  const CARD_HEIGHT = 90; // Giảm từ 140 xuống 90 để đồng bộ
  const ROUND_GAP = 280; // Tăng từ 200 lên 280 để tăng khoảng cách ngang
  const START_X = 50;
  const START_Y = 100;

  // Group by rounds
  const rounds: { [key: number]: BracketMatch[] } = {};
  for (const m of matches) {
    const round = m.round_number;
    if (!rounds[round]) rounds[round] = [];
    rounds[round].push(m);
  }

  const sortedRounds = Object.entries(rounds).sort(([a], [b]) => Number(a) - Number(b));

  // Calculate positions for each match
  interface PositionedMatch extends BracketMatch {
    x: number;
    y: number;
  }

  const positionedMatches: PositionedMatch[] = [];
  let maxY = START_Y;

  // Calculate vertical spacing based on number of matches in first round
  const firstRoundCount = sortedRounds[0]?.[1]?.length || 1;
  const VERTICAL_GAP = 5; // Đồng bộ với FullBracketView

  sortedRounds.forEach(([roundNum, roundMatches], roundIndex) => {
    const x = START_X + roundIndex * ROUND_GAP;
    
    if (roundIndex === 0) {
      // First round: Center vertically based on total bracket height
      const totalHeight = roundMatches.length * CARD_HEIGHT + (roundMatches.length - 1) * VERTICAL_GAP;
      const centerOffset = 0; // Start from top
      
      roundMatches.forEach((match, matchIndex) => {
        const y = START_Y + centerOffset + matchIndex * (CARD_HEIGHT + VERTICAL_GAP);
        positionedMatches.push({ ...match, x, y });
        maxY = Math.max(maxY, y + CARD_HEIGHT);
      });
    } else {
      // Subsequent rounds: Position between source matches for perfect tree structure
      const prevRoundNum = sortedRounds[roundIndex - 1][0];
      
      roundMatches.forEach((match, matchIndex) => {
        // Calculate which matches from previous round feed into this match
        // In a standard bracket: match N in current round comes from matches 2N and 2N+1 in previous round
        const expectedSourceIndices = [matchIndex * 2, matchIndex * 2 + 1];
        const prevRoundMatches = positionedMatches.filter(m => m.round_number === Number(prevRoundNum));
        
        // Get the actual source matches based on positions
        const sources = expectedSourceIndices
          .map(idx => prevRoundMatches[idx])
          .filter(Boolean);

        let y: number;
        if (sources.length === 2) {
          // Position exactly between the two source matches
          y = (sources[0].y + sources[1].y + CARD_HEIGHT) / 2 - CARD_HEIGHT / 2;
        } else if (sources.length === 1) {
          // Only one source found, align with it
          y = sources[0].y;
        } else {
          // Fallback: evenly space in available vertical space
          const currentRoundMatches = positionedMatches.filter(m => m.round_number === Number(roundNum));
          if (currentRoundMatches.length === 0) {
            // First match in this round
            const prevRoundMiddle = prevRoundMatches.length > 0 
              ? (prevRoundMatches[0].y + prevRoundMatches[prevRoundMatches.length - 1].y + CARD_HEIGHT) / 2
              : START_Y;
            y = prevRoundMiddle - CARD_HEIGHT / 2;
          } else {
            // Space evenly based on previous matches in same round
            const lastMatch = currentRoundMatches[currentRoundMatches.length - 1];
            const spacingMultiplier = Math.pow(2, roundIndex); // Increase spacing exponentially
            y = lastMatch.y + CARD_HEIGHT + VERTICAL_GAP * spacingMultiplier;
          }
        }

        positionedMatches.push({ ...match, x, y });
        maxY = Math.max(maxY, y + CARD_HEIGHT);
      });
    }
  });

  // Calculate SVG dimensions with extra padding for final match
  const svgWidth = START_X + sortedRounds.length * ROUND_GAP + CARD_WIDTH + 300;
  const svgHeight = maxY + 200;

  const colorClasses = {
    green: { stroke: '#22c55e', fill: '#16a34a' },
    orange: { stroke: '#f97316', fill: '#ea580c' },
    red: { stroke: '#ef4444', fill: '#dc2626' },
    purple: { stroke: '#a78bfa', fill: '#8b5cf6' },
  };

  const colors = colorClasses[color];

  // Helper function to draw connection lines with right angles (ngang-dọc)
  const drawConnection = (from: PositionedMatch, to: PositionedMatch) => {
    const x1 = from.x + CARD_WIDTH;
    const y1 = from.y + CARD_HEIGHT / 2;
    const x2 = to.x;
    const y2 = to.y + CARD_HEIGHT / 2;
    const midX = (x1 + x2) / 2;

    // Đường vuông góc: ngang → dọc → ngang
    return (
      <path
        key={`${from.id}-${to.id}`}
        d={`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`}
        stroke={colors.stroke}
        strokeWidth="2"
        fill="none"
        opacity="0.5"
        strokeLinecap="square"
      />
    );
  };

  // Generate all connections based on bracket structure
  const connections: JSX.Element[] = [];
  
  for (let roundIndex = 1; roundIndex < sortedRounds.length; roundIndex++) {
    const [roundNum] = sortedRounds[roundIndex];
    const prevRoundNum = sortedRounds[roundIndex - 1][0];
    
    const currentRound = positionedMatches.filter(m => m.round_number === Number(roundNum));
    const prevRound = positionedMatches.filter(m => m.round_number === Number(prevRoundNum));

    // Connect based on bracket structure: each match connects to 2 matches from previous round
    for (let i = 0; i < currentRound.length; i++) {
      const match = currentRound[i];
      
      // Standard bracket: match i connects to matches 2i and 2i+1 from previous round
      const sourceIndex1 = i * 2;
      const sourceIndex2 = i * 2 + 1;
      
      if (prevRound[sourceIndex1]) {
        connections.push(drawConnection(prevRound[sourceIndex1], match));
      }
      if (prevRound[sourceIndex2]) {
        connections.push(drawConnection(prevRound[sourceIndex2], match));
      }
    }
  }

  return (
    <div className="w-full h-full">
      <svg width={svgWidth} height={svgHeight} className="overflow-visible">
        {/* Draw connections first (behind cards) */}
        <g>{connections}</g>

        {/* Draw round labels and matches */}
        {sortedRounds.map(([roundNum, roundMatches], roundIndex) => {
          const x = START_X + roundIndex * ROUND_GAP;
          const roundLabel = roundIndex === sortedRounds.length - 1 ? 'FINAL' : `Round ${roundNum}`;

          return (
            <g key={roundNum}>
              {/* Round label */}
              <rect
                x={x}
                y={20}
                width={CARD_WIDTH}
                height={50}
                rx={8}
                fill={colors.fill}
                opacity={0.3}
              />
              <text
                x={x + CARD_WIDTH / 2}
                y={45}
                textAnchor="middle"
                className="text-sm font-bold"
                fill={colors.stroke}
              >
                {roundLabel}
              </text>
              <text
                x={x + CARD_WIDTH / 2}
                y={62}
                textAnchor="middle"
                className="text-xs"
                fill={colors.stroke}
                opacity={0.7}
              >
                {roundMatches.length} {roundMatches.length === 1 ? 'match' : 'matches'}
              </text>

              {/* Matches */}
              {positionedMatches
                .filter(m => m.round_number === Number(roundNum))
                .map(match => (
                  <foreignObject
                    key={match.id}
                    x={match.x}
                    y={match.y}
                    width={CARD_WIDTH}
                    height={CARD_HEIGHT}
                  >
                    <MatchCard match={match} allMatches={allMatches} />
                  </foreignObject>
                ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Simple Bracket View for DE16/DE32 tournaments (no groups)
 * Shows WB, LB-A, LB-B, and SABO Finals in a clear layout
 */
const SimpleBracketView = ({
  wbMatches,
  lbaMatches,
  lbbMatches,
  saboMatches,
  allMatches
}: {
  wbMatches: BracketMatch[];
  lbaMatches: BracketMatch[];
  lbbMatches: BracketMatch[];
  saboMatches: BracketMatch[];
  allMatches: BracketMatch[];
}) => {
  // Sort matches by round_number then match_number
  const sortMatches = (matches: BracketMatch[]) => 
    [...matches].sort((a, b) => {
      if (a.round_number !== b.round_number) return a.round_number - b.round_number;
      return a.match_number - b.match_number;
    });

  // Group by round
  const groupByRound = (matches: BracketMatch[]) => {
    const groups: Record<number, BracketMatch[]> = {};
    matches.forEach(m => {
      const round = m.round_number;
      if (!groups[round]) groups[round] = [];
      groups[round].push(m);
    });
    return groups;
  };

  const wbRounds = groupByRound(sortMatches(wbMatches));
  const lbaRounds = groupByRound(sortMatches(lbaMatches));
  const lbbRounds = groupByRound(sortMatches(lbbMatches));
  const saboRounds = groupByRound(sortMatches(saboMatches));

  const renderBracketSection = (
    title: string, 
    rounds: Record<number, BracketMatch[]>, 
    color: string,
    bgColor: string
  ) => (
    <div className={`${bgColor} rounded-lg p-4 border border-slate-700`}>
      <h3 className={`text-lg font-bold ${color} mb-4 flex items-center gap-2`}>
        <Award className="w-5 h-5" />
        {title}
      </h3>
      <div className="flex gap-6 overflow-x-auto pb-2">
        {Object.entries(rounds)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([roundNum, matches]) => (
            <div key={roundNum} className="min-w-[200px]">
              <div className={`text-xs font-semibold ${color} mb-2 uppercase tracking-wide`}>
                Round {roundNum} ({matches.length} matches)
              </div>
              <div className="space-y-2">
                {matches.map(match => (
                  <MatchCard key={match.id} match={match} allMatches={allMatches} />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Winner Bracket */}
      {wbMatches.length > 0 && renderBracketSection(
        `Winner Bracket (${wbMatches.length} trận)`,
        wbRounds,
        'text-green-400',
        'bg-green-950/30'
      )}
      
      {/* Loser Bracket A */}
      {lbaMatches.length > 0 && renderBracketSection(
        `Loser Bracket A (${lbaMatches.length} trận)`,
        lbaRounds,
        'text-orange-400',
        'bg-orange-950/30'
      )}
      
      {/* Loser Bracket B */}
      {lbbMatches.length > 0 && renderBracketSection(
        `Loser Bracket B (${lbbMatches.length} trận)`,
        lbbRounds,
        'text-red-400',
        'bg-red-950/30'
      )}
      
      {/* SABO Finals */}
      {saboMatches.length > 0 && renderBracketSection(
        `SABO Finals (${saboMatches.length} trận)`,
        saboRounds,
        'text-purple-400',
        'bg-purple-950/30'
      )}
    </div>
  );
};

/**
 * Bracket Type View - Shows matches of a specific bracket type
 */
const BracketTypeView = ({
  matches,
  typeName,
  color
}: {
  matches: BracketMatch[];
  typeName: string;
  color: string;
}) => {
  // Sort and group by round
  const sortedMatches = [...matches].sort((a, b) => {
    if (a.round_number !== b.round_number) return a.round_number - b.round_number;
    return a.match_number - b.match_number;
  });

  const groupedByRound: Record<number, BracketMatch[]> = {};
  sortedMatches.forEach(m => {
    const round = m.round_number;
    if (!groupedByRound[round]) groupedByRound[round] = [];
    groupedByRound[round].push(m);
  });

  const colorClasses: Record<string, { text: string; bg: string; border: string }> = {
    green: { text: 'text-green-400', bg: 'bg-green-950/30', border: 'border-green-500/30' },
    orange: { text: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-500/30' },
    red: { text: 'text-red-400', bg: 'bg-red-950/30', border: 'border-red-500/30' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-500/30' },
  };

  const colors = colorClasses[color] || colorClasses.green;

  return (
    <div className="p-4">
      <div className={`${colors.bg} rounded-lg p-6 border ${colors.border}`}>
        <h2 className={`text-2xl font-bold ${colors.text} mb-6 flex items-center gap-3`}>
          <Award className="w-6 h-6" />
          {typeName}
          <span className="text-sm font-normal text-slate-400">
            ({matches.length} trận)
          </span>
        </h2>
        
        <div className="flex gap-8 overflow-x-auto pb-4">
          {Object.entries(groupedByRound)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([roundNum, roundMatches]) => (
              <div key={roundNum} className="min-w-[220px]">
                <div className={`text-sm font-bold ${colors.text} mb-3 pb-2 border-b ${colors.border}`}>
                  Round {roundNum}
                  <span className="text-slate-500 font-normal ml-2">
                    ({roundMatches.length} trận)
                  </span>
                </div>
                <div className="space-y-3">
                  {roundMatches.map(match => (
                    <MatchCard key={match.id} match={match} allMatches={matches} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DE64BracketVisualization;
