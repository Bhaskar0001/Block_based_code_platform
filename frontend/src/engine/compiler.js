/**
 * Compiler: Blockly Workspace -> Program (multi scripts)
 *
 * - Each bp_start is a separate "script".
 * - Statements compile to COMMAND objects (with blockId).
 * - Value blocks compile to Expression AST.
 */

export function compileWorkspaceToProgram(workspace) {
  if (!workspace) return { scripts: [] };

  const topBlocks = workspace.getTopBlocks(true);
  const starts = topBlocks.filter((b) => b.type === "bp_start");
    const receives = topBlocks.filter((b) => b.type === "bp_when_receive");
  const scripts = starts.map((start) => {
    const commands = [];
    const next = start.getNextBlock();
    compileStatementChain(next, commands);
    return { id: start.id, commands };
  });
  const handlers = Object.create(null);

  for (const hat of receives) {
    const msgExpr = compileInputValue(hat, "MSG", { kind: "str", value: "" });
    const msg = normalizeMessageLiteral(msgExpr);

    const bodyFirst = hat.getInputTargetBlock("DO");
    const bodyCmds = [];
    compileStatementChain(bodyFirst, bodyCmds);

    if (!handlers[msg]) handlers[msg] = [];
    handlers[msg].push({ id: hat.id, commands: bodyCmds });
  }

  return { scripts, handlers };
}

export default compileWorkspaceToProgram;

// ---------- STATEMENTS ----------
function compileStatementChain(block, out) {
  let cur = block;
  while (cur) {
    compileSingle(cur, out);
    cur = cur.getNextBlock();
  }
}

function compileSingle(block, out) {
  switch (block.type) {
    case "bp_move": {
      const stepsExpr = compileInputValue(block, "STEPS", { kind: "num", value: 0 });
      out.push({ type: "move", steps: stepsExpr, blockId: block.id });
      return;
    }
    case "bp_turn": {
      const degExpr = compileInputValue(block, "DEG", { kind: "num", value: 0 });
      out.push({ type: "turn", degrees: degExpr, blockId: block.id });
      return;
    }
    case "bp_wait": {
      const secExpr = compileInputValue(block, "SECS", { kind: "num", value: 0 });
      out.push({ type: "wait", seconds: secExpr, blockId: block.id });
      return;
    }
   case "bp_stop_all": {
  out.push({ type: "stop_all", blockId: block.id });
  return;
}

case "bp_stop_this": {
  out.push({ type: "stop_this", blockId: block.id });
  return;
}



//broadcasts
case "bp_broadcast": {
  const msgExpr = compileInputValue(block, "MSG", { kind: "str", value: "" });
  out.push({ type: "broadcast", message: msgExpr, wait: false, blockId: block.id });
  return;
}

case "bp_broadcast_wait": {
  const msgExpr = compileInputValue(block, "MSG", { kind: "str", value: "" });
  out.push({ type: "broadcast", message: msgExpr, wait: true, blockId: block.id });
  return;
}


    // loop control
    case "bp_break": {
      out.push({ type: "break", blockId: block.id });
      return;
    }
    case "bp_continue": {
      out.push({ type: "continue", blockId: block.id });
      return;
    }

    // CONTROL
    case "bp_repeat": {
      const timesExpr = compileInputValue(block, "TIMES", { kind: "num", value: 0 });
      const bodyFirst = block.getInputTargetBlock("DO");
      const bodyCmds = [];
      compileStatementChain(bodyFirst, bodyCmds);
      out.push({ type: "repeat", times: timesExpr, body: bodyCmds, blockId: block.id });
      return;
    }

    case "bp_forever": {
      const bodyFirst = block.getInputTargetBlock("DO");
      const bodyCmds = [];
      compileStatementChain(bodyFirst, bodyCmds);
      out.push({ type: "forever", body: bodyCmds, blockId: block.id });
      return;
    }

    case "bp_if": {
      const condBlock = block.getInputTargetBlock("COND");
      const condExpr = compileValue(condBlock) || { kind: "bool", value: false };

      const bodyFirst = block.getInputTargetBlock("DO");
      const bodyCmds = [];
      compileStatementChain(bodyFirst, bodyCmds);

      out.push({ type: "if", cond: condExpr, body: bodyCmds, blockId: block.id });
      return;
    }

    case "bp_if_else": {
      const condBlock = block.getInputTargetBlock("COND");
      const condExpr = compileValue(condBlock) || { kind: "bool", value: false };

      const thenFirst = block.getInputTargetBlock("DO");
      const elseFirst = block.getInputTargetBlock("ELSE");

      const thenCmds = [];
      const elseCmds = [];
      compileStatementChain(thenFirst, thenCmds);
      compileStatementChain(elseFirst, elseCmds);

      out.push({
        type: "if_else",
        cond: condExpr,
        thenBody: thenCmds,
        elseBody: elseCmds,
        blockId: block.id,
      });
      return;
    }

    // VARIABLES (built-in)
    case "variables_set": {
      const name = block.getFieldValue("VAR");
      const valueExpr = compileInputValue(block, "VALUE", { kind: "num", value: 0 });
      out.push({ type: "set_var", name, value: valueExpr, blockId: block.id });
      return;
    }

    case "math_change": {
      const name = block.getFieldValue("VAR");
      const deltaExpr = compileInputValue(block, "DELTA", { kind: "num", value: 1 });
      out.push({ type: "change_var", name, delta: deltaExpr, blockId: block.id });
      return;
    }

    case "bp_delete_var": {
      const name = block.getFieldValue("VAR");
      out.push({ type: "delete_var", name, blockId: block.id });
      return;
    }

    default:
      return;
  }
}

// ---------- VALUES ----------
function compileInputValue(block, inputName, fallbackExpr) {
  const target = block.getInputTargetBlock(inputName);
  const expr = compileValue(target);
  return expr || fallbackExpr;
}

function compileValue(block) {
  if (!block) return null;

  switch (block.type) {
    case "math_number":
      return { kind: "num", value: Number(block.getFieldValue("NUM")) || 0 };

    case "logic_boolean":
      return { kind: "bool", value: block.getFieldValue("BOOL") === "TRUE" };

    case "variables_get": {
      const name = block.getFieldValue("VAR");
      return { kind: "var", name };
    }

    case "text":
  return { kind: "str", value: String(block.getFieldValue("TEXT") || "") };


    case "math_arithmetic": {
      const opField = block.getFieldValue("OP");
      const left = compileInputValue(block, "A", { kind: "num", value: 0 });
      const right = compileInputValue(block, "B", { kind: "num", value: 0 });
      const opMap = { ADD: "+", MINUS: "-", MULTIPLY: "*", DIVIDE: "/" };
      return { kind: "bin", op: opMap[opField] || "+", left, right };
    }

    case "logic_compare": {
      const opField = block.getFieldValue("OP");
      const left = compileInputValue(block, "A", { kind: "num", value: 0 });
      const right = compileInputValue(block, "B", { kind: "num", value: 0 });
      const opMap = { EQ: "==", LT: "<", GT: ">" };
      return { kind: "cmp", op: opMap[opField] || "==", left, right };
    }

    case "logic_operation": {
      const opField = block.getFieldValue("OP");
      const left = compileInputValue(block, "A", { kind: "bool", value: false });
      const right = compileInputValue(block, "B", { kind: "bool", value: false });
      const opMap = { AND: "and", OR: "or" };
      return { kind: "logic", op: opMap[opField] || "and", left, right };
    }

    default:
      return null;
  }
}
function normalizeMessageLiteral(expr) {
  // For now: only allow literal strings for event keys.
  // If expr isn't a literal string, we fallback to "".
  if (expr && expr.kind === "str") return expr.value;
  return "";
}

