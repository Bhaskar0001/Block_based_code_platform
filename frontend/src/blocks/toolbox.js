export const toolboxXml = `
<xml xmlns="https://developers.google.com/blockly/xml">


<category name="Events" colour="#FFCA28">
    <block type="bp_when_receive"></block>
    <block type="bp_broadcast">
      <value name="MSG"><shadow type="text"><field name="TEXT">go</field></shadow></value>
    </block>
    <block type="bp_broadcast_wait">
      <value name="MSG"><shadow type="text"><field name="TEXT">go</field></shadow></value>
    </block>
  </category>



  <category name="Action" colour="#7C4DFF">
    <block type="bp_start"></block>

    <block type="bp_move">
      <value name="STEPS">
        <shadow type="math_number"><field name="NUM">100</field></shadow>
      </value>
    </block>

    <block type="bp_turn">
      <value name="DEG">
        <shadow type="math_number"><field name="NUM">15</field></shadow>
      </value>
    </block>

    <block type="bp_wait">
      <value name="SECS">
        <shadow type="math_number"><field name="NUM">1</field></shadow>
      </value>
    </block>

    <block type="bp_stop_all"></block>
    <block type="bp_stop_this"></block>

  </category>

  <category name="Control" colour="#FF7043">
    <block type="bp_repeat">
      <value name="TIMES">
        <shadow type="math_number"><field name="NUM">10</field></shadow>
      </value>
    </block>

    <block type="bp_forever"></block>
    <block type="bp_if"></block>
    <block type="bp_if_else"></block>

    <sep></sep>
    <block type="bp_break"></block>
    <block type="bp_continue"></block>
  </category>

  <category name="Logic" colour="#26A69A">
    <block type="logic_compare"></block>
    <block type="logic_operation"></block>
    <block type="logic_boolean"></block>
  </category>

  <category name="Math" colour="#42A5F5">
    <block type="math_number"></block>
    <block type="math_arithmetic"></block>
  </category>

  <category name="Variables" colour="#FFD54F" custom="VARIABLE"></category>

  <category name="Variables Advanced" colour="#FFD54F">
    <block type="bp_delete_var"></block>
  </category>
</xml>
`;
