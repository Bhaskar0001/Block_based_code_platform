export function registerBlocks(Blockly) {
  // Prevent double-register (dev hot reload / StrictMode effects)
  if (Blockly.Blocks.__bp_registered__) return;
  Blockly.Blocks.__bp_registered__ = true;

  // ---------- START ----------
  Blockly.Blocks["bp_start"] = {
    init: function () {
      this.appendDummyInput().appendField("start");
      this.setNextStatement(true, null);
      this.setColour("#7C4DFF");
      this.setTooltip("Program start");
    },
  };

  // ---------- ACTIONS ----------
  Blockly.Blocks["bp_move"] = {
    init: function () {
      this.appendValueInput("STEPS")
        .setCheck("Number")
        .appendField("move steps");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#7C4DFF");
    },
  };

  Blockly.Blocks["bp_turn"] = {
    init: function () {
      this.appendValueInput("DEG")
        .setCheck("Number")
        .appendField("turn degrees");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#7C4DFF");
    },
  };

  Blockly.Blocks["bp_wait"] = {
    init: function () {
      this.appendValueInput("SECS")
        .setCheck("Number")
        .appendField("wait seconds");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#7C4DFF");
    },
  };

  Blockly.Blocks["bp_stop"] = {
    init: function () {
      this.appendDummyInput().appendField("stop");
      this.setPreviousStatement(true, null);
      this.setColour("#7C4DFF");
    },
  };

  // ---------- CONTROL ----------
  Blockly.Blocks["bp_repeat"] = {
    init: function () {
      this.appendValueInput("TIMES")
        .setCheck("Number")
        .appendField("repeat");
      this.appendStatementInput("DO").appendField("do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FF7043");
    },
  };

  Blockly.Blocks["bp_forever"] = {
    init: function () {
      this.appendDummyInput().appendField("forever");
      this.appendStatementInput("DO").appendField("do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FF7043");
    },
  };

  Blockly.Blocks["bp_if"] = {
    init: function () {
      this.appendValueInput("COND")
        .setCheck("Boolean")
        .appendField("if");
      this.appendStatementInput("DO").appendField("do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FF7043");
    },
  };

  Blockly.Blocks["bp_if_else"] = {
    init: function () {
      this.appendValueInput("COND")
        .setCheck("Boolean")
        .appendField("if");
      this.appendStatementInput("DO").appendField("do");
      this.appendStatementInput("ELSE").appendField("else");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FF7043");
    },
  };

  // ---------- VARIABLES (custom delete) ----------
  Blockly.Blocks["bp_delete_var"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("delete variable")
        .appendField(new Blockly.FieldVariable("item"), "VAR");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FFD54F");
    },
  };

    // ---------- LOOP CONTROL ----------
  Blockly.Blocks["bp_break"] = {
    init: function () {
      this.appendDummyInput().appendField("break");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FF7043");
      this.setTooltip("Exit the nearest loop (repeat / forever)");
    },
  };

  Blockly.Blocks["bp_continue"] = {
    init: function () {
      this.appendDummyInput().appendField("continue");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FF7043");
      this.setTooltip("Skip to next iteration of the nearest loop");
    },
  };

    // ---------- STOP MODES ----------
  Blockly.Blocks["bp_stop_all"] = {
    init: function () {
      this.appendDummyInput().appendField("stop all");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#7C4DFF");
      this.setTooltip("Stop all running scripts");
    },
  };

  Blockly.Blocks["bp_stop_this"] = {
    init: function () {
      this.appendDummyInput().appendField("stop this script");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#7C4DFF");
      this.setTooltip("Stop only the script currently running this block");
    },
  };

    // ---------- EVENTS ----------
  Blockly.Blocks["bp_when_receive"] = {
    init: function () {
      this.appendValueInput("MSG")
        .setCheck("String")
        .appendField("when I receive");
      this.appendStatementInput("DO").appendField("do");
      this.setColour("#FFCA28");
      this.setTooltip("Start this script when a broadcast message is received");
      // Hat-style: no previous statement
      this.setNextStatement(false);
      this.setPreviousStatement(false);
    },
  };

  Blockly.Blocks["bp_broadcast"] = {
    init: function () {
      this.appendValueInput("MSG")
        .setCheck("String")
        .appendField("broadcast");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour("#FFCA28");
    },
  };

 // broadcast and wait
Blockly.Blocks["bp_broadcast_wait"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("broadcast and wait")
      .appendField(new Blockly.FieldTextInput("go"), "MSG");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FFD54F");
  },
};

// when I receive
Blockly.Blocks["bp_when_receive"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("when I receive")
      .appendField(new Blockly.FieldTextInput("go"), "MSG");
    this.appendStatementInput("DO").appendField("do");
    this.setColour("#FFD54F");
  },
};


}
