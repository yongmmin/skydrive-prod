"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

const CRUISE_SPEED = 14;
const BOOST_SPEED = 22;
const YAW_SPEED = 0.62;
const PITCH_SPEED = 0.95;
const ROLL_SPEED = 1.35;
const MAX_BANK_ANGLE = 0.38;
const BANKED_YAW_FACTOR = 1.5;
const INPUT_SMOOTH = 5.5;
const MAX_PITCH_ANGLE = 0.4;
const OBSTACLE_POOL = 20;
const RING_POOL = 10;
const RESPAWN_DISTANCE = 240;
const CLOUD_POOL = 34;
const CLOUD_RESPAWN_DISTANCE = 360;
const WIND_STREAK_POOL = 36;
const RING_RESPAWN_DELAY = 2.0;
const DISTANCE_SCORE_FACTOR = 0.08;
const RING_SCORE_BONUS = 10;
const SAFE_TIME = 2.0;
const MAX_CLIENT_SCORE = 50000;

const ensureAnonId = () => {
  if (typeof window === "undefined") return "dev-anon";
  const key = "nexus-rush-anon";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  window.localStorage.setItem(key, fresh);
  return fresh;
};

const formatNumber = (value: number) => value.toLocaleString("en-US");

export default function PlayPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState("ready");
  const [gamePhase, setGamePhase] = useState<"loading" | "ready" | "playing" | "gameover">("loading");
  const [runId, setRunId] = useState(0);
  const scoreRef = useRef(0);
  const runningRef = useRef(false);
  const controlRef = useRef({ turn: 0, pitch: 0, yaw: 0, bank: 0 });
  const audioCtxRef = useRef<AudioContext | null>(null);

  const ensureAudio = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!audioCtxRef.current) {
      const ctx = new window.AudioContext();
      audioCtxRef.current = ctx;
    }
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
  }, []);

  const playRingSfx = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }, []);

  const playCrashSfx = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.28);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.32);
  }, []);

  const submitScore = useCallback(async (value: number) => {
    setStatus("saving");
    const anonId = ensureAnonId();
    const rounded = Math.min(MAX_CLIENT_SCORE, Math.round(value));

    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonId, score: rounded })
      });
      if (!res.ok) throw new Error();
      setStatus("saved");
      return;
    } catch (e) {
      setStatus("not_saved (server not configured)");
    }
  }, []);

  const onGameOver = useCallback(
    (value: number) => {
      submitScore(value);
    },
    [submitScore]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true, { stencil: true, preserveDrawingBuffer: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.5, 0.71, 0.94, 1);
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogColor = new BABYLON.Color3(0.58, 0.76, 0.96);
    scene.fogDensity = 0.005;

    const arCamera = new BABYLON.UniversalCamera("arCam", new BABYLON.Vector3(0, 3, -12), scene);
    arCamera.inputs.clear();
    arCamera.inertia = 0;
    arCamera.setTarget(BABYLON.Vector3.Zero());

    const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.9;
    const dir = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.3, -0.8, 0.5), scene);
    dir.intensity = 0.6;

    const carRig = new BABYLON.TransformNode("planeRig", scene);
    carRig.position = new BABYLON.Vector3(0, 3, 0);
    carRig.rotationQuaternion = BABYLON.Quaternion.Identity();
    const fallback = BABYLON.MeshBuilder.CreateBox("planeFallback", { width: 1.6, height: 0.8, depth: 2.6 }, scene);
    const fbMat = new BABYLON.StandardMaterial("fb", scene);
    fbMat.diffuseColor = new BABYLON.Color3(0.2, 0.8, 1);
    fbMat.emissiveColor = new BABYLON.Color3(0.05, 0.2, 0.4);
    fallback.material = fbMat;
    fallback.parent = carRig;
    fallback.position.y = 0;
    // Slightly shrink trigger volume to reduce false positives.
    fallback.scaling = new BABYLON.Vector3(0.72, 0.72, 0.72);
    runningRef.current = false;
    setGamePhase("loading");

    BABYLON.SceneLoader.ImportMeshAsync("", "/", "plane.glb", scene)
      .then((res) => {
        const usable = res.meshes.filter((m) => m.name !== "__root__");
        usable.forEach((m) => {
          const bounds = m.getHierarchyBoundingVectors(true);
          const center = bounds.min.add(bounds.max).scale(0.5);
          m.position = m.position.subtract(center);
          m.position.y = -2;
          m.rotation = new BABYLON.Vector3(0, Math.PI, 0);
          m.rotationQuaternion = null;
          m.rotation.y = -6.26
          // normalize size to ~2 units longest edge
          const size = bounds.max.subtract(bounds.min);
          const longest = Math.max(size.x, size.y, size.z) || 1;
          m.scaling = new BABYLON.Vector3(0.15, 0.15, 0.15);
          m.parent = carRig;
        });
        if (usable.length > 0) {
          // keep the fallback box as collision trigger only
          fallback.isVisible = false;
        }
        runningRef.current = false;
        setGamePhase("ready");
      })
      .catch(() => {
        // keep fallback, but wait for explicit start
        runningRef.current = false;
        setGamePhase("ready");
      });

    // obstacle pool
    const obstacles: BABYLON.Mesh[] = [];
    const obstacleMat = new BABYLON.StandardMaterial("om", scene);
    obstacleMat.diffuseColor = new BABYLON.Color3(0.8, 0.45, 0.45);
    const ringMat = new BABYLON.StandardMaterial("rm", scene);
    ringMat.diffuseColor = new BABYLON.Color3(0.95, 0.9, 0.2);
    ringMat.emissiveColor = new BABYLON.Color3(0.5, 0.45, 0.1);
    const cloudMat = new BABYLON.StandardMaterial("cm", scene);
    cloudMat.diffuseColor = new BABYLON.Color3(0.95, 0.98, 1);
    cloudMat.emissiveColor = new BABYLON.Color3(0.2, 0.26, 0.3);
    cloudMat.alpha = 0.62;
    const windMat = new BABYLON.StandardMaterial("wm", scene);
    windMat.disableLighting = true;
    windMat.emissiveColor = new BABYLON.Color3(0.9, 0.98, 1);
    windMat.alpha = 0.5;
    const getRigAxes = () => {
      carRig.computeWorldMatrix(true);
      const world = carRig.getWorldMatrix();
      const forward = BABYLON.Vector3.TransformNormal(BABYLON.Axis.Z, world).normalize();
      const up = BABYLON.Vector3.TransformNormal(BABYLON.Axis.Y, world).normalize();
      const right = BABYLON.Vector3.TransformNormal(BABYLON.Axis.X, world).normalize();
      return { forward, up, right };
    };
    const getCameraAxes = () => {
      arCamera.computeWorldMatrix(true);
      const world = arCamera.getWorldMatrix();
      const forward = BABYLON.Vector3.TransformNormal(BABYLON.Axis.Z, world).normalize();
      const up = BABYLON.Vector3.TransformNormal(BABYLON.Axis.Y, world).normalize();
      const right = BABYLON.Vector3.TransformNormal(BABYLON.Axis.X, world).normalize();
      return { forward, up, right };
    };
    const spawnObstacle = (m: BABYLON.Mesh) => {
      const { forward, up, right } = getRigAxes();
      const ahead = 70 + Math.random() * 120;
      const lateral = (Math.random() * 2 - 1) * 38;
      const vertical = (Math.random() * 2 - 1) * 24;
      m.position = carRig.position
        .add(forward.scale(ahead))
        .add(right.scale(lateral))
        .add(up.scale(vertical));
    };
    for (let i = 0; i < OBSTACLE_POOL; i++) {
      const box = BABYLON.MeshBuilder.CreateBox(
        "obs",
        { width: 1 + Math.random() * 2.2, height: 1 + Math.random() * 2.2, depth: 1 + Math.random() * 2.2 },
        scene
      );
      box.material = obstacleMat;
      box.checkCollisions = false;
      spawnObstacle(box);
      obstacles.push(box);
    }

    const rings: BABYLON.Mesh[] = [];
    const ringRespawnAt: number[] = [];
    const spawnRing = (m: BABYLON.Mesh) => {
      const { forward, up, right } = getRigAxes();
      const ahead = 55 + Math.random() * 105;
      const lateral = (Math.random() * 2 - 1) * 26;
      const vertical = (Math.random() * 2 - 1) * 18;
      m.position = carRig.position
        .add(forward.scale(ahead))
        .add(right.scale(lateral))
        .add(up.scale(vertical));
      m.setEnabled(true);
      m.rotation = new BABYLON.Vector3(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    };
    for (let i = 0; i < RING_POOL; i++) {
      const ring = BABYLON.MeshBuilder.CreateTorus("ring", { diameter: 3.2, thickness: 0.35, tessellation: 20 }, scene);
      ring.material = ringMat;
      spawnRing(ring);
      rings.push(ring);
      ringRespawnAt.push(0);
    }

    const clouds: BABYLON.Mesh[] = [];
    const spawnCloud = (m: BABYLON.Mesh, far = false) => {
      const { forward, up, right } = getRigAxes();
      const ahead = (far ? 180 : 45) + Math.random() * 180;
      const lateral = (Math.random() * 2 - 1) * 95;
      const vertical = 12 + (Math.random() * 2 - 1) * 54;
      m.position = carRig.position
        .add(forward.scale(ahead))
        .add(right.scale(lateral))
        .add(up.scale(vertical));
      const base = 8 + Math.random() * 8;
      m.scaling = new BABYLON.Vector3(base * (1.3 + Math.random() * 1.2), base * (0.38 + Math.random() * 0.35), base);
      m.rotation = new BABYLON.Vector3(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.2);
    };
    for (let i = 0; i < CLOUD_POOL; i++) {
      const cloud = BABYLON.MeshBuilder.CreateSphere("cloud", { diameter: 1.3, segments: 6 }, scene);
      cloud.material = cloudMat;
      cloud.isPickable = false;
      spawnCloud(cloud, true);
      clouds.push(cloud);
    }

    const windStreaks: BABYLON.Mesh[] = [];
    const spawnWindStreak = (m: BABYLON.Mesh) => {
      const { forward, up, right } = getCameraAxes();
      const depth = 6 + Math.random() * 16;
      const side = (Math.random() * 2 - 1) * 8;
      const height = (Math.random() * 2 - 1) * 4.5;
      m.position = arCamera.position
        .add(forward.scale(depth))
        .add(right.scale(side))
        .add(up.scale(height));
      m.scaling = new BABYLON.Vector3(0.018, 0.018, 1.2 + Math.random() * 2.8);
      m.lookAt(m.position.add(forward));
    };
    for (let i = 0; i < WIND_STREAK_POOL; i++) {
      const streak = BABYLON.MeshBuilder.CreateBox("wind", { size: 1 }, scene);
      streak.material = windMat;
      streak.isPickable = false;
      spawnWindStreak(streak);
      windStreaks.push(streak);
    }

    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let elapsed = 0;
    let throttle = 0;
    let collectedTotal = 0;

    const loop = () => {
      const delta = engine.getDeltaTime() / 1000;
      elapsed += delta;

      if (runningRef.current) {
        const rawTurnInput =
          (keys["arrowright"] || keys["d"] || keys["e"] ? 1 : 0) -
          (keys["arrowleft"] || keys["a"] || keys["q"] ? 1 : 0);
        const rawPitchInput = (keys["s"] || keys["arrowdown"] ? 1 : 0) - (keys["w"] || keys["arrowup"] ? 1 : 0);
        const smoothStep = BABYLON.Scalar.Clamp(INPUT_SMOOTH * delta, 0, 1);
        controlRef.current.turn = BABYLON.Scalar.Lerp(controlRef.current.turn, rawTurnInput, smoothStep);
        controlRef.current.pitch = BABYLON.Scalar.Lerp(controlRef.current.pitch, rawPitchInput, smoothStep);
        const turnInput = controlRef.current.turn;
        const pitchInput = controlRef.current.pitch;
        const speed = keys["shift"] ? BOOST_SPEED : CRUISE_SPEED;

        const bankLerp = BABYLON.Scalar.Clamp(ROLL_SPEED * delta, 0, 1);
        const targetBank = -turnInput * MAX_BANK_ANGLE;
        controlRef.current.bank = BABYLON.Scalar.Lerp(controlRef.current.bank, targetBank, bankLerp);
        controlRef.current.pitch = BABYLON.Scalar.Clamp(
          controlRef.current.pitch + pitchInput * PITCH_SPEED * delta,
          -MAX_PITCH_ANGLE,
          MAX_PITCH_ANGLE
        );
        controlRef.current.yaw +=
          (turnInput * (YAW_SPEED * 0.35) - controlRef.current.bank * BANKED_YAW_FACTOR) * delta;
        carRig.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
          controlRef.current.pitch,
          controlRef.current.yaw,
          controlRef.current.bank
        );

        const { forward: moveForward } = getRigAxes();
        carRig.position.addInPlace(moveForward.scale(speed * delta));

        const planePos = fallback.getAbsolutePosition();

        // soft cloud field around player
        clouds.forEach((cloud) => {
          const drift = 0.6 + speed * 0.08;
          cloud.position.addInPlace(moveForward.scale(-drift * delta));
          cloud.rotation.y += 0.04 * delta;
          if (BABYLON.Vector3.DistanceSquared(cloud.position, carRig.position) > CLOUD_RESPAWN_DISTANCE * CLOUD_RESPAWN_DISTANCE) {
            spawnCloud(cloud);
          }
        });

        // obstacles
        obstacles.forEach((o) => {
          if (BABYLON.Vector3.DistanceSquared(o.position, carRig.position) > RESPAWN_DISTANCE * RESPAWN_DISTANCE) {
            spawnObstacle(o);
          }
          fallback.computeWorldMatrix(true);
          o.computeWorldMatrix(true);
          if (elapsed > SAFE_TIME && fallback.intersectsMesh(o, true)) {
            runningRef.current = false;
            setGamePhase("gameover");
            playCrashSfx();
            onGameOver(scoreRef.current);
          }
        });

        // collectible rings
        rings.forEach((ring, idx) => {
          if (ringRespawnAt[idx] > elapsed) return;
          if (!ring.isEnabled()) {
            spawnRing(ring);
          }
          ring.rotate(BABYLON.Axis.Y, 1.6 * delta, BABYLON.Space.LOCAL);
          if (BABYLON.Vector3.DistanceSquared(ring.position, carRig.position) > RESPAWN_DISTANCE * RESPAWN_DISTANCE) {
            spawnRing(ring);
          }
          const ringDistSq = BABYLON.Vector3.DistanceSquared(ring.position, planePos);
          if (ringDistSq < 4.8 * 4.8) {
            collectedTotal += 1;
            scoreRef.current = Math.min(MAX_CLIENT_SCORE, scoreRef.current + RING_SCORE_BONUS);
            playRingSfx();
            ring.setEnabled(false);
            ringRespawnAt[idx] = elapsed + RING_RESPAWN_DELAY;
          }
        });

        // score by distance
        scoreRef.current += speed * DISTANCE_SCORE_FACTOR * delta;
        throttle += delta;
        if (throttle > 0.1) {
          throttle = 0;
          setScore(Math.min(MAX_CLIENT_SCORE, Math.round(scoreRef.current)));
        }

        // camera follow
        const { forward: camForward, up: camUp } = getRigAxes();
        const desiredCamera = carRig.position.subtract(camForward.scale(16)).add(camUp.scale(4));
        arCamera.position = BABYLON.Vector3.Lerp(
          arCamera.position,
          desiredCamera,
          0.1
        );
        arCamera.setTarget(carRig.position.add(camForward.scale(10)));

        // wind streak effect near camera for speed sensation
        const { forward: windForward } = getCameraAxes();
        windStreaks.forEach((streak) => {
          streak.position.addInPlace(windForward.scale(-(10 + speed * 2.4) * delta));
          const depth = BABYLON.Vector3.Dot(streak.position.subtract(arCamera.position), windForward);
          if (depth < -2 || depth > 26) {
            spawnWindStreak(streak);
          }
        });
      }

      scene.render();
    };

    const handleResize = () => engine.resize();
    window.addEventListener("resize", handleResize);
    engine.runRenderLoop(loop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", handleResize);
      engine.stopRenderLoop();
      engine.dispose();
    };
  }, [onGameOver, playCrashSfx, playRingSfx, runId]);

  const startGame = useCallback(async () => {
    await ensureAudio();
    scoreRef.current = 0;
    controlRef.current.turn = 0;
    controlRef.current.pitch = 0;
    controlRef.current.bank = 0;
    controlRef.current.yaw = 0;
    setScore(0);
    setStatus("ready");
    runningRef.current = true;
    setGamePhase("playing");
  }, [ensureAudio]);

  const restart = () => {
    scoreRef.current = 0;
    controlRef.current.turn = 0;
    controlRef.current.pitch = 0;
    controlRef.current.bank = 0;
    controlRef.current.yaw = 0;
    runningRef.current = false;
    setScore(0);
    setStatus("ready");
    setGamePhase("loading");
    setRunId((v) => v + 1);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#0b0d14] text-white">
      <canvas ref={canvasRef} className="h-full w-full" />

      <div className="pointer-events-none absolute left-0 right-0 top-0 flex justify-center p-4">
        <div className="pointer-events-auto rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.3em] text-white/80">
          Score: {formatNumber(score)}
        </div>
      </div>

      {gamePhase !== "playing" && gamePhase !== "gameover" && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-200/35 via-sky-900/45 to-slate-950/65 p-6">
          <div className="w-full max-w-md rounded-3xl border border-white/30 bg-[#0c1a2f]/65 p-7 text-center shadow-soft backdrop-blur-md">
            <div className="text-xs font-extrabold uppercase tracking-[0.28em] text-sky-200/90">Nexus Rush</div>
            <h1 className="mt-3 text-3xl font-black text-white">Sky Flight</h1>
            <p className="mt-3 text-sm text-sky-100/80">
              Rings를 모아 점수를 올리고 장애물을 피하세요.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={startGame}
                disabled={gamePhase === "loading"}
                className="rounded-full bg-white px-6 py-3 text-sm font-extrabold text-slate-900 shadow-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                {gamePhase === "loading" ? "Loading..." : "Start Flight"}
              </button>
            </div>
          </div>
        </div>
      )}

      {gamePhase === "gameover" && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 p-6 text-center shadow-soft backdrop-blur">
            <div className="text-sm font-extrabold text-white">Game Over</div>
            <div className="mt-2 text-lg font-extrabold text-white">Score {formatNumber(score)}</div>
            <div className="mt-2 text-xs text-white/70">상태: {status}</div>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={restart}
                className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-900 shadow-soft"
              >
                Restart
              </button>
              <Link
                href="/rank"
                className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-soft"
              >
                Rank
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-auto absolute right-4 bottom-4 text-xs text-white/70">
        상태: {status}
      </div>
    </main>
  );
}
