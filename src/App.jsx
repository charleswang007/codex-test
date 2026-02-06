import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import horseUrl from './assets/horse.png';
import lunarUrl from './assets/lunar.mp3';
import { createInitialFightState, stepFight } from './horseFightLogic.js';

const KEY_MAP = {
  a: 'left',
  d: 'right',
  w: 'jump',
  j: 'punch',
  k: 'kick',
  l: 'block',
  A: 'left',
  D: 'right',
  W: 'jump',
  J: 'punch',
  K: 'kick',
  L: 'block',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'jump',
};

export default function App() {
  const [state, setState] = useState(() => createInitialFightState());
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef(null);
  const inputRef = useRef({
    left: false,
    right: false,
    jump: false,
    punch: false,
    kick: false,
    block: false,
  });

  const setInput = useCallback((key, value) => {
    inputRef.current[key] = value;
  }, []);

  useEffect(() => {
    let frameId;
    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      setState((prev) => {
        if (prev.status === 'READY') return prev;
        return stepFight(prev, inputRef.current, dt);
      });
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const start = useCallback(() => {
    setState((prev) => (prev.status === 'READY' ? { ...prev, status: 'RUNNING' } : prev));
    if (audioRef.current) {
      audioRef.current.muted = false;
      setIsMuted(false);
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const restart = useCallback(() => {
    setState(createInitialFightState());
  }, []);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === ' ') {
        event.preventDefault();
        start();
        return;
      }
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        restart();
        return;
      }
      const action = KEY_MAP[event.key];
      if (action) {
        event.preventDefault();
        setInput(action, true);
      }
    }

    function onKeyUp(event) {
      const action = KEY_MAP[event.key];
      if (action) {
        event.preventDefault();
        setInput(action, false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [restart, setInput, start]);

  const arenaStyle = useMemo(
    () => ({ '--horse-url': `url(${horseUrl})` }),
    []
  );

  const statusText =
    state.status === 'READY'
      ? '按空白鍵或開始鍵開打。'
      : state.status === 'GAME_OVER'
      ? `勝者：${state.winner === 'PLAYER' ? '你' : '對手'}。按 R 重新開始。`
      : '戰鬥中';

  return (
    <div className="page" style={arenaStyle}>
      <audio ref={audioRef} src={lunarUrl} loop muted={isMuted} />
      <div className="panel fight">
        <header className="header">
          <div>
            <div className="title">雙馬對決</div>
            <div className="subtitle">農曆新年版</div>
          </div>
          <div className="score">單人對 AI</div>
        </header>

        <div className="health">
          <div className="bar">
            <div className="label">你</div>
            <div className="meter">
              <div className="fill" style={{ width: `${state.player.health}%` }} />
            </div>
          </div>
          <div className="bar">
            <div className="label">對手</div>
            <div className="meter">
              <div className="fill cpu" style={{ width: `${state.cpu.health}%` }} />
            </div>
          </div>
        </div>

        <div className="arena" role="application" aria-label="Horse fight arena">
          <div className="ground" />
          <div
            className={`fighter player ${state.player.isBlocking ? 'block' : ''} ${state.player.attackType ? 'attack' : ''} ${state.player.attackType || ''}`}
            style={{
              '--x': `${state.player.x}px`,
              '--y': `${state.arena.ground - state.player.y}px`,
              '--flip': state.player.facing === 'LEFT' ? -1 : 1,
            }}
          />
          <div
            className={`fighter cpu ${state.cpu.isBlocking ? 'block' : ''} ${state.cpu.attackType ? 'attack' : ''} ${state.cpu.attackType || ''}`}
            style={{
              '--x': `${state.cpu.x}px`,
              '--y': `${state.arena.ground - state.cpu.y}px`,
              '--flip': state.cpu.facing === 'LEFT' ? -1 : 1,
            }}
          />
        </div>

        <div className="status">{statusText}</div>

        <div className="controls">
          <button type="button" onClick={start} disabled={state.status !== 'READY'}>
            開始
          </button>
          <button type="button" onClick={restart}>重新開始</button>
          <button
            type="button"
            onClick={() => {
              setIsMuted((prev) => {
                const next = !prev;
                if (audioRef.current) {
                  audioRef.current.muted = next;
                  if (!next) audioRef.current.play().catch(() => {});
                }
                return next;
              });
            }}
          >
            {isMuted ? '音樂：關' : '音樂：開'}
          </button>
        </div>

        <div className="touch-controls" aria-label="觸控操作">
          <div className="touch-row">
            <button
              type="button"
              className="touch-btn"
              onPointerDown={(e) => { e.preventDefault(); setInput('left', true); }}
              onPointerUp={(e) => { e.preventDefault(); setInput('left', false); }}
              onPointerLeave={() => setInput('left', false)}
              aria-label="左"
            >
              左
            </button>
            <button
              type="button"
              className="touch-btn"
              onPointerDown={(e) => { e.preventDefault(); setInput('right', true); }}
              onPointerUp={(e) => { e.preventDefault(); setInput('right', false); }}
              onPointerLeave={() => setInput('right', false)}
              aria-label="右"
            >
              右
            </button>
            <button
              type="button"
              className="touch-btn"
              onPointerDown={(e) => { e.preventDefault(); setInput('jump', true); }}
              onPointerUp={(e) => { e.preventDefault(); setInput('jump', false); }}
              onPointerLeave={() => setInput('jump', false)}
              aria-label="跳"
            >
              跳
            </button>
          </div>
          <div className="touch-row">
            <button
              type="button"
              className="touch-btn attack"
              onPointerDown={(e) => { e.preventDefault(); setInput('punch', true); }}
              onPointerUp={(e) => { e.preventDefault(); setInput('punch', false); }}
              onPointerLeave={() => setInput('punch', false)}
              aria-label="出拳"
            >
              出拳
            </button>
            <button
              type="button"
              className="touch-btn attack"
              onPointerDown={(e) => { e.preventDefault(); setInput('kick', true); }}
              onPointerUp={(e) => { e.preventDefault(); setInput('kick', false); }}
              onPointerLeave={() => setInput('kick', false)}
              aria-label="踢擊"
            >
              踢擊
            </button>
            <button
              type="button"
              className="touch-btn block"
              onPointerDown={(e) => { e.preventDefault(); setInput('block', true); }}
              onPointerUp={(e) => { e.preventDefault(); setInput('block', false); }}
              onPointerLeave={() => setInput('block', false)}
              aria-label="防禦"
            >
              防禦
            </button>
          </div>
        </div>

        <div className="hint">
          操作：A/D 移動、W 跳、J 出拳、K 踢擊、L 防禦。方向鍵也可移動/跳。空白鍵開始，R 重新開始。音樂可在上方開關。
        </div>
      </div>
    </div>
  );
}
