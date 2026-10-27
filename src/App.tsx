/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Skull, Ghost, Flame, Shield, Award, Zap, 
  Volume2, VolumeX, RefreshCw, Trophy, ShoppingBag, 
  Users, TrendingUp, AlertCircle, CheckCircle2, CloudRain,
  RotateCcw, Trash2, X, AlertTriangle, Wifi, WifiOff
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

interface HistoryPoint {
  time: string;
  candies: number;
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

export default function App() {
  // --- STATE ---
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
  const [activeTab, setActiveTab] = useState<'pump' | 'online' | 'shop' | 'achievements'>('pump');
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Floating & Rain
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [rainDrops, setRainDrops] = useState<RainDrop[]>([]);
  const [isPumpActive, setIsPumpActive] = useState<boolean>(false);

  // My Player Info for WebSocket
  const [myId] = useState<string>(() => getUniqueId());
  const [myName] = useState<string>(() => `お菓子泥棒_${Math.floor(Math.random() * 900 + 100)}`);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [offlineBots, setOfflineBots] = useState<BotRival[]>(OFFLINE_BOTS);
  const wsRef = useRef<WebSocket | null>(null);

  // History for Graph
  const [history, setHistory] = useState<HistoryPoint[]>([
    { time: '0s', candies: 50 }
  ]);

  // Upgrades State
  const [upgrades, setUpgrades] = useState<Upgrade[]>(() => {
    const saved = localStorage.getItem('hw_upgrades');
    return saved ? JSON.parse(saved) : DEFAULT_UPGRADES;
  });

  // Calculate derived values from upgrades
  const clickPower = 1 + upgrades.reduce((acc, u) => acc + (u.type === 'click' ? u.cpc * u.level : 0), 0);
  const autoCps = upgrades.reduce((acc, u) => acc + ((u.type === 'auto' || u.type === 'special') ? u.cps * u.level : 0), 0);
  const stealthSkill = 1 + upgrades.reduce((acc, u) => acc + (u.type === 'stealth' ? 0.5 * u.level : 0), 0);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: getUniqueId(), time: '今さっき', text: 'マルチプレイヤー・ハロウィンハイストへようこそ！オンラインプレイヤーやオフラインBOTからキャンディを盗み出せ！', type: 'info' }
  ]);

  // Achievements
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

  // --- WEBSOCKET CONNECTION ---
  useEffect(() => {
    let reconnectTimeout: any = null;

    const connectWs = () => {
      setWsStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      
      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setWsStatus('connected');
          socket.send(JSON.stringify({
            type: 'join',
            id: myId,
            name: myName,
            avatar: '🎃',
            candies: Math.floor(candies),
            level: playerLevel
          }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'player_list') {
              const others = data.players.filter((p: OnlinePlayer) => p.id !== myId);
              setOnlinePlayers(others);
            } else if (data.type === 'steal_result') {
              if (data.success) {
                setCandies(c => c + data.stolen);
                setTotalCandiesEarned(t => t + data.stolen);
                playSound('steal');
                addLog(`🦹‍♂️ オンライン強奪成功！ ${data.targetName} から ${data.stolen.toLocaleString()}個 のお菓子をスリ取った！`, 'success');
              } else {
                addLog(`💥 強奪失敗: ${data.message}`, 'fail');
              }
            } else if (data.type === 'robbed_alert') {
              setCandies(c => Math.max(0, c - data.stolen));
              playSound('fail');
              addLog(`🚨 警告！ ${data.thiefName} にあなたのお菓子が ${data.stolen.toLocaleString()}個 盗まれました！`, 'alert');
            }
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };

        socket.onerror = () => {
          setWsStatus('disconnected');
        };

        socket.onclose = () => {
          setWsStatus('disconnected');
          reconnectTimeout = setTimeout(connectWs, 3000);
        };
      } catch (e) {
        setWsStatus('disconnected');
        reconnectTimeout = setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [myId]);

  // Sync state with server periodically
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update',
        candies: Math.floor(candies),
        level: playerLevel
      }));
    }
  }, [candies, playerLevel]);

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

  // --- GAME TICK & GRAPH HISTORY ---
  useEffect(() => {
    const timer = setInterval(() => {
      if (autoCps > 0) {
        const gained = autoCps / 10;
        setCandies(prev => prev + gained);
        setTotalCandiesEarned(prev => prev + gained);
      }
    }, 100);

    const graphTimer = setInterval(() => {
      setHistory(prev => {
        const newPoint = { time: `${Math.floor(Date.now() / 1000) % 60}s`, candies: Math.floor(candies) };
        return [...prev.slice(-12), newPoint];
      });
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(graphTimer);
    };
  }, [autoCps, candies]);

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
    addLog(`🎉 プレイヤーレベルが Lv.${playerLevel + 1} に昇格！タッピングとハイスト効率がアップ！`, 'success');
  };

  // --- STEAL ACTIONS (ONLINE OR BOT) ---
  const attemptOnlineSteal = (targetId: string) => {
    setHeistCount(prev => prev + 1);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'steal_attempt',
        targetId
      }));
    } else {
      addLog(`⚠️ サーバーとの接続が切断されています。`, 'alert');
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
    setHistory([{ time: '0s', candies: 50 }]);
    setClickCount(0);
    setHeistCount(0);
    setRainDrops([]);
    setFloatingTexts([]);

    playSound('fail');
    addLog('⚠️ 全セーブデータ・キャッシュを完全初期化しました。新しいゲームを開始します！', 'alert');
    setIsResetModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-slate-950 to-black text-slate-100 font-sans pb-16 select-none overflow-x-hidden relative">
      
      {/* CANDY RAIN / SPOOKY RAIN EFFECT */}
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

      {/* HEADER */}
      <header className="bg-purple-950/80 backdrop-blur-md border-b border-orange-500/30 sticky top-0 z-40 px-4 py-3 shadow-lg shadow-orange-950/20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/50 animate-pulse">
              <Skull className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent flex items-center gap-2">
                🎃 Candy Heist Online
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-purple-300">{myName} (Lv.{playerLevel})</p>
                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${wsStatus === 'connected' ? 'bg-green-950/60 text-green-300 border-green-500/30' : 'bg-amber-950/60 text-amber-300 border-amber-500/30'}`}>
                  {wsStatus === 'connected' ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
                  {wsStatus === 'connected' ? 'オンライン' : '切断中・再接続中'}
                </span>
              </div>
            </div>
          </div>

          {/* STATS COUNTERS */}
          <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-2xl border border-purple-500/30">
            <div className="flex items-center gap-1.5">
              <span className="text-xl">🍬</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-purple-300">お菓子数</span>
                  <button 
                    onClick={() => setIsResetModalOpen(true)}
                    className="text-[10px] text-orange-400/80 hover:text-orange-300 underline cursor-pointer"
                  >
                    クリア
                  </button>
                </div>
                <div className="text-base md:text-lg font-black text-orange-400">{Math.floor(candies).toLocaleString()}</div>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-purple-500/30" />
            <div className="flex items-center gap-1.5">
              <span className="text-xl">⚡</span>
              <div>
                <div className="text-xs text-purple-300">自動生産</div>
                <div className="text-sm md:text-base font-bold text-amber-300">{autoCps.toFixed(1)} /秒</div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsResetModalOpen(true)}
              className="p-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-500/40 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shadow-md shadow-red-950/40"
              title="お菓子やキャッシュをクリア"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span className="hidden md:inline">キャッシュ消去</span>
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

      {/* NAVIGATION TABS */}
      <nav className="max-w-4xl mx-auto px-4 mt-4">
        <div className="grid grid-cols-4 gap-2 bg-purple-950/60 p-1.5 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('pump')}
            className={`py-2 px-2 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${activeTab === 'pump' ? 'bg-orange-600 text-black shadow-lg shadow-orange-600/30' : 'text-purple-300 hover:bg-purple-900/50'}`}
          >
            <span>🎃</span> <span>カボチャ</span>
          </button>
          <button 
            onClick={() => setActiveTab('online')}
            className={`py-2 px-2 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${activeTab === 'online' ? 'bg-orange-600 text-black shadow-lg shadow-orange-600/30' : 'text-purple-300 hover:bg-purple-900/50'}`}
          >
            <span>🌐</span> <span>強奪 ({onlinePlayers.length + offlineBots.length})</span>
          </button>
          <button 
            onClick={() => setActiveTab('shop')}
            className={`py-2 px-2 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${activeTab === 'shop' ? 'bg-orange-600 text-black shadow-lg shadow-orange-600/30' : 'text-purple-300 hover:bg-purple-900/50'}`}
          >
            <span>🛍️</span> <span>ショップ</span>
          </button>
          <button 
            onClick={() => setActiveTab('achievements')}
            className={`py-2 px-2 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${activeTab === 'achievements' ? 'bg-orange-600 text-black shadow-lg shadow-orange-600/30' : 'text-purple-300 hover:bg-purple-900/50'}`}
          >
            <span>🏆</span> <span>実績</span>
          </button>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        
        {/* TAB 1: PUMPKIN & GRAPH & LEVEL */}
        {activeTab === 'pump' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* LEVEL UP PANEL */}
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-3xl p-5 backdrop-blur-md flex flex-col justify-between shadow-xl">
                <div>
                  <h2 className="text-base font-bold text-orange-400 flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5" /> プレイヤーレベル (調整済)
                  </h2>
                  <div className="bg-black/40 p-4 rounded-2xl border border-purple-500/20 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-purple-300">現在のレベル</span>
                      <span className="text-xl font-black text-amber-300">Lv. {playerLevel}</span>
                    </div>
                    <div className="text-xs text-slate-400 mb-3">
                      タップ効率: <span className="text-orange-400 font-bold">+{(clickPower * (1 + (playerLevel - 1) * 0.05)).toFixed(1)}</span> / 回
                    </div>
                    <button 
                      onClick={handleLevelUp}
                      disabled={candies < levelUpCost}
                      className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${candies >= levelUpCost ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:opacity-90 shadow-lg shadow-orange-500/30' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                    >
                      <Sparkles className="w-4 h-4" /> 昇格する ({levelUpCost.toLocaleString()} 🍬)
                    </button>
                  </div>
                </div>

                <div className="bg-purple-950/60 p-4 rounded-2xl border border-purple-500/20 text-xs text-purple-300 leading-relaxed">
                  💡 カボチャをクリックすると、お菓子の雨が飛び出します！強奪タブからオンラインユーザーやオフラインBOTを襲ってキャンディを奪い取ろう！
                </div>
              </div>

              {/* CENTER: PUMPKIN CLICKER WITH RAIN */}
              <div className="bg-purple-900/20 border border-orange-500/30 rounded-3xl p-6 backdrop-blur-md flex flex-col items-center justify-center shadow-2xl relative overflow-hidden min-h-[360px]">
                <div className="absolute top-4 text-center">
                  <span className="text-xs uppercase tracking-widest text-orange-400/80 font-bold">ジャック・オー・ランタン</span>
                  <p className="text-xs text-purple-300">クリックでお菓子が飛び出す！</p>
                </div>

                <div 
                  onClick={handlePumpkinClick}
                  onTouchStart={handlePumpkinClick}
                  className={`cursor-pointer transition-transform duration-100 select-none relative my-8 group ${isPumpActive ? 'scale-90 rotate-3' : 'hover:scale-105 active:scale-95'}`}
                >
                  <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-2xl group-hover:bg-orange-500/50 transition-all" />
                  <div className="relative text-8xl md:text-9xl filter drop-shadow-[0_10px_15px_rgba(255,117,24,0.4)] animate-bounce-slow">
                    🎃
                  </div>
                </div>

                <div className="text-xs text-slate-400 text-center bg-black/50 px-4 py-1.5 rounded-full border border-purple-500/20">
                  クリック威力: <span className="text-orange-400 font-bold">+{clickPower}</span> 🍬
                </div>
              </div>

              {/* EVENT LOGS */}
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-3xl p-5 backdrop-blur-md flex flex-col shadow-xl">
                <h2 className="text-base font-bold text-orange-400 flex items-center gap-2 mb-3">
                  <Flame className="w-5 h-5 text-orange-500" /> ハロウィン事件簿
                </h2>
                <div className="flex-1 bg-black/50 rounded-2xl p-3 border border-purple-500/20 overflow-y-auto max-h-[280px] space-y-2 text-xs">
                  {logs.map(log => (
                    <div key={log.id} className={`p-2 rounded-xl border ${log.type === 'success' ? 'bg-green-950/40 border-green-500/30 text-green-200' : log.type === 'fail' ? 'bg-red-950/40 border-red-500/30 text-red-200' : log.type === 'alert' ? 'bg-orange-950/40 border-orange-500/30 text-orange-200' : 'bg-purple-950/40 border-purple-500/30 text-purple-200'}`}>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>{log.time}</span>
                      </div>
                      <div>{log.text}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* CANDY GROWTH GRAPH */}
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-md shadow-xl">
              <h2 className="text-base font-bold text-orange-400 flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" /> キャンディ成長の軌跡 (リアルタイムグラフ)
              </h2>
              <p className="text-xs text-purple-300 mb-4">時間の経過とともにキャンディがどれくらい増えているかを視覚化しています。</p>

              <div className="bg-black/50 p-4 rounded-2xl border border-purple-500/25 h-48 relative flex items-end">
                {history.length > 1 ? (
                  <svg className="w-full h-full overflow-visible">
                    <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#4a1d96" strokeDasharray="4" strokeWidth="1" />
                    <line x1="0" y1="60%" x2="100%" y2="60%" stroke="#4a1d96" strokeDasharray="4" strokeWidth="1" />
                    
                    {(() => {
                      const maxVal = Math.max(...history.map(h => h.candies), 100);
                      const minVal = Math.min(...history.map(h => h.candies), 0);
                      const range = maxVal - minVal || 1;
                      const points = history.map((h, idx) => {
                        const x = (idx / (history.length - 1)) * 100;
                        const y = 100 - ((h.candies - minVal) / range) * 80 - 10;
                        return `${x}% ${y}%`;
                      }).join(', ');

                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#ff9933"
                            strokeWidth="3"
                            points={points}
                            className="transition-all duration-300"
                          />
                          {history.map((h, idx) => {
                            const x = (idx / (history.length - 1)) * 100;
                            const y = 100 - ((h.candies - minVal) / range) * 80 - 10;
                            return (
                              <circle
                                key={idx}
                                cx={`${x}%`}
                                cy={`${y}%`}
                                r="4"
                                fill="#fbbf24"
                                className="transition-all duration-300"
                              />
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <div className="w-full text-center text-xs text-purple-400">データを収集中...</div>
                )}
              </div>
              <div className="flex justify-between text-[11px] text-purple-400 mt-2 px-1">
                <span>過去の推移</span>
                <span className="font-bold text-orange-400">現在: {Math.floor(candies).toLocaleString()} 🍬</span>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ONLINE PLAYERS & OFFLINE BOTS (SEPARATE SECTIONS) */}
        {activeTab === 'online' && (
          <div className="space-y-8">
            
            {/* SECTION 1: REAL ONLINE PLAYERS */}
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-black text-orange-400 flex items-center gap-2">
                    <Users className="w-6 h-6 text-green-400" /> 🌐 オンラインプレイヤー (リアルタイム)
                  </h2>
                  <p className="text-xs text-purple-300">同じ世界に接続している実際のプレイヤーたちです。</p>
                </div>
                <div className="bg-black/50 px-3 py-1.5 rounded-xl border border-purple-500/30 text-xs text-amber-300 flex items-center gap-2">
                  <span>状態:</span>
                  <span className={wsStatus === 'connected' ? 'text-green-400 font-bold' : 'text-amber-400 font-bold'}>
                    {wsStatus === 'connected' ? '接続中' : '接続待機中'}
                  </span>
                </div>
              </div>

              {onlinePlayers.length === 0 ? (
                <div className="bg-black/40 border border-purple-500/30 p-8 rounded-2xl text-center text-purple-300">
                  <Ghost className="w-10 h-10 mx-auto mb-2 opacity-50 animate-bounce" />
                  <p className="text-sm font-bold mb-1">現在オンラインの他のプレイヤーはいません</p>
                  <p className="text-xs text-slate-400">別のタブやブラウザでこのアプリを開くと、ここにリアルプレイヤーが表示されます。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {onlinePlayers.map(player => (
                    <div key={player.id} className="bg-black/40 border border-green-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-green-500/60 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl p-2 bg-purple-950 rounded-2xl border border-purple-500/30">
                          {player.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-green-300">{player.name}</h3>
                            <span className="text-[10px] bg-green-950 text-green-300 px-1.5 py-0.5 rounded border border-green-500/40">オンライン</span>
                          </div>
                          <p className="text-xs text-purple-300">Lv.{player.level} プレイヤー</p>
                          <p className="text-xs font-bold text-amber-400 mt-1">
                            所持: {player.candies.toLocaleString()} 🍬
                          </p>
                        </div>
                      </div>

                      <button 
                        onClick={() => attemptOnlineSteal(player.id)}
                        className="py-2 px-4 rounded-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-black text-xs md:text-sm shadow-lg shadow-green-600/30 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                      >
                        🦹‍♂️ 盗む
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: OFFLINE BOTS / RIVALS */}
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-black text-orange-400 flex items-center gap-2">
                    <Skull className="w-6 h-6 text-orange-400" /> 👻 オフラインBOT / ハロウィンライバル
                  </h2>
                  <p className="text-xs text-purple-300">いつでも対戦・強奪できる強力なオフラインキャラクターたちです。</p>
                </div>
                <div className="bg-black/50 px-3 py-1.5 rounded-xl border border-purple-500/30 text-xs text-amber-300">
                  常時稼働
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offlineBots.map(bot => (
                  <div key={bot.id} className="bg-black/40 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-orange-500/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl p-2 bg-purple-950 rounded-2xl border border-purple-500/30">
                        {bot.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-orange-300">{bot.name}</h3>
                          <span className="text-[10px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/40">BOT</span>
                        </div>
                        <p className="text-xs text-purple-300">Lv.{bot.level} ライバル</p>
                        <p className="text-xs font-bold text-amber-400 mt-1">
                          所持: {bot.candies.toLocaleString()} 🍬
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => attemptBotSteal(bot.id)}
                      className="py-2 px-4 rounded-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-black text-xs md:text-sm shadow-lg shadow-orange-600/30 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                      🦹‍♂️ 盗む
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: SHOP */}
        {activeTab === 'shop' && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
            <h2 className="text-xl font-black text-orange-400 flex items-center gap-2 mb-2">
              <ShoppingBag className="w-6 h-6" /> ハロウィンショップ
            </h2>
            <p className="text-xs text-purple-300 mb-6">お菓子を消費して、クリックパワーや自動生産を強化しよう！</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upgrades.map(upgrade => {
                const canAfford = candies >= upgrade.cost;
                return (
                  <div key={upgrade.id} className="bg-black/40 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-orange-500/50 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {upgrade.type === 'click' ? '🪄' : upgrade.type === 'auto' ? '👻' : upgrade.type === 'stealth' ? '🗡️' : '🔥'}
                        </span>
                        <h3 className="font-bold text-sm text-orange-300">{upgrade.name}</h3>
                        <span className="text-xs bg-purple-950 px-2 py-0.5 rounded-full border border-purple-500/30 text-purple-300">Lv.{upgrade.level}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{upgrade.description}</p>
                      <div className="text-xs font-bold text-amber-300">
                        価格: <span className="text-orange-400">{Math.floor(upgrade.cost).toLocaleString()} 🍬</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => buyUpgrade(upgrade.id)}
                      disabled={!canAfford}
                      className={`py-2 px-4 rounded-xl font-bold text-xs md:text-sm whitespace-nowrap transition-all cursor-pointer ${canAfford ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:opacity-90 shadow-lg shadow-orange-500/30' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                    >
                      購入
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ACHIEVEMENTS */}
        {activeTab === 'achievements' && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
            <h2 className="text-xl font-black text-orange-400 flex items-center gap-2 mb-2">
              <Trophy className="w-6 h-6" /> 実績一覧
            </h2>
            <p className="text-xs text-purple-300 mb-6">条件を達成してお菓子ボーナスをゲットしよう！</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map(ach => (
                <div key={ach.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${ach.unlocked ? 'bg-purple-950/60 border-orange-500/40 text-purple-100' : 'bg-black/30 border-purple-500/20 text-slate-500 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl p-2 rounded-xl ${ach.unlocked ? 'bg-orange-600/20 border border-orange-500/40' : 'bg-gray-800'}`}>
                      {ach.unlocked ? '🏆' : '🔒'}
                    </div>
                    <div>
                      <h3 className={`font-bold text-sm ${ach.unlocked ? 'text-orange-300' : 'text-slate-400'}`}>{ach.title}</h3>
                      <p className="text-xs text-slate-400">{ach.description}</p>
                      <div className="text-xs text-amber-400 mt-1 font-bold">報酬: +{ach.reward} 🍬</div>
                    </div>
                  </div>

                  <div>
                    {ach.unlocked ? (
                      <span className="text-xs bg-green-950 text-green-300 px-3 py-1 rounded-full border border-green-500/30 font-bold">達成済</span>
                    ) : (
                      <span className="text-xs bg-gray-900 text-gray-400 px-3 py-1 rounded-full border border-gray-700">未達成</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* CLEAR / RESET MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-b from-purple-950 to-slate-950 border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-slate-100">
            <button 
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
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

      <footer className="max-w-4xl mx-auto px-4 mt-12 text-center text-xs text-purple-400/60">
        Halloween Candy Heist Online &copy; 2026 - P2P Multiplayer Clicker
      </footer>

    </div>
  );
}
