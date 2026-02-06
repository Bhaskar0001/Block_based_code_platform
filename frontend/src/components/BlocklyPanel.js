import React, { useEffect, useRef } from "react";
import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/javascript";
import "./BlocklyPanel.css";

import { registerBlocks } from "../blocks/registerBlocks";
import { toolboxXml } from "../blocks/toolbox";

const DEFAULT_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="bp_start" x="20" y="20">
    <next>
      <block type="bp_move">
        <value name="STEPS">
          <block type="math_arithmetic">
            <field name="OP">ADD</field>
            <value name="A">
              <shadow type="math_number"><field name="NUM">50</field></shadow>
            </value>
            <value name="B">
              <shadow type="math_number"><field name="NUM">50</field></shadow>
            </value>
          </block>
        </value>
        <next>
          <block type="bp_wait">
            <value name="SECS">
              <shadow type="math_number"><field name="NUM">1</field></shadow>
            </value>
            <next>
              <block type="bp_move">
                <value name="STEPS">
                  <block type="math_arithmetic">
                    <field name="OP">MULTIPLY</field>
                    <value name="A">
                      <shadow type="math_number"><field name="NUM">20</field></shadow>
                    </value>
                    <value name="B">
                      <shadow type="math_number"><field name="NUM">5</field></shadow>
                    </value>
                  </block>
                </value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>
`;


// ✅ Works across Blockly versions
function xmlTextToDom(xmlText) {
  // Newer Blockly versions
  if (Blockly.utils && Blockly.utils.xml && typeof Blockly.utils.xml.textToDom === "function") {
    return Blockly.utils.xml.textToDom(xmlText);
  }
  // Older Blockly versions
  if (Blockly.Xml && typeof Blockly.Xml.textToDom === "function") {
    return Blockly.Xml.textToDom(xmlText);
  }
  throw new Error("No XML textToDom available in this Blockly build.");
}

export default function BlocklyPanel({ onReady }) {
  const blocklyDivRef = useRef(null);
  const workspaceRef = useRef(null);

  useEffect(() => {
    registerBlocks(Blockly);

    const workspace = Blockly.inject(blocklyDivRef.current, {
      toolbox: toolboxXml,
      trashcan: true,
      zoom: { controls: true, wheel: true, startScale: 0.95 },
      move: { scrollbars: true, drag: true, wheel: true },
      renderer: "zelos",
    });

    workspaceRef.current = workspace;

    // ✅ ResizeObserver (no try/catch)
    const ro = new ResizeObserver(() => {
      if (workspaceRef.current) Blockly.svgResize(workspaceRef.current);
    });
    ro.observe(blocklyDivRef.current);

    requestAnimationFrame(() => Blockly.svgResize(workspace));

    // ✅ Load starter script ONLY if empty
    if (workspace.getAllBlocks(false).length === 0) {
      const dom = xmlTextToDom(DEFAULT_XML);
      Blockly.Xml.domToWorkspace(dom, workspace);
      requestAnimationFrame(() => Blockly.svgResize(workspace));
    }

    onReady({
      getWorkspace: () => workspaceRef.current,

      save: () => {
        // Prefer JSON serialization if available
        if (Blockly.serialization && Blockly.serialization.workspaces) {
          return Blockly.serialization.workspaces.save(workspaceRef.current);
        }
        // Fallback: XML text
        const dom = Blockly.Xml.workspaceToDom(workspaceRef.current);
        return { xml: Blockly.Xml.domToText(dom) };
      },

      load: (data) => {
        workspaceRef.current.clear();

        // If JSON serialization
        if (data && !data.xml && Blockly.serialization && Blockly.serialization.workspaces) {
          Blockly.serialization.workspaces.load(data, workspaceRef.current);
          requestAnimationFrame(() => Blockly.svgResize(workspaceRef.current));
          return;
        }

        // If XML fallback
        if (data && data.xml) {
          const dom = xmlTextToDom(data.xml);
          Blockly.Xml.domToWorkspace(dom, workspaceRef.current);
          requestAnimationFrame(() => Blockly.svgResize(workspaceRef.current));
        }
      },
    });

    return () => {
      ro.disconnect();
      workspace.dispose();
    };
  }, [onReady]);

  return (
    <div className="blocklyWrap">
      <div className="blocklyHeader">Blocks Workspace</div>
      <div className="blocklyDiv" ref={blocklyDivRef} />
    </div>
  );
}
