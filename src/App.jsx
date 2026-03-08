import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Heart,
  AlertTriangle,
  Activity,
  Wind,
  Shield,
  ChevronRight,
  X,
  Zap,
  Timer,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────
   GAME STATE & FORMULA
   Game Stress Index = (Inning/9) * (RunnersOnBase + 1) / (ScoreDiff + 1)
   ──────────────────────────────────────────────────────────── */
const GAME = {
  home: { abbr: 'TPE', name: '台灣', score: 5, color: '#004B97' },
  away: { abbr: 'KOR', name: '韓國', score: 4, color: '#C60C30' },
  inning: 9,
  half: 'TOP',
  outs: 2,
  bases: [true, true, true], // 1B, 2B, 3B — loaded
};

function calcStressIndex(inning, runnersOnBase, scoreDiff) {
  return ((inning / 9) * (runnersOnBase + 1)) / (scoreDiff + 1);
}

/* ────── constants ────── */
const NORMAL_HR = 78;
const HIGH_HR = 128;
const HR_THRESHOLD = 110;
const BREATHING_DURATION = 30; // seconds

/* ================================================================
   MAIN APP
   ================================================================ */
export default function App() {
  const [screen, setScreen] = useState('dashboard'); // dashboard | breathing
  const [isHighStress, setIsHighStress] = useState(false);
  const [heartRate, setHeartRate] = useState(NORMAL_HR);
  const [showAlert, setShowAlert] = useState(false);
  const [medConfirmed, setMedConfirmed] = useState(false);
  const [stressIndex, setStressIndex] = useState(0);

  // Calculate stress index
  useEffect(() => {
    const runners = GAME.bases.filter(Boolean).length;
    const scoreDiff = Math.abs(GAME.home.score - GAME.away.score);
    if (isHighStress) {
      setStressIndex(calcStressIndex(GAME.inning, runners, scoreDiff));
    } else {
      setStressIndex(calcStressIndex(3, 0, 4)); // low-stress baseline: 3rd inning, no runners, big lead
    }
  }, [isHighStress]);

  // Simulate heart rate changes
  useEffect(() => {
    const target = isHighStress ? HIGH_HR : NORMAL_HR;
    const interval = setInterval(() => {
      setHeartRate((prev) => {
        const jitter = (Math.random() - 0.5) * 6;
        const diff = target - prev;
        const step = diff * 0.08 + jitter;
        const next = Math.round(prev + step);
        return Math.max(55, Math.min(160, next));
      });
    }, 300);
    return () => clearInterval(interval);
  }, [isHighStress]);

  // Trigger alert overlay when HR exceeds threshold during high stress
  useEffect(() => {
    if (isHighStress && heartRate > HR_THRESHOLD && !medConfirmed) {
      setShowAlert(true);
    }
  }, [heartRate, isHighStress, medConfirmed]);

  const handleSimulate = () => {
    if (isHighStress) {
      // Reset
      setIsHighStress(false);
      setShowAlert(false);
      setMedConfirmed(false);
    } else {
      setIsHighStress(true);
      setMedConfirmed(false);
    }
  };

  const handleMedConfirm = () => {
    setMedConfirmed(true);
    setTimeout(() => setShowAlert(false), 600);
  };

  const handleBreathingComplete = () => {
    setScreen('dashboard');
    setIsHighStress(false);
    setShowAlert(false);
    setMedConfirmed(false);
  };

  return (
    <div className="min-h-screen bg-dark-base flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] min-h-[780px] bg-dark-card rounded-[32px] overflow-hidden relative shadow-2xl border border-white/5">
        {/* Status bar */}
        <StatusBar />

        {/* Content */}
        <AnimatePresence mode="wait">
          {screen === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="px-5 pb-6"
            >
              <Dashboard
                heartRate={heartRate}
                stressIndex={stressIndex}
                isHighStress={isHighStress}
                onSimulate={handleSimulate}
              />
            </motion.div>
          ) : (
            <motion.div
              key="breathing"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.3 }}
            >
              <BreathingGuide onComplete={handleBreathingComplete} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emergency Alert Overlay */}
        <AnimatePresence>
          {showAlert && screen === 'dashboard' && (
            <EmergencyOverlay
              heartRate={heartRate}
              onMedConfirm={handleMedConfirm}
              medConfirmed={medConfirmed}
              onBreathing={() => {
                setShowAlert(false);
                setScreen('breathing');
              }}
              onDismiss={() => setShowAlert(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ================================================================
   STATUS BAR (iOS-style)
   ================================================================ */
function StatusBar() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      );
    };
    update();
    const i = setInterval(update, 30000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex items-center justify-between px-7 pt-4 pb-2">
      <span className="text-sm font-semibold text-cream">{time}</span>
      <div className="flex items-center gap-1">
        <Shield className="w-4 h-4 text-grass-500" />
        <span className="text-xs font-bold text-grass-400 tracking-wide">血壓天使</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[3px] rounded-full bg-cream/80" style={{ height: 4 + i * 2 }} />
          ))}
        </div>
        <div className="w-6 h-3 border border-cream/60 rounded-sm relative ml-1">
          <div className="absolute inset-[1px] bg-safe-green rounded-[1px]" style={{ width: '75%' }} />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SCREEN 1: DASHBOARD
   ================================================================ */
function Dashboard({ heartRate, stressIndex, isHighStress, onSimulate }) {
  const stressPercent = Math.min(stressIndex / 4, 1) * 100;
  const stressLabel = stressPercent > 75 ? 'CRITICAL' : stressPercent > 40 ? 'ELEVATED' : 'NORMAL';
  const stressColor =
    stressPercent > 75 ? 'text-alert-red' : stressPercent > 40 ? 'text-dirt-400' : 'text-safe-green';
  const hrColor = heartRate > HR_THRESHOLD ? 'text-alert-red' : 'text-safe-green';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center pt-1 pb-2">
        <h1 className="text-lg font-bold text-cream tracking-tight flex items-center justify-center gap-2">
          <Activity className="w-5 h-5 text-grass-400" />
          Live Game Monitor
        </h1>
        <p className="text-xs text-cream/40 mt-0.5">Real-time cardiac stress analysis</p>
      </div>

      {/* Scoreboard */}
      <Scoreboard />

      {/* Heart Rate */}
      <div className="ios-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-cream/50 uppercase tracking-wider font-medium mb-1">Heart Rate</p>
            <div className="flex items-baseline gap-2">
              <motion.span
                key={heartRate}
                initial={{ scale: 1.1, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-5xl font-bold tabular-nums ${hrColor}`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {heartRate}
              </motion.span>
              <span className="text-sm text-cream/40">bpm</span>
            </div>
          </div>
          <div className="relative">
            <Heart
              className={`w-14 h-14 ${hrColor} ${heartRate > HR_THRESHOLD ? 'heartbeat-fast' : 'heartbeat'}`}
              fill="currentColor"
              strokeWidth={1}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: heartRate > HR_THRESHOLD
                  ? ['0 0 0px rgba(220,38,38,0)', '0 0 30px rgba(220,38,38,0.4)', '0 0 0px rgba(220,38,38,0)']
                  : ['0 0 0px rgba(34,197,94,0)', '0 0 20px rgba(34,197,94,0.2)', '0 0 0px rgba(34,197,94,0)'],
              }}
              transition={{ duration: heartRate > HR_THRESHOLD ? 0.5 : 1, repeat: Infinity }}
            />
          </div>
        </div>
        {/* ECG line */}
        <ECGLine isHighStress={isHighStress} />
      </div>

      {/* Stress Meter */}
      <div className={`ios-card p-4 ${stressPercent > 75 ? 'stress-glow' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${stressColor}`} />
            <p className="text-xs text-cream/50 uppercase tracking-wider font-medium">Game Stress Index</p>
          </div>
          <span className={`text-xs font-bold ${stressColor} tracking-wide`}>{stressLabel}</span>
        </div>
        <div className="w-full h-3 bg-dark-base rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                stressPercent > 75
                  ? 'linear-gradient(90deg, #DC2626, #EF4444)'
                  : stressPercent > 40
                    ? 'linear-gradient(90deg, #8B6914, #C09030)'
                    : 'linear-gradient(90deg, #22C55E, #4ADE80)',
            }}
            animate={{ width: `${stressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-cream/30">0</span>
          <span className="text-xs text-cream/50 font-mono">{stressIndex.toFixed(2)}</span>
          <span className="text-[10px] text-cream/30">4.0</span>
        </div>
      </div>

      {/* Simulate Button */}
      <motion.button
        onClick={onSimulate}
        whileTap={{ scale: 0.96 }}
        className={`w-full py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all duration-300 ${isHighStress
            ? 'bg-cream/10 text-cream/80 border border-cream/20'
            : 'bg-gradient-to-r from-alert-red to-red-500 text-white shadow-lg hover:shadow-red-500/25'
          }`}
      >
        {isHighStress ? (
          <span className="flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" /> Reset Simulation
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" /> Simulate High Stress
          </span>
        )}
      </motion.button>
    </div>
  );
}

/* ================================================================
   SCOREBOARD (retro LED style)
   ================================================================ */
function Scoreboard() {
  return (
    <div className="ios-card overflow-hidden">
      {/* Header bar */}
      <div className="bg-grass-800/80 px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] text-cream/60 uppercase tracking-widest font-medium">⚾ Live</span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-alert-red alert-flash" />
          <span className="text-[10px] text-cream/60 uppercase tracking-wider">Top 9th</span>
        </div>
      </div>

      {/* Scores */}
      <div className="p-4 bg-gradient-to-b from-grass-900/50 to-transparent">
        <div className="flex items-center justify-between">
          {/* Away team */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white"
              style={{ backgroundColor: GAME.away.color }}
            >
              {GAME.away.abbr}
            </div>
            <div>
              <p className="text-xs text-cream/40">{GAME.away.name}</p>
              <p className="text-3xl font-black text-cream led-text" style={{ fontFamily: 'var(--font-score)' }}>
                {GAME.away.score}
              </p>
            </div>
          </div>

          {/* VS / Inning Info */}
          <div className="text-center space-y-1">
            <span className="text-cream/20 text-xs font-medium">VS</span>
            {/* Base diamond */}
            <BaseDiamond bases={GAME.bases} />
          </div>

          {/* Home team */}
          <div className="flex items-center gap-3 flex-row-reverse">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white"
              style={{ backgroundColor: GAME.home.color }}
            >
              {GAME.home.abbr}
            </div>
            <div className="text-right">
              <p className="text-xs text-cream/40">{GAME.home.name}</p>
              <p className="text-3xl font-black text-cream led-text" style={{ fontFamily: 'var(--font-score)' }}>
                {GAME.home.score}
              </p>
            </div>
          </div>
        </div>

        {/* Outs */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-cream/5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-cream/40 uppercase tracking-wider">Outs</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${i < GAME.outs ? 'bg-dirt-400' : 'bg-cream/10'}`}
                />
              ))}
            </div>
          </div>
          <div className="w-px h-3 bg-cream/10" />
          <span className="text-[10px] text-dirt-400 font-semibold uppercase tracking-wider">Bases Loaded</span>
        </div>
      </div>
    </div>
  );
}

/* ────── Base Diamond ────── */
function BaseDiamond({ bases }) {
  return (
    <div className="relative w-10 h-10">
      {/* 2B — top */}
      <div
        className={`diamond absolute w-3 h-3 top-0 left-1/2 -translate-x-1/2 rounded-[1px] ${bases[1] ? 'bg-dirt-400' : 'bg-cream/15'}`}
      />
      {/* 3B — left */}
      <div
        className={`diamond absolute w-3 h-3 top-1/2 left-0 -translate-y-1/2 rounded-[1px] ${bases[2] ? 'bg-dirt-400' : 'bg-cream/15'}`}
      />
      {/* 1B — right */}
      <div
        className={`diamond absolute w-3 h-3 top-1/2 right-0 -translate-y-1/2 rounded-[1px] ${bases[0] ? 'bg-dirt-400' : 'bg-cream/15'}`}
      />
      {/* Home — bottom */}
      <div className="diamond absolute w-2.5 h-2.5 bottom-0 left-1/2 -translate-x-1/2 bg-cream/20 rounded-[1px]" />
    </div>
  );
}

/* ────── ECG Animated Line ────── */
function ECGLine({ isHighStress }) {
  const canvasRef = useRef(null);
  const dataRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    let frame;

    const draw = () => {
      const data = dataRef.current;
      // Push new point
      const speed = isHighStress ? 3 : 2;
      const mid = h / 2;
      const spike = Math.random() > (isHighStress ? 0.92 : 0.95);
      if (spike) {
        data.push(mid - (15 + Math.random() * 20));
        data.push(mid + (8 + Math.random() * 10));
        data.push(mid - (3 + Math.random() * 5));
      } else {
        for (let i = 0; i < speed; i++) {
          data.push(mid + (Math.random() - 0.5) * 3);
        }
      }
      while (data.length > w) data.shift();

      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.strokeStyle = isHighStress ? '#DC2626' : '#22C55E';
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      for (let i = 0; i < data.length; i++) {
        if (i === 0) ctx.moveTo(i, data[i]);
        else ctx.lineTo(i, data[i]);
      }
      ctx.stroke();
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [isHighStress]);

  return (
    <div className="mt-3 rounded-lg overflow-hidden bg-dark-base/50 h-10">
      <canvas ref={canvasRef} width={360} height={40} className="w-full h-full" />
    </div>
  );
}

/* ================================================================
   SCREEN 2: EMERGENCY OVERLAY
   ================================================================ */
function EmergencyOverlay({ heartRate, onMedConfirm, medConfirmed, onBreathing, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col"
    >
      {/* Red gradient background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at center, rgba(220,38,38,0.95) 0%, rgba(26,26,46,0.98) 70%)',
            'radial-gradient(circle at center, rgba(153,27,27,0.95) 0%, rgba(26,26,46,0.98) 70%)',
            'radial-gradient(circle at center, rgba(220,38,38,0.95) 0%, rgba(26,26,46,0.98) 70%)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <div className="relative z-10 flex flex-col h-full p-6">
        {/* Close button */}
        <div className="flex justify-end">
          <button onClick={onDismiss} className="p-2 rounded-full bg-white/10">
            <X className="w-4 h-4 text-cream/60" />
          </button>
        </div>

        {/* Alert content */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-20 h-20 rounded-full bg-alert-red/30 flex items-center justify-center"
          >
            <AlertTriangle className="w-12 h-12 text-white alert-flash" />
          </motion.div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">CARDIAC ALERT</h2>
            <p className="text-cream/70 text-sm max-w-[260px]">
              Your heart rate is{' '}
              <span className="font-bold text-white">{heartRate} bpm</span> during a high-stress
              game moment.
            </p>
          </div>

          {/* HR display */}
          <div className="flex items-center gap-3 bg-black/30 rounded-2xl px-6 py-3">
            <Heart className="w-8 h-8 text-alert-red heartbeat-fast" fill="currentColor" />
            <span className="text-4xl font-black text-white tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
              {heartRate}
            </span>
            <span className="text-cream/50 text-sm">bpm</span>
          </div>

          {/* Medication Slider */}
          <div className="w-full space-y-3 mt-4">
            {!medConfirmed ? (
              <MedicationSlider onConfirm={onMedConfirm} />
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-2 py-4 bg-safe-green/20 rounded-2xl border border-safe-green/30"
              >
                <CheckCircle2 className="w-5 h-5 text-safe-green" />
                <span className="text-safe-green font-semibold text-sm">Medication Confirmed</span>
              </motion.div>
            )}
          </div>

          {/* Deep Breath Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBreathing}
            className="w-full py-4 rounded-2xl bg-white/10 border border-white/10 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/15 transition-colors"
          >
            <Wind className="w-5 h-5" />
            Start Deep Breathing
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ────── Swipe to Confirm Slider ────── */
function MedicationSlider({ onConfirm }) {
  const constraintRef = useRef(null);
  const x = useMotionValue(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const thumbWidth = 56;
  const threshold = 0.8;

  useEffect(() => {
    if (constraintRef.current) {
      setTrackWidth(constraintRef.current.offsetWidth);
    }
  }, []);

  const bgOpacity = useTransform(x, [0, trackWidth - thumbWidth], [0, 0.25]);
  const textOpacity = useTransform(x, [0, (trackWidth - thumbWidth) * 0.5], [1, 0]);

  const handleDragEnd = (_, info) => {
    const maxDrag = trackWidth - thumbWidth;
    if (info.offset.x > maxDrag * threshold) {
      onConfirm();
    }
  };

  return (
    <div ref={constraintRef} className="relative w-full h-14 rounded-2xl bg-alert-red/20 border border-alert-red/30 overflow-hidden">
      {/* Green fill behind thumb */}
      <motion.div
        className="absolute inset-0 bg-safe-green rounded-2xl"
        style={{ opacity: bgOpacity }}
      />

      {/* Text */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: textOpacity }}
      >
        <span className="text-white/60 text-sm font-medium flex items-center gap-1.5">
          Slide to Confirm Medication <ChevronRight className="w-4 h-4" />
        </span>
      </motion.div>

      {/* Draggable Thumb */}
      <motion.div
        drag="x"
        dragConstraints={constraintRef}
        dragElastic={0}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="absolute top-1 left-1 w-12 h-12 rounded-xl bg-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
      >
        <CheckCircle2 className="w-6 h-6 text-alert-red" />
      </motion.div>
    </div>
  );
}

/* ================================================================
   SCREEN 3: BREATHING GUIDE
   ================================================================ */
function BreathingGuide({ onComplete }) {
  const [phase, setPhase] = useState('ready'); // ready | inhale | hold | exhale
  const [timeLeft, setTimeLeft] = useState(BREATHING_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  // Breathing cycle: 4s inhale, 4s hold, 4s exhale
  useEffect(() => {
    if (!isActive) return;
    const cycle = ['inhale', 'hold', 'exhale'];
    const durations = [4000, 4000, 4000];
    let currentIndex = 0;
    let timeout;

    const runPhase = () => {
      setPhase(cycle[currentIndex]);
      timeout = setTimeout(() => {
        currentIndex = (currentIndex + 1) % cycle.length;
        if (currentIndex === 0) {
          setCycleCount((c) => c + 1);
        }
        runPhase();
      }, durations[currentIndex]);
    };

    runPhase();
    return () => clearTimeout(timeout);
  }, [isActive]);

  // Countdown timer
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsActive(false);
          setPhase('ready');
          onComplete();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, onComplete]);

  const handleStart = () => {
    setIsActive(true);
    setTimeLeft(BREATHING_DURATION);
    setCycleCount(0);
  };

  const phaseConfig = {
    ready: { label: 'Tap to Begin', scale: 1, color: 'rgb(74, 124, 41)' },
    inhale: { label: 'Inhale', scale: 1.5, color: 'rgb(74, 124, 41)' },
    hold: { label: 'Hold', scale: 1.5, color: 'rgb(139, 105, 20)' },
    exhale: { label: 'Exhale', scale: 1, color: 'rgb(42, 80, 22)' },
  };

  const current = phaseConfig[phase];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="px-5 pb-6 flex flex-col items-center min-h-[700px]">
      {/* Header */}
      <div className="w-full flex items-center justify-between pt-1 pb-4">
        <button
          onClick={onComplete}
          className="p-2 rounded-xl bg-cream/5 hover:bg-cream/10 transition-colors"
        >
          <X className="w-4 h-4 text-cream/60" />
        </button>
        <h2 className="text-sm font-bold text-cream flex items-center gap-2">
          <Wind className="w-4 h-4 text-grass-400" />
          Breathing Guide
        </h2>
        <div className="w-8" /> {/* spacer */}
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2 mb-8">
        <Timer className="w-4 h-4 text-cream/40" />
        <span className="text-2xl font-bold text-cream tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Breathing Circle (Baseball) */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative">
          {/* Outer ring pulse */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              scale: isActive ? [1, 1.1, 1] : 1,
              opacity: isActive ? [0.2, 0.05, 0.2] : 0.1,
            }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{
              width: 260,
              height: 260,
              margin: -10,
              border: `2px solid ${current.color}`,
            }}
          />

          {/* Main ball */}
          <motion.div
            animate={{ scale: current.scale }}
            transition={{ duration: 4, ease: 'easeInOut' }}
            className="w-60 h-60 rounded-full relative flex items-center justify-center overflow-hidden"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${current.color}, rgba(26,26,46,0.8))`,
              boxShadow: `0 0 60px ${current.color}40, inset 0 0 40px rgba(0,0,0,0.3)`,
            }}
          >
            {/* Baseball stitching */}
            <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full opacity-25">
              <path
                d="M 40 30 Q 70 80, 40 130 Q 30 160, 50 180"
                fill="none"
                stroke="#DC2626"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <path
                d="M 160 30 Q 130 80, 160 130 Q 170 160, 150 180"
                fill="none"
                stroke="#DC2626"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
            </svg>

            {/* Phase label */}
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center z-10"
            >
              <p className="text-xl font-black text-white tracking-wide uppercase">
                {current.label}
              </p>
              {isActive && (
                <p className="text-xs text-white/50 mt-1">Cycle {cycleCount + 1}</p>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Phase indicators */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 mt-10"
          >
            {['inhale', 'hold', 'exhale'].map((p) => (
              <div key={p} className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${phase === p ? 'bg-grass-400' : 'bg-cream/15'}`}
                />
                <span
                  className={`text-xs uppercase tracking-wider transition-colors duration-300 ${phase === p ? 'text-cream font-semibold' : 'text-cream/30'}`}
                >
                  {p}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Start / Back buttons */}
      <div className="w-full space-y-3 mt-6">
        {!isActive && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleStart}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-grass-600 to-grass-500 text-white font-semibold text-sm shadow-lg hover:shadow-green-500/20 transition-shadow"
          >
            {timeLeft === BREATHING_DURATION ? 'Begin Breathing Exercise' : 'Restart Exercise'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
