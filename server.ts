import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  interface OnlinePlayer {
    id: string;
    name: string;
    avatar: string;
    candies: number;
    level: number;
    ws: WebSocket;
    isAlive: boolean;
  }

  const players = new Map<string, OnlinePlayer>();

  // Ping interval to keep WebSocket connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws: any) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    let playerId = '';

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'join') {
          playerId = data.id || Math.random().toString(36).substring(7);
          players.set(playerId, {
            id: playerId,
            name: data.name || `お菓子泥棒_${Math.floor(Math.random() * 900 + 100)}`,
            avatar: data.avatar || 'pumpkin',
            candies: data.candies ?? 50,
            level: data.level ?? 1,
            ws,
            isAlive: true
          });
          broadcastPlayers();
        } else if (data.type === 'update') {
          const p = players.get(playerId);
          if (p) {
            p.candies = data.candies;
            p.level = data.level;
            broadcastPlayers();
          }
        } else if (data.type === 'gift') {
          const sender = players.get(playerId);
          const target = players.get(data.targetId);
          const amount = Math.floor(Number(data.amount));

          if (!sender || !target || target.id === sender.id) {
            ws.send(JSON.stringify({ type: 'gift_result', success: false, message: '相手が見つかりません' }));
          } else if (!Number.isFinite(amount) || amount <= 0 || amount > sender.candies) {
            ws.send(JSON.stringify({ type: 'gift_result', success: false, message: 'お菓子の数が正しくありません' }));
          } else {
            sender.candies -= amount;
            target.candies += amount;
            broadcastPlayers();

            ws.send(JSON.stringify({
              type: 'gift_result',
              success: true,
              targetName: target.name,
              amount
            }));

            if (target.ws.readyState === WebSocket.OPEN) {
              target.ws.send(JSON.stringify({
                type: 'gift_received',
                senderName: sender.name,
                amount
              }));
            }
          }
        } else if (data.type === 'steal_attempt') {
          const targetId = data.targetId;
          const thief = players.get(playerId);
          const target = players.get(targetId);

          if (thief && target && target.candies > 10) {
            const stolen = Math.floor(target.candies * 0.25);
            target.candies -= stolen;
            thief.candies += stolen;

            broadcastPlayers();
            
            ws.send(JSON.stringify({
              type: 'steal_result',
              success: true,
              targetName: target.name,
              stolen
            }));

            if (target.ws.readyState === WebSocket.OPEN) {
              target.ws.send(JSON.stringify({
                type: 'robbed_alert',
                thiefName: thief.name,
                stolen
              }));
            }
          } else {
            ws.send(JSON.stringify({
              type: 'steal_result',
              success: false,
              message: 'ターゲットのお菓子が少なすぎます！'
            }));
          }
        }
      } catch (e) {
        console.error('WS message error:', e);
      }
    });

    ws.on('close', () => {
      if (playerId) {
        players.delete(playerId);
        broadcastPlayers();
      }
    });
  });

  function broadcastPlayers() {
    const playerList = Array.from(players.values()).map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      candies: p.candies,
      level: p.level
    }));

    const payload = JSON.stringify({ type: 'player_list', players: playerList });
    for (const p of players.values()) {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(payload);
      }
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
