import { evalExpression } from "./expressions";

export function createEngine({ onLog, onHighlight, maxOpsPerSecond }) {
  
  let program = null;
  let handlers = Object.create(null);

  let runtime = null; // { sprite }

  let running = false;
  let rafId = null;
  let lastTs = 0;

  // Shared variable store (Scratch-like)
  let vars = Object.create(null);

  // Each script becomes a thread:
  // {
  //   id: string,
  //   stack: [{ kind, commands, ip, ... }],
  //   active: timeActionState | null,
  //   finished: boolean
  // }
  let threads = [];

  // Safety
  let opsThisSecond = 0;
  let opsWindowStart = 0;

  // Thread ids for spawned event scripts
  let nextThreadId = 1;

  function log(msg) {
    if (onLog) onLog(msg);
  }

  function highlight(blockId) {
    if (onHighlight) onHighlight(blockId || null);
  }

  function loadProgram(p) {
    program = p || null;
    handlers = (p && p.handlers) ? p.handlers : Object.create(null);
  }

  function bindRuntime(r) {
    runtime = r || null;
  }

  function start() {
    if (!program || !runtime) {
      log("Engine: missing program/runtime.");
      return;
    }

    const scripts = Array.isArray(program.scripts) ? program.scripts : [];
    if (scripts.length === 0) {
      log("No start scripts found.");
      return;
    }

    // fresh run
    threads = scripts.map((s) => ({
      id: String(s.id || `start_${nextThreadId++}`),
      stack: [{ kind: "seq", commands: Array.isArray(s.commands) ? s.commands : [], ip: 0 }],
      active: null,
      finished: false,
    }));

    running = true;
    lastTs = performance.now();
    opsThisSecond = 0;
    opsWindowStart = lastTs;

    log(`Engine started (${threads.length} script(s)).`);
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    highlight(null);

    // mark all finished and clear state to avoid any lingering actions
    for (const t of threads) {
      t.finished = true;
      t.active = null;
      t.stack = [];
    }
    threads = [];

    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function tick(ts) {
    if (!running) return;

    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    // ops/sec window
    if (ts - opsWindowStart >= 1000) {
      opsWindowStart = ts;
      opsThisSecond = 0;
    }

    const maxStepsPerFrame = 400; // multiple threads
    let steps = 0;

    // Round-robin stepping
    while (steps < maxStepsPerFrame && running) {
      steps++;

      opsThisSecond++;
      if (opsThisSecond > maxOpsPerSecond) {
        log("Safety stop: too many operations/sec (possible infinite loop).");
        stop();
        break;
      }

      // remove finished threads
      threads = threads.filter((t) => !t.finished);

      if (threads.length === 0) {
        log("All scripts finished.");
        stop();
        break;
      }

      let anyProgress = false;

      for (const thread of threads) {
        if (thread.finished) continue;

        const progressed = stepThread(thread, dt);
        anyProgress = anyProgress || progressed;

        if (!running) break;
      }

      // all threads waiting => end this frame
      if (!anyProgress) break;
    }

    rafId = requestAnimationFrame(tick);
  }

  function stepThread(thread, dt) {
    const frame = thread.stack[thread.stack.length - 1];
    if (!frame) {
      thread.finished = true;
      return true;
    }

    const cmd = frame.commands[frame.ip];
    if (!cmd) {
      thread.stack.pop();
      return true;
    }

    const res = stepCommand(thread, frame, cmd, dt);

    if (res.done) {
      if (res.advance) {
        frame.ip += 1;
        postAdvance(thread, frame);
      }
      return true;
    }

    return false;
  }

  function postAdvance(thread, frame) {
    if (!frame) return;

    if (frame.kind === "repeat") {
      if (frame.ip >= frame.commands.length) {
        frame.iter += 1;
        if (frame.iter >= frame.times) {
          thread.stack.pop();
        } else {
          frame.ip = 0;
        }
      }
    }

    if (frame.kind === "forever") {
      if (frame.ip >= frame.commands.length) {
        frame.ip = 0;
      }
    }
  }

  // ----- loop helpers (break/continue) -----
  function findNearestLoopIndex(thread) {
    for (let i = thread.stack.length - 1; i >= 0; i--) {
      const k = thread.stack[i].kind;
      if (k === "repeat" || k === "forever") return i;
    }
    return -1;
  }

  function doBreak(thread) {
    const loopIdx = findNearestLoopIndex(thread);
    if (loopIdx === -1) {
      log("break: no loop to break.");
      return;
    }
    thread.stack.length = loopIdx; // remove loop + above
    thread.active = null;
  }

  function doContinue(thread) {
    const loopIdx = findNearestLoopIndex(thread);
    if (loopIdx === -1) {
      log("continue: no loop to continue.");
      return;
    }
    thread.stack.length = loopIdx + 1;
    const loop = thread.stack[loopIdx];
    loop.ip = loop.commands.length; // force loop body end
    thread.active = null;
  }

  // ----- variables -----
  function getVar(name) {
    if (!name) return 0;
    const v = vars[name];
    return v === undefined ? 0 : v;
  }

  function setVar(name, value) {
    if (!name) return;
    vars[name] = value;
  }

  // ----- events -----
  function emit(message, parentThread, waitMode) {
    const list = handlers && handlers[message] ? handlers[message] : [];
    if (!Array.isArray(list) || list.length === 0) return [];

    const spawned = [];

    for (const script of list) {
      const tid = `${script.id || "evt"}_${nextThreadId++}`;

      threads.push({
        id: tid,
        stack: [{ kind: "seq", commands: Array.isArray(script.commands) ? script.commands : [], ip: 0 }],
        active: null,
        finished: false,
        // for wait-mode tracking (optional)
        parent: waitMode ? (parentThread ? parentThread.id : null) : null,
      });

      spawned.push(tid);
    }

    return spawned;
  }

  function areThreadsFinished(ids) {
    if (!ids || ids.length === 0) return true;
    for (const id of ids) {
      const t = threads.find((x) => x.id === id);
      if (t && !t.finished) return false;
    }
    return true;
  }

  // ----- command step -----
  function stepCommand(thread, frame, cmd, dt) {
    if (cmd && cmd.blockId) highlight(cmd.blockId);

    const t = String(cmd.type || "");

    // STOP MODES
    if (t === "stop_all") {
      log("STOP ALL encountered.");
      stop();
      return { done: true, advance: false };
    }

    if (t === "stop_this") {
      log("STOP THIS SCRIPT encountered.");
      thread.finished = true;
      thread.active = null;
      return { done: true, advance: false };
    }

    // Backward compatibility if old scripts still use "stop"
    if (t === "stop") {
      log("STOP encountered (treated as stop_all).");
      stop();
      return { done: true, advance: false };
    }

    // LOOP CONTROL
    if (t === "break") {
      doBreak(thread);
      return { done: true, advance: false };
    }

    if (t === "continue") {
      doContinue(thread);
      return { done: true, advance: false };
    }

    // VARIABLES
    if (t === "set_var") {
      const v = Number(evalExpression(cmd.value, vars)) || 0;
      setVar(cmd.name, v);
      log(`set ${cmd.name} = ${v}`);
      return { done: true, advance: true };
    }

    if (t === "change_var") {
      const cur = getVar(cmd.name);
      const delta = Number(evalExpression(cmd.delta, vars)) || 0;
      const next = cur + delta;
      setVar(cmd.name, next);
      log(`change ${cmd.name} by ${delta} -> ${next}`);
      return { done: true, advance: true };
    }

    if (t === "delete_var") {
      if (cmd.name) delete vars[cmd.name];
      log(`delete ${cmd.name} (defaults to 0 when read)`);
      return { done: true, advance: true };
    }

    // EVENTS
    if (t === "broadcast") {
      const msg = String(evalExpression(cmd.message, vars) ?? "");
      log(`broadcast "${msg}"${cmd.wait ? " and wait" : ""}`);

      if (!cmd.wait) {
        emit(msg, thread, false);
        return { done: true, advance: true };
      }

      // broadcast and wait:
      // - spawn once
      // - then block until those threads are finished
      if (!cmd.__spawnedIds) {
        cmd.__spawnedIds = emit(msg, thread, true);
      }

      if (!areThreadsFinished(cmd.__spawnedIds)) {
        return { done: false, advance: false };
      }

      return { done: true, advance: true };
    }

    // CONTROL frames
    if (t === "repeat") {
      const times = Math.max(0, Math.floor(Number(evalExpression(cmd.times, vars)) || 0));
      frame.ip += 1;

      thread.stack.push({
        kind: "repeat",
        commands: Array.isArray(cmd.body) ? cmd.body : [],
        ip: 0,
        times,
        iter: 0,
      });

      return { done: true, advance: false };
    }

    if (t === "forever") {
      frame.ip += 1;

      thread.stack.push({
        kind: "forever",
        commands: Array.isArray(cmd.body) ? cmd.body : [],
        ip: 0,
      });

      return { done: true, advance: false };
    }

    if (t === "if") {
      frame.ip += 1;
      const cond = Boolean(evalExpression(cmd.cond, vars));
      if (cond) {
        thread.stack.push({
          kind: "seq",
          commands: Array.isArray(cmd.body) ? cmd.body : [],
          ip: 0,
        });
      }
      return { done: true, advance: false };
    }

    if (t === "if_else") {
      frame.ip += 1;
      const cond = Boolean(evalExpression(cmd.cond, vars));
      const chosen = cond ? cmd.thenBody : cmd.elseBody;

      thread.stack.push({
        kind: "seq",
        commands: Array.isArray(chosen) ? chosen : [],
        ip: 0,
      });

      return { done: true, advance: false };
    }

    // ACTIONS (smooth animation)
    return stepAction(thread, cmd, dt);
  }

  function stepAction(thread, cmd, dt) {
    const sprite = runtime?.sprite;
    if (!sprite) return { done: true, advance: true };

    if (!thread.active || thread.active.cmd !== cmd) {
      const t = String(cmd.type || "");

      if (t === "move") {
        const steps = Number(evalExpression(cmd.steps, vars)) || 0;
        const duration = Math.max(0.05, Math.min(2.0, Math.abs(steps) / 200));
        thread.active = { cmd, type: "move", t: 0, duration, steps, startX: sprite.x, startY: sprite.y };
      } else if (t === "turn") {
        const degrees = Number(evalExpression(cmd.degrees, vars)) || 0;
        const duration = Math.max(0.05, Math.min(1.5, Math.abs(degrees) / 180));
        thread.active = { cmd, type: "turn", t: 0, duration, degrees, startRot: sprite.rotation };
      } else if (t === "wait") {
        const seconds = Math.max(0, Number(evalExpression(cmd.seconds, vars)) || 0);
        thread.active = { cmd, type: "wait", t: 0, duration: seconds };
      } else {
        return { done: true, advance: true };
      }
    }

    thread.active.t += dt;
    const p = thread.active.duration <= 0 ? 1 : Math.min(1, thread.active.t / thread.active.duration);

    if (thread.active.type === "move") {
      const rad = (sprite.rotation * Math.PI) / 180;
      const dx = Math.cos(rad) * thread.active.steps;
      const dy = Math.sin(rad) * thread.active.steps;
      sprite.x = thread.active.startX + dx * p;
      sprite.y = thread.active.startY + dy * p;
    }

    if (thread.active.type === "turn") {
      sprite.rotation = thread.active.startRot + thread.active.degrees * p;
    }

    if (p >= 1) {
      thread.active = null;
      return { done: true, advance: true };
    }

    return { done: false, advance: false };
  }

  return { loadProgram, bindRuntime, start, stop };
}
