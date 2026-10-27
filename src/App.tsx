/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Skull, Ghost, Flame, Shield, Award, Zap, 
  Volume2, VolumeX, RefreshCw, Trophy, ShoppingBag, 
  Users, TrendingUp, AlertCircle, CheckCircle2, CloudRain,
  RotateCcw, Trash2, X, AlertTriangle, Wifi
} from 'lucide-react';

// --- TYPES ---
interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  costMultiplier: number;
  cps: number;
  cpc: number;
  level: number;
  type: 'click' | 'auto' | 'stealth' | 'special';
}

interface OnlinePlayer {
  id: string;
  name: string;
  avatar: string;
  candies: number;
  level: number;
  lastActive: number;
}

interface BotRival {
  id: string;
  name: string;
  avatar: string;
  candies: number;
  level: number;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface RainDrop {
  id: string;
  x: number;
  speed: number;
  size: number;
  emoji: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  reward: number;
  unlocked: boolean;
  condition: (state: any) => boolean;
}

interface LogEntry {
  id: string;
  time: string;
  text: string;
  type: 'success' | 'fail' | 'info' | 'alert';
}

let uniqueIdCounter = 0;
const getUniqueId = () => `id_${Date.now()}_${++uniqueIdCounter}_${Math.random().toString(36).substr(2, 5)}`;

const DEFAULT_UPGRADES: Upgrade[] = [
  { id: 'fork', name: '尖ったキャンディフォーク', description: 'カボチャから一度に出るお菓子が増える (+1 CPC)', cost: 30, costMultiplier: 1.6, cps: 0, cpc: 1, level: 0, type: 'click' },
  { id: 'wand', name: '魔法の魔女杖', description: 'さらに強力にカボチャを叩ける (+5 CPC)', cost: 250, costMultiplier: 1.7, cps: 0, cpc: 5, level: 0, type: 'click' },
  { id: 'ghost_helper', name: 'おばけのお手伝い', description: 'おばけが勝手にお菓子を集めてくれる (+3 CPS)', cost: 100, costMultiplier: 1.5, cps: 3, cpc: 0, level: 0, type: 'auto' },
  { id: 'bat_swarm', name: 'コウモリの群れ', description: '夜空からお菓子を強奪してくる (+20 CPS)', cost: 800, costMultiplier: 1.6, cps: 20, cpc: 0, level: 0, type: 'auto' },
  { id: 'zombie_miner', name: 'ゾンビの採掘隊', description: '墓場から大量のシュガー鉱脈を掘り起こす (+100 CPS)', cost: 4000, costMultiplier: 1.65, cps: 100, cpc: 0, level: 0, type: 'auto' },
  { id: 'shadow_cloak', name: '影のクローク', description: 'オンライン上のプレイヤーからのスリ成功率と耐性が上昇', cost: 500, costMultiplier: 2.2, cps: 0, cpc: 0, level: 0, type: 'stealth' },
  { id: 'cauldron', name: '不気味な大釜', description: 'お菓子の魔力を凝縮し生産力を加速 (+400 CPS)', cost: 15000, costMultiplier: 2.5, cps: 400, cpc: 0, level: 0, type: 'special' },
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_candy', title: '初めての収穫', description: 'お菓子を100個集める', reward: 100, unlocked: false, condition: (s) => s.totalEarned >= 100 },
  { id: 'pumpkin_master', title: 'カボチャ叩きの名人', description: 'カボチャを50回叩く', reward: 300, unlocked: false, condition: (s) => s.clickCount >= 50 },
  { id: 'first_heist', title: '闇夜のコソ泥', description: 'オンラインプレイヤーから初めてお菓子を盗む', reward: 500, unlocked: false, condition: (s) => s.heistCount >= 1 },
  { id: 'candy_lord', title: 'お菓子王国の覇者', description: '累計20,000個のお菓子を獲得する', reward: 2000, unlocked: false, condition: (s) => s.totalEarned >= 20000 },
  { id: 'level_five', title: '見習いナイトメア', description: 'プレイヤーレベル5に到達する', reward: 1500, unlocked: false, condition: (s) => s.level >= 5 },
];

const OFFLINE_BOTS: BotRival[] = [
  { id: 'bot_lilly', name: '魔女のリリー', avatar: '🧙‍♀️', candies: 650, level: 4 },
  { id: 'bot_jack', name: '吸血鬼ジャック', avatar: '🧛‍♂️', candies: 2800, level: 9 },
  { id: 'bot_grim', name: '死神グリム', avatar: '💀', candies: 12500, level: 16 },
  { id: 'bot_popo', name: 'おばけのポポ', avatar: '👻', candies: 180, level: 2 },
];

const SPOOKY_NEWS = [
  '🎃 速報: 巨大なカボチャから甘い魔力が溢れ出しています！',
  '🧙‍♀️ 魔女のリリーがあなたの隠しストックを狙って夜空を飛んでいます。',
  '👻 おばけたちが夜通しキャンディを集め続けています。',
  '🦇 コウモリの群れが隣町のハロウィン会場からお菓子を強奪中！',
  '🌙 ブラッドムーンの夜、スリの成功率がわずかに上昇中…？'
];

export default function App() {
  const [candies, setCandies] = useState<number>(() => {
    const saved = localStorage.getItem('hw_candies');
    return saved !== null ? JSON.parse(saved) : 50;
  });
  
  const [totalCandiesEarned, setTotalCandiesEarned] = useState<number>(() => {
    const saved = localStorage.getItem('hw_total_earned');
    return saved !== null ? JSON.parse(saved) : 50;
  });

  const [playerLevel, setPlayerLevel] = useState<number>(() => {
    const saved = localStorage.getItem('hw_level');
    return saved !== null ? JSON.parse(saved) : 1;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [newsIndex, setNewsIndex] = useState<number>(0);

  // Floating & Rain
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [rainDrops, setRainDrops] = useState<RainDrop[]>([]);
  const [isPumpActive, setIsPumpActive] = useState<boolean>(false);
  const [candyHistory, setCandyHistory] = useState<number[]>([50, 50]);

  // Record candy history for graph
  useEffect(() => {
    const historyTimer = setInterval(() => {
      setCandyHistory(prev => [...prev.slice(-15), Math.floor(candies)]);
    }, 2000);
    return () => clearInterval(historyTimer);
  }, [candies]);

  // My Player Info for BroadcastChannel P2P
  const [myId] = useState<string>(() => getUniqueId());
  const [myName] = useState<string>(() => `お菓子泥棒_${Math.floor(Math.random() * 900 + 100)}`);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [offlineBots, setOfflineBots] = useState<BotRival[]>(OFFLINE_BOTS);
  
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Upgrades State
  const [upgrades, setUpgrades] = useState<Upgrade[]>(() => {
    const saved = localStorage.getItem('hw_upgrades');
    return saved ? JSON.parse(saved) : DEFAULT_UPGRADES;
  });

  const clickPower = 1 + upgrades.reduce((acc, u) => acc + (u.type === 'click' ? u.cpc * u.level : 0), 0);
  const autoCps = upgrades.reduce((acc, u) => acc + ((u.type === 'auto' || u.type === 'special') ? u.cps * u.level : 0), 0);
  const stealthSkill = 1 + upgrades.reduce((acc, u) => acc + (u.type === 'stealth' ? 0.5 * u.level : 0), 0);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: getUniqueId(), time: '今さっき', text: 'クッキークリッカー風ハロウィンへようこそ！カボチャを叩いてお菓子を増やそう！', type: 'info' }
  ]);

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('hw_achievements');
    if (saved) {
      try {
        const unlockedIds: string[] = JSON.parse(saved);
        return DEFAULT_ACHIEVEMENTS.map(a => ({
          ...a,
          unlocked: unlockedIds.includes(a.id)
        }));
      } catch (e) {
        return DEFAULT_ACHIEVEMENTS;
      }
    }
    return DEFAULT_ACHIEVEMENTS;
  });
  const [clickCount, setClickCount] = useState<number>(0);
  const [heistCount, setHeistCount] = useState<number>(0);

  // Rotate news ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setNewsIndex(prev => (prev + 1) % SPOOKY_NEWS.length);
    }, 6000);
    return () => clearInterval(ticker);
  }, []);

  // --- BROADCASTCHANNEL P2P SYNC ---
  useEffect(() => {
    try {
      const bc = new BroadcastChannel('halloween_candy_heist_p2p');
      channelRef.current = bc;

      bc.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'PLAYER_PING') {
          bc.postMessage({
            type: 'PLAYER_STATE',
            player: {
              id: myId,
              name: myName,
              avatar: '🎃',
              candies: Math.floor(candies),
              level: playerLevel,
              lastActive: Date.now()
            }
          });
        } else if (data.type === 'PLAYER_STATE') {
          const p = data.player;
          if (p && p.id !== myId) {
            setOnlinePlayers(prev => {
              const existingIndex = prev.findIndex(item => item.id === p.id);
              if (existingIndex >= 0) {
                const copy = [...prev];
                copy[existingIndex] = { ...p };
                return copy;
              } else {
                return [...prev, { ...p }];
              }
            });
          }
        } else if (data.type === 'STEAL_ATTEMPT' && data.targetId === myId) {
          const stolen = Math.floor(candies * 0.2);
          if (stolen > 0) {
            setCandies(c => Math.max(0, c - stolen));
            playSound('fail');
            addLog(`🚨 警告！ ${data.thiefName} にあなたのお菓子が ${stolen.toLocaleString()}個 盗まれました！`, 'alert');
            
            bc.postMessage({
              type: 'STEAL_RESPONSE',
              thiefId: data.thiefId,
              targetName: myName,
              success: true,
              stolen
            });
          }
        } else if (data.type === 'STEAL_RESPONSE' && data.thiefId === myId) {
          if (data.success) {
            setCandies(c => c + data.stolen);
            setTotalCandiesEarned(t => t + data.stolen);
            playSound('steal');
            addLog(`🦹‍♂️ P2P強奪成功！ ${data.targetName} から ${data.stolen.toLocaleString()}個 のお菓子をスリ取った！`, 'success');
          }
        }
      };

      const broadcastPresence = () => {
        bc.postMessage({
          type: 'PLAYER_STATE',
          player: {
            id: myId,
            name: myName,
            avatar: '🎃',
            candies: Math.floor(candies),
            level: playerLevel,
            lastActive: Date.now()
          }
        });
      };

      broadcastPresence();
      bc.postMessage({ type: 'PLAYER_PING' });

      const presenceTimer = setInterval(broadcastPresence, 3000);
      const cleanupTimer = setInterval(() => {
        const now = Date.now();
        setOnlinePlayers(prev => prev.filter(p => now - p.lastActive < 8000));
      }, 4000);

      return () => {
        clearInterval(presenceTimer);
        clearInterval(cleanupTimer);
        bc.close();
      };
    } catch (e) {}
  }, [myId, myName, candies, playerLevel]);

  // --- AUDIO SYNTHESIZER ---
  const playSound = (type: 'pop' | 'steal' | 'fail' | 'level' | 'buy') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'steal') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.setValueAtTime(700, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'fail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'level' || type === 'buy') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.12);
        osc.frequency.setValueAtTime(783.99, now + 0.24);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {}
  };

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('hw_candies', JSON.stringify(candies));
    localStorage.setItem('hw_total_earned', JSON.stringify(totalCandiesEarned));
    localStorage.setItem('hw_level', JSON.stringify(playerLevel));
    localStorage.setItem('hw_upgrades', JSON.stringify(upgrades));
    localStorage.setItem('hw_achievements', JSON.stringify(achievements.filter(a => a.unlocked).map(a => a.id)));
  }, [candies, totalCandiesEarned, playerLevel, upgrades, achievements]);

  // --- GAME TICK ---
  useEffect(() => {
    const timer = setInterval(() => {
      if (autoCps > 0) {
        const gained = autoCps / 10;
        setCandies(prev => prev + gained);
        setTotalCandiesEarned(prev => prev + gained);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [autoCps]);

  // --- ACHIEVEMENTS ---
  useEffect(() => {
    const currentState = { totalEarned: totalCandiesEarned, clickCount, heistCount, level: playerLevel };
    setAchievements(prev => prev.map(ach => {
      if (!ach.unlocked && ach.condition(currentState)) {
        playSound('level');
        setCandies(c => c + ach.reward);
        addLog(`🏆 実績解除: 「${ach.title}」！ 報酬 +${ach.reward} 🍬`, 'success');
        return { ...ach, unlocked: true };
      }
      return ach;
    }));
  }, [totalCandiesEarned, clickCount, heistCount, playerLevel]);

  const addLog = (text: string, type: 'success' | 'fail' | 'info' | 'alert') => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ id: getUniqueId(), time: now, text, type }, ...prev.slice(0, 19)]);
  };

  // --- PUMPKIN CLICK & RAIN EFFECT ---
  const handlePumpkinClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const earned = clickPower * (1 + (playerLevel - 1) * 0.05);
    setCandies(prev => prev + earned);
    setTotalCandiesEarned(prev => prev + earned);
    setClickCount(prev => prev + 1);
    setIsPumpActive(true);
    setTimeout(() => setIsPumpActive(false), 150);

    playSound('pop');

    const textId = getUniqueId();
    setFloatingTexts(prev => [
      ...prev.slice(-15),
      { id: textId, x: clientX || window.innerWidth / 2, y: (clientY || window.innerHeight / 2) - 40, text: `+${earned.toFixed(0)} 🍬`, color: '#ff9933' }
    ]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== textId));
    }, 800);

    const newDrops: RainDrop[] = Array.from({ length: 8 }).map((_, i) => ({
      id: getUniqueId(),
      x: Math.random() * window.innerWidth,
      speed: Math.random() * 3 + 4,
      size: Math.random() * 16 + 20,
      emoji: ['🍬', '🍫', '🍭', '⭐', '🎃'][Math.floor(Math.random() * 5)]
    }));
    setRainDrops(prev => [...prev.slice(-30), ...newDrops]);
  };

  // --- BUY UPGRADE ---
  const buyUpgrade = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade || candies < upgrade.cost) return;

    setCandies(prev => prev - upgrade.cost);
    playSound('buy');

    setUpgrades(prev => prev.map(u => {
      if (u.id === upgradeId) {
        return { ...u, level: u.level + 1, cost: Math.floor(u.cost * u.costMultiplier) };
      }
      return u;
    }));

    addLog(`✨ アップグレード購入: ${upgrade.name} (Lv.${upgrade.level + 1})`, 'success');
  };

  // --- LEVEL UP ---
  const levelUpCost = Math.floor(1000 * Math.pow(2.2, playerLevel - 1));
  const handleLevelUp = () => {
    if (candies < levelUpCost) return;
    setCandies(prev => prev - levelUpCost);
    setPlayerLevel(prev => prev + 1);
    playSound('level');
    addLog(`🎉 プレイヤーレベルが Lv.${playerLevel + 1} に昇格！タッピング効率がアップ！`, 'success');
  };

  // --- STEAL ACTIONS ---
  const attemptOnlineSteal = (targetId: string) => {
    setHeistCount(prev => prev + 1);
    const targetPlayer = onlinePlayers.find(p => p.id === targetId);
    if (!targetPlayer) return;

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'STEAL_ATTEMPT',
        thiefId: myId,
        thiefName: myName,
        targetId
      });
      addLog(`🦹‍♂️ ${targetPlayer.name} の隠れ家に忍び込んでいます...`, 'info');
    }
  };

  const attemptBotSteal = (botId: string) => {
    setHeistCount(prev => prev + 1);
    const bot = offlineBots.find(b => b.id === botId);
    if (!bot) return;

    const successChance = Math.min(85, Math.max(30, 60 + (stealthSkill * 10) + (playerLevel * 3) - (bot.level * 2)));
    const isSuccess = Math.random() * 100 <= successChance;

    if (isSuccess && bot.candies > 10) {
      const stolen = Math.floor(bot.candies * 0.3);
      setOfflineBots(prev => prev.map(b => b.id === botId ? { ...b, candies: b.candies - stolen } : b));
      setCandies(c => c + stolen);
      setTotalCandiesEarned(t => t + stolen);
      playSound('steal');
      addLog(`🦹‍♂️ BOT強奪成功！ ${bot.name} から ${stolen.toLocaleString()}個 のお菓子をスリ取った！`, 'success');
    } else {
      const penalty = Math.floor(candies * 0.05);
      setCandies(c => Math.max(0, c - penalty));
      playSound('fail');
      addLog(`💥 BOT強奪失敗！ ${bot.name} に見つかり、お菓子を ${penalty}個 奪い返された…！`, 'fail');
    }
  };

  // --- CLEAR / RESET HANDLERS ---
  const handleClearCandiesOnly = () => {
    setCandies(0);
    localStorage.setItem('hw_candies', '0');
    playSound('fail');
    addLog('🧹 お菓子キャッシュをクリアしました！所持お菓子が0個になりました。', 'alert');
    setIsResetModalOpen(false);
  };

  const handleFullReset = () => {
    localStorage.removeItem('hw_candies');
    localStorage.removeItem('hw_total_earned');
    localStorage.removeItem('hw_level');
    localStorage.removeItem('hw_upgrades');
    localStorage.removeItem('hw_achievements');

    setCandies(50);
    setTotalCandiesEarned(50);
    setPlayerLevel(1);
    setUpgrades(DEFAULT_UPGRADES);
    setAchievements(DEFAULT_ACHIEVEMENTS);
    setClickCount(0);
    setHeistCount(0);
    setRainDrops([]);
    setFloatingTexts([]);

    playSound('fail');
    addLog('⚠️ 全セーブデータ・キャッシュを完全初期化しました。新しいゲームを開始します！', 'alert');
    setIsResetModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-slate-950 to-black text-slate-100 font-sans pb-12 select-none overflow-x-hidden relative flex flex-col">
      
      {/* CANDY RAIN EFFECT */}
      {rainDrops.map(drop => (
        <div 
          key={drop.id}
          className="fixed pointer-events-none z-50 animate-rain"
          style={{ 
            left: `${drop.x}px`, 
            top: `-40px`, 
            fontSize: `${drop.size}px`,
            animationDuration: `${drop.speed}s`
          }}
        >
          {drop.emoji}
        </div>
      ))}

      {/* FLOATING TEXTS */}
      {floatingTexts.map(t => (
        <div 
          key={t.id} 
          className="fixed pointer-events-none font-black text-xl md:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-50 animate-fade-up"
          style={{ left: t.x - 30, top: t.y, color: t.color }}
        >
          {t.text}
        </div>
      ))}

      {/* NEWS TICKER BANNER (COOKIE CLICKER STYLE) */}
      <div className="bg-purple-950 border-b border-orange-500/30 py-1.5 px-4 text-center text-xs text-amber-300 font-medium overflow-hidden whitespace-nowrap">
        <span className="animate-pulse mr-2">📢</span>
        {SPOOKY_NEWS[newsIndex]}
      </div>

      {/* TOP HEADER */}
      <header className="bg-purple-950/90 backdrop-blur-md border-b border-orange-500/30 px-4 py-3 shadow-lg shadow-orange-950/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/50 animate-pulse">
              <Skull className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                🎃 ぬすんでハロウィン！(Cookie Clicker Style)
              </h1>
              <p className="text-xs text-purple-300">{myName} (Lv.{playerLevel})</p>
            </div>
          </div>

          {/* TOP ACTION BUTTONS */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsResetModalOpen(true)}
              className="p-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-500/40 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shadow-md"
              title="お菓子やキャッシュをクリア"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>キャッシュ消去</span>
            </button>

            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-purple-900/50 hover:bg-purple-800 text-orange-300 border border-orange-500/30 transition-all cursor-pointer"
              title={soundEnabled ? '音声をミュート' : '音声を有効化'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* --- COOKIE CLICKER 3-COLUMN LAYOUT --- */}
      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 w-full">
        
        {/* COLUMN 1: LEFT PANE (THE PUMPKIN CLICKER & STATS) */}
        <div className="lg:col-span-4 bg-purple-950/50 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-md flex flex-col items-center justify-between shadow-2xl relative overflow-hidden min-h-[500px]">
          
          <div className="text-center w-full">
            <h2 className="text-sm uppercase tracking-widest text-orange-400 font-bold mb-1">ジャック・オー・ランタン</h2>
            <div className="text-3xl md:text-4xl font-black text-orange-400 drop-shadow-[0_2px_8px_rgba(255,117,24,0.5)]">
              {Math.floor(candies).toLocaleString()} <span className="text-xl">🍬</span>
            </div>
            <p className="text-xs text-purple-300 mt-1">
              秒間生産 (CPS): <span className="text-amber-300 font-bold">{autoCps.toFixed(1)}</span>
            </p>
          </div>

          {/* GIANT CLICKABLE PUMPKIN */}
          <div 
            onClick={handlePumpkinClick}
            onTouchStart={handlePumpkinClick}
            className={`cursor-pointer transition-transform duration-100 select-none relative my-6 group ${isPumpActive ? 'scale-90 rotate-3' : 'hover:scale-105 active:scale-95'}`}
          >
            <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-3xl group-hover:bg-orange-500/50 transition-all" />
            <div className="relative text-9xl md:text-[10rem] filter drop-shadow-[0_15px_25px_rgba(255,117,24,0.5)] animate-bounce-slow">
              🎃
            </div>
          </div>

          {/* PLAYER LEVEL & UPGRADE PROMOTION */}
          <div className="w-full bg-black/50 p-4 rounded-2xl border border-purple-500/30 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-purple-300">プレイヤーレベル</span>
              <span className="font-black text-amber-300 text-sm">Lv. {playerLevel}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              クリック威力: <span className="text-orange-400 font-bold">+{clickPower}</span> 🍬
            </div>
            <button 
              onClick={handleLevelUp}
              disabled={candies < levelUpCost}
              className={`w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-all cursor-pointer ${candies >= levelUpCost ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:opacity-90 shadow-lg shadow-orange-500/30' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> 昇格する ({levelUpCost.toLocaleString()} 🍬)
            </button>
          </div>

          {/* CANDY GROWTH GRAPH */}
          <div className="w-full bg-black/40 p-3 rounded-2xl border border-purple-500/20 mt-3">
            <div className="flex justify-between items-center text-[11px] text-purple-300 mb-1">
              <span className="flex items-center gap-1 font-bold text-orange-400">
                <TrendingUp className="w-3.5 h-3.5" /> 収穫トレンド (グラフ)
              </span>
              <span>直近の推移</span>
            </div>
            <div className="h-16 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60" preserveAspectRatio="none">
                {candyHistory.length > 1 && (() => {
                  const min = Math.min(...candyHistory);
                  const max = Math.max(...candyHistory, min + 1);
                  const range = max - min || 1;
                  const points = candyHistory.map((val, idx) => {
                    const x = (idx / (candyHistory.length - 1)) * 200;
                    const y = 55 - ((val - min) / range) * 50;
                    return `${x},${isNaN(y) ? 30 : y}`;
                  }).join(' ');
                  return (
                    <polyline
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points}
                    />
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>

        {/* COLUMN 2: CENTER PANE (BUILDINGS & UPGRADES STORE - COOKIE CLICKER SHOP) */}
        <div className="lg:col-span-4 bg-purple-950/50 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-md flex flex-col shadow-2xl max-h-[650px] overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-500/20">
            <h2 className="text-base font-black text-orange-400 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> ストア (お菓子の魔術)
            </h2>
            <span className="text-xs text-purple-300">ショップ</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {upgrades.map(upgrade => {
              const canAfford = candies >= upgrade.cost;
              return (
                <div 
                  key={upgrade.id} 
                  onClick={() => canAfford && buyUpgrade(upgrade.id)}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${canAfford ? 'bg-black/60 border-orange-500/40 hover:border-orange-400 cursor-pointer shadow-md' : 'bg-black/30 border-purple-500/20 opacity-60 cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl p-2 bg-purple-950 rounded-xl border border-purple-500/30">
                      {upgrade.type === 'click' ? '🪄' : upgrade.type === 'auto' ? '👻' : upgrade.type === 'stealth' ? '🗡️' : '🔥'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-xs text-orange-300">{upgrade.name}</h3>
                        <span className="text-[10px] bg-purple-900 px-1.5 py-0.5 rounded text-purple-200">Lv.{upgrade.level}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{upgrade.description}</p>
                      <div className="text-xs font-bold text-amber-300 mt-1">
                        {Math.floor(upgrade.cost).toLocaleString()} 🍬
                      </div>
                    </div>
                  </div>

                  <button 
                    disabled={!canAfford}
                    className={`py-1.5 px-3 rounded-xl font-bold text-xs whitespace-nowrap ${canAfford ? 'bg-orange-500 text-black hover:bg-orange-400' : 'bg-gray-800 text-gray-500'}`}
                  >
                    購入
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 3: RIGHT PANE (ONLINE P2P PLAYERS & OFFLINE BOTS HEIST) */}
        <div className="lg:col-span-4 bg-purple-950/50 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-md flex flex-col shadow-2xl max-h-[650px] overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-500/20">
            <h2 className="text-base font-black text-orange-400 flex items-center gap-2">
              <Users className="w-5 h-5" /> 強奪ターゲット (ハイスト)
            </h2>
            <span className="text-xs text-green-400 font-bold">P2P連動</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            
            {/* ONLINE PLAYERS SUBSECTION */}
            <div>
              <h3 className="text-xs font-bold text-green-300 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" /> オンラインプレイヤー ({onlinePlayers.length})
              </h3>
              {onlinePlayers.length === 0 ? (
                <div className="bg-black/30 border border-purple-500/20 p-3 rounded-xl text-center text-xs text-slate-400 mb-3">
                  別タブで開くとリアルタイム同期します
                </div>
              ) : (
                <div className="space-y-2 mb-3">
                  {onlinePlayers.map(player => (
                    <div key={player.id} className="bg-black/50 border border-green-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{player.avatar}</span>
                        <div>
                          <div className="font-bold text-xs text-green-300">{player.name}</div>
                          <div className="text-[10px] text-amber-400">{player.candies.toLocaleString()} 🍬</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => attemptOnlineSteal(player.id)}
                        className="py-1 px-2.5 rounded-lg font-bold bg-green-600 hover:bg-green-500 text-black text-[11px]"
                      >
                        盗む
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OFFLINE BOTS SUBSECTION */}
            <div>
              <h3 className="text-xs font-bold text-orange-300 mb-2 flex items-center gap-1.5">
                <Skull className="w-3.5 h-3.5 text-orange-400" /> オフラインBOT / ライバル ({offlineBots.length})
              </h3>
              <div className="space-y-2">
                {offlineBots.map(bot => (
                  <div key={bot.id} className="bg-black/50 border border-purple-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{bot.avatar}</span>
                      <div>
                        <div className="font-bold text-xs text-orange-300">{bot.name}</div>
                        <div className="text-[10px] text-amber-400">{bot.candies.toLocaleString()} 🍬</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => attemptBotSteal(bot.id)}
                      className="py-1 px-2.5 rounded-lg font-bold bg-orange-600 hover:bg-orange-500 text-black text-[11px]"
                    >
                      盗む
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* EVENT LOGS / TICKER AT BOTTOM */}
      <div className="max-w-7xl mx-auto px-4 mt-6 w-full">
        <div className="bg-purple-900/30 border border-purple-500/30 rounded-2xl p-4 backdrop-blur-md shadow-lg">
          <h2 className="text-xs font-bold text-orange-400 flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-orange-500" /> ハロウィン事件簿 (ログ)
          </h2>
          <div className="bg-black/50 rounded-xl p-3 border border-purple-500/20 overflow-y-auto max-h-[120px] space-y-1.5 text-xs">
            {logs.map(log => (
              <div key={log.id} className={`p-1.5 rounded-lg border ${log.type === 'success' ? 'bg-green-950/40 border-green-500/30 text-green-200' : log.type === 'fail' ? 'bg-red-950/40 border-red-500/30 text-red-200' : log.type === 'alert' ? 'bg-orange-950/40 border-orange-500/30 text-orange-200' : 'bg-purple-950/40 border-purple-500/30 text-purple-200'}`}>
                <span className="text-[10px] text-slate-400 mr-2">[{log.time}]</span>
                <span>{log.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CLEAR / RESET MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-b from-purple-950 to-slate-950 border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-slate-100">
            <button 
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-orange-400">お菓子・キャッシュのクリア</h3>
                <p className="text-xs text-purple-300">セーブデータやキャッシュをリセットします</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6 bg-black/40 p-3 rounded-xl border border-purple-500/20">
              ブラウザに保存されているお菓子残高やセーブデータを初期化できます。ご希望のクリア方法を選択してください。
            </p>

            <div className="space-y-3">
              <button
                onClick={handleClearCandiesOnly}
                className="w-full p-3.5 rounded-2xl bg-orange-950/60 hover:bg-orange-900/70 border border-orange-500/40 text-left transition-all cursor-pointer group flex items-start gap-3"
              >
                <span className="text-2xl">🍬</span>
                <div>
                  <div className="text-sm font-bold text-orange-300 group-hover:text-orange-200">
                    お菓子のみクリア (残高を0にする)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    現在の所持お菓子のみを0にします（レベルや購入したアップグレードは保持されます）。
                  </div>
                </div>
              </button>

              <button
                onClick={handleFullReset}
                className="w-full p-3.5 rounded-2xl bg-red-950/60 hover:bg-red-900/70 border border-red-500/50 text-left transition-all cursor-pointer group flex items-start gap-3"
              >
                <span className="text-2xl">💀</span>
                <div>
                  <div className="text-sm font-bold text-red-300 group-hover:text-red-200">
                    全データ・キャッシュを完全初期化
                  </div>
                  <div className="text-[11px] text-slate-400">
                    お菓子、レベル、全アップグレード、実績など、すべてのブラウザキャッシュを完全に消去します。
                  </div>
                </div>
              </button>

              <button
                onClick={() => setIsResetModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-xs font-bold text-purple-300 transition-all cursor-pointer mt-2"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto px-4 mt-8 text-center text-xs text-purple-400/60">
        Halloween Candy Heist &copy; 2026 - Cookie Clicker Inspired Layout
      </footer>

    </div>
  );
}
