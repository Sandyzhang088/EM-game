/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  User, 
  Cpu, 
  Hand, 
  Layers,
  ChevronRight,
  Info,
  Heart,
  Diamond,
  Club,
  Spade
} from 'lucide-react';

// --- Types ---

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
}

type GameState = 'start' | 'playing' | 'choosingSuit' | 'gameOver';
type Turn = 'player' | 'ai';

// --- Constants ---

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const SUIT_ICONS = {
  hearts: <Heart className="w-full h-full text-red-500 fill-red-500" />,
  diamonds: <Diamond className="w-full h-full text-red-500 fill-red-500" />,
  clubs: <Club className="w-full h-full text-slate-800 fill-slate-800" />,
  spades: <Spade className="w-full h-full text-slate-800 fill-slate-800" />,
};

const SUIT_COLORS = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-slate-800',
  spades: 'text-slate-800',
};

// --- Utils ---

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank, index) => {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        value: index + 1,
      });
    });
  });
  return shuffle(deck);
};

const shuffle = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- Components ---

interface PlayingCardProps {
  card: Card;
  isFaceUp?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  isAI?: boolean;
}

const PlayingCard: React.FC<PlayingCardProps> = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  isPlayable = false,
  isAI = false 
}) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={isPlayable ? { y: -15, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`
        relative w-20 h-28 sm:w-24 sm:h-36 rounded-lg shadow-lg border-2 flex flex-col items-center justify-between p-2 cursor-pointer transition-colors
        ${isFaceUp ? 'bg-white border-slate-200' : 'bg-indigo-600 border-indigo-400'}
        ${isPlayable ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}
        ${isAI ? 'cursor-default' : ''}
      `}
    >
      {isFaceUp ? (
        <>
          <div className={`self-start font-bold text-lg sm:text-xl ${SUIT_COLORS[card.suit]}`}>
            {card.rank}
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10">
            {SUIT_ICONS[card.suit]}
          </div>
          <div className={`self-end font-bold text-lg sm:text-xl rotate-180 ${SUIT_COLORS[card.suit]}`}>
            {card.rank}
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-white/20 rounded-full flex items-center justify-center">
            <span className="text-white font-black text-2xl">T</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function App() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [currentSuit, setCurrentSuit] = useState<Suit | null>(null);
  const [turn, setTurn] = useState<Turn>('player');
  const [gameState, setGameState] = useState<GameState>('start');
  const [winner, setWinner] = useState<Turn | null>(null);
  const [message, setMessage] = useState<string>("Welcome to Tina's Crazy Eights!");

  // --- Game Logic ---

  const initGame = () => {
    const fullDeck = createDeck();
    const pHand = fullDeck.splice(0, 8);
    const aHand = fullDeck.splice(0, 8);
    
    // Ensure the first discard is not an 8 for simplicity
    let firstDiscardIdx = fullDeck.findIndex(c => c.rank !== '8');
    if (firstDiscardIdx === -1) firstDiscardIdx = 0;
    const firstDiscard = fullDeck.splice(firstDiscardIdx, 1)[0];

    setDeck(fullDeck);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setDiscardPile([firstDiscard]);
    setCurrentSuit(firstDiscard.suit);
    setTurn('player');
    setGameState('playing');
    setWinner(null);
    setMessage("Your turn! Match the suit or rank.");
  };

  const topCard = useMemo(() => discardPile[discardPile.length - 1], [discardPile]);

  const canPlay = useCallback((card: Card) => {
    if (!topCard) return false;
    if (card.rank === '8') return true;
    return card.suit === currentSuit || card.rank === topCard.rank;
  }, [topCard, currentSuit]);

  const handlePlayCard = (card: Card, isPlayer: boolean) => {
    if (gameState !== 'playing') return;
    if (isPlayer && turn !== 'player') return;
    if (!canPlay(card)) return;

    const setHand = isPlayer ? setPlayerHand : setAiHand;
    setHand(prev => prev.filter(c => c.id !== card.id));
    setDiscardPile(prev => [...prev, card]);
    
    if (card.rank === '8') {
      if (isPlayer) {
        setGameState('choosingSuit');
        setMessage("Crazy 8! Choose a new suit.");
      } else {
        // AI logic for choosing suit
        const suitsInHand = aiHand.filter(c => c.id !== card.id).map(c => c.suit);
        const mostCommonSuit = SUITS.reduce((a, b) => 
          suitsInHand.filter(s => s === a).length >= suitsInHand.filter(s => s === b).length ? a : b
        );
        setCurrentSuit(mostCommonSuit);
        setMessage(`AI played an 8 and chose ${mostCommonSuit}!`);
        checkWin('ai', aiHand.length - 1);
        setTurn('player');
      }
    } else {
      setCurrentSuit(card.suit);
      checkWin(isPlayer ? 'player' : 'ai', (isPlayer ? playerHand : aiHand).length - 1);
      setTurn(isPlayer ? 'ai' : 'player');
      setMessage(isPlayer ? "AI is thinking..." : "Your turn!");
    }
  };

  const checkWin = (who: Turn, count: number) => {
    if (count === 0) {
      setGameState('gameOver');
      setWinner(who);
      setMessage(who === 'player' ? "Congratulations! You won!" : "Game Over. AI won.");
    }
  };

  const handleDraw = (isPlayer: boolean) => {
    if (gameState !== 'playing') return;
    if (isPlayer && turn !== 'player') return;
    
    if (deck.length === 0) {
      setMessage("Deck is empty! Skipping turn.");
      setTurn(isPlayer ? 'ai' : 'player');
      return;
    }

    const newDeck = [...deck];
    const drawnCard = newDeck.pop()!;
    setDeck(newDeck);

    if (isPlayer) {
      setPlayerHand(prev => [...prev, drawnCard]);
      setMessage("You drew a card.");
      // In some variations, you can play immediately if drawn card matches. 
      // Let's keep it simple: drawing ends turn or you can play.
      // Standard Crazy 8s: Draw until you can play or draw once. 
      // Let's go with "Draw once, then it's next turn if still can't play".
      if (!canPlay(drawnCard)) {
        setTimeout(() => setTurn('ai'), 1000);
      }
    } else {
      setAiHand(prev => [...prev, drawnCard]);
      setMessage("AI drew a card.");
      if (!canPlay(drawnCard)) {
        setTimeout(() => setTurn('player'), 1000);
      }
    }
  };

  const handleSuitChoice = (suit: Suit) => {
    setCurrentSuit(suit);
    setGameState('playing');
    setTurn('ai');
    setMessage(`You chose ${suit}. AI's turn.`);
    checkWin('player', playerHand.length);
  };

  // --- AI Turn Effect ---

  useEffect(() => {
    if (turn === 'ai' && gameState === 'playing') {
      const timer = setTimeout(() => {
        const playableCards = aiHand.filter(canPlay);
        if (playableCards.length > 0) {
          // AI plays a random playable card, but prefers non-8s unless necessary
          const nonEights = playableCards.filter(c => c.rank !== '8');
          const cardToPlay = nonEights.length > 0 
            ? nonEights[Math.floor(Math.random() * nonEights.length)]
            : playableCards[0];
          handlePlayCard(cardToPlay, false);
        } else {
          handleDraw(false);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [turn, gameState, aiHand, canPlay]);

  // --- Render ---

  return (
    <div className="min-h-screen bg-emerald-900 text-white font-sans selection:bg-emerald-500/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-black font-black text-xl">8</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight italic">Tina's Crazy Eights</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-mono">{aiHand.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <User className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-mono">{playerHand.length}</span>
          </div>
          <button 
            onClick={initGame}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Restart Game"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Game Area */}
      <main className="flex-1 relative p-4 flex flex-col items-center justify-between max-w-5xl mx-auto w-full">
        
        {/* AI Hand */}
        <div className="w-full flex justify-center py-4">
          <div className="flex -space-x-12 sm:-space-x-16 hover:space-x-2 transition-all duration-300">
            {aiHand.map((card, i) => (
              <PlayingCard key={card.id} card={card} isFaceUp={false} isAI />
            ))}
            {aiHand.length === 0 && gameState === 'playing' && (
              <div className="text-slate-400 italic">AI is out of cards!</div>
            )}
          </div>
        </div>

        {/* Center: Deck & Discard */}
        <div className="flex items-center gap-8 sm:gap-16 my-8">
          {/* Draw Pile */}
          <div className="flex flex-col items-center gap-2">
            <div 
              onClick={() => turn === 'player' && handleDraw(true)}
              className={`
                relative w-20 h-28 sm:w-24 sm:h-36 rounded-lg shadow-xl border-2 border-indigo-400 bg-indigo-600 cursor-pointer
                hover:scale-105 transition-transform active:scale-95
                ${turn !== 'player' || gameState !== 'playing' ? 'opacity-50 cursor-not-allowed' : 'ring-4 ring-white/20'}
              `}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Layers className="w-8 h-8 text-white/40" />
              </div>
              {/* Stack effect */}
              <div className="absolute -top-1 -left-1 w-full h-full rounded-lg border-2 border-indigo-400 bg-indigo-600 -z-10" />
              <div className="absolute -top-2 -left-2 w-full h-full rounded-lg border-2 border-indigo-400 bg-indigo-600 -z-20" />
            </div>
            <span className="text-xs font-mono text-emerald-300 uppercase tracking-widest">Draw ({deck.length})</span>
          </div>

          {/* Discard Pile */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-20 h-28 sm:w-24 sm:h-36">
              <AnimatePresence mode="popLayout">
                {topCard && (
                  <PlayingCard 
                    key={topCard.id} 
                    card={topCard} 
                    isFaceUp={true} 
                  />
                )}
              </AnimatePresence>
              {currentSuit !== topCard?.suit && (
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full shadow-lg border-2 border-yellow-400 p-2 animate-bounce">
                  {SUIT_ICONS[currentSuit as Suit]}
                </div>
              )}
            </div>
            <span className="text-xs font-mono text-emerald-300 uppercase tracking-widest">Discard</span>
          </div>
        </div>

        {/* Message Bar */}
        <div className="w-full max-w-md bg-black/40 backdrop-blur-sm rounded-2xl p-4 border border-white/10 shadow-2xl mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${turn === 'player' ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
            <p className="text-sm sm:text-base font-medium text-emerald-50/90">{message}</p>
          </div>
        </div>

        {/* Player Hand */}
        <div className="w-full flex justify-center py-4 overflow-x-auto no-scrollbar">
          <div className="flex -space-x-8 sm:-space-x-12 pb-8 pt-4 px-8">
            {playerHand.map((card) => (
              <PlayingCard 
                key={card.id} 
                card={card} 
                isPlayable={turn === 'player' && canPlay(card)}
                onClick={() => handlePlayCard(card, true)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {gameState === 'start' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full text-center space-y-8">
              <motion.div 
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-32 h-32 bg-yellow-500 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.3)]"
              >
                <span className="text-black font-black text-6xl">8</span>
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter uppercase italic">Crazy Eights</h2>
                <p className="text-emerald-200/60 font-medium">The ultimate classic card game experience.</p>
              </div>
              <button 
                onClick={initGame}
                className="group relative w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  START GAME <ChevronRight className="w-5 h-5" />
                </span>
              </button>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase mb-1">Rules</h3>
                  <p className="text-xs text-white/60 leading-relaxed">Match suit or rank. 8s are wild and can be played anytime.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase mb-1">Goal</h3>
                  <p className="text-xs text-white/60 leading-relaxed">Be the first to clear your hand. Draw if you're stuck.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'choosingSuit' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
            >
              <h2 className="text-2xl font-bold mb-6">Choose New Suit</h2>
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map((suit) => (
                  <button
                    key={suit}
                    onClick={() => handleSuitChoice(suit)}
                    className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all hover:scale-105 active:scale-95"
                  >
                    <div className="w-12 h-12">
                      {SUIT_ICONS[suit]}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/60">{suit}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {gameState === 'gameOver' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-50 flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full text-center space-y-8">
              <motion.div 
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-32 h-32 bg-yellow-500 rounded-full mx-auto flex items-center justify-center shadow-[0_0_80px_rgba(234,179,8,0.4)]"
              >
                <Trophy className="w-16 h-16 text-black" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-5xl font-black tracking-tighter uppercase italic">
                  {winner === 'player' ? 'Victory!' : 'Defeat'}
                </h2>
                <p className="text-emerald-200/60 font-medium">
                  {winner === 'player' ? "You've mastered the eights!" : "The AI outsmarted you this time."}
                </p>
              </div>
              <button 
                onClick={initGame}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-emerald-100 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> PLAY AGAIN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="p-4 bg-black/20 text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] flex justify-between items-center">
        <span>Tina's Crazy Eights v1.0</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Standard Rules</span>
          <span>© 2026 Tina Games</span>
        </div>
      </footer>
    </div>
  );
}
