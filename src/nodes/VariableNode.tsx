import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $applyNodeReplacement,
  TextNode,
  SerializedTextNode,
  Spread,
  EditorConfig,
  NodeKey,
  LexicalNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  $getSelection,
  COMMAND_PRIORITY_LOW,
  KEY_DELETE_COMMAND,
  KEY_BACKSPACE_COMMAND,
  CLICK_COMMAND,
  $getNodeByKey,
  $isNodeSelection,
  $isRangeSelection,
  $isTextNode,
  RangeSelection,
  $isElementNode,
  $setSelection,
  $createRangeSelection,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useCallback, useEffect } from 'react';

export type SerializedVariableNode = Spread<
  {
    variableName: string;
    type: 'variable';
    version: 1;
  },
  SerializedTextNode
>;

function convertVariableElement(domNode: HTMLElement): DOMConversionOutput | null {
  const textContent = domNode.textContent;
  if (textContent !== null) {
    const node = $createVariableNode(textContent);
    return { node };
  }
  return null;
}

// function VariableComponent({ nodeKey }: { nodeKey: NodeKey }) {
//   const [editor] = useLexicalComposerContext();
//   const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

//   const onDelete = useCallback(
//     (event: KeyboardEvent) => {
//       event.preventDefault()
//       const selection = $getSelection();
//       console.log('Current Selection:', selection);  // Debugging selection
//       const node = $getNodeByKey(nodeKey);
//       console.log('Node Key:', nodeKey);  // Debugging node key
  
//       // Ensure we're dealing with a VariableNode
//       if ($isVariableNode(node)) {
//         if (isSelected || ($isRangeSelection(selection) && selection.isCollapsed())) {
//           event.preventDefault();
//           console.log('Deleting VariableNode');  // Debugging when deletion is triggered
//           node.remove();
//           return true;
//         }
//       }
//       return false;
//     },
//     [isSelected, nodeKey],
//   );

//   useEffect(() => {
//     return mergeRegister(
//       // Register click command to handle node selection
//       editor.registerCommand(
//         CLICK_COMMAND,
//         (event: MouseEvent) => {
//           const element = editor.getElementByKey(nodeKey);
//           if (event.target === element) {
//             if (!event.shiftKey) {
//               clearSelection();
//             }
//             setSelected(!isSelected);
//             return true;
//           }
//           return false;
//         },
//         COMMAND_PRIORITY_LOW,
//       ),
//       // Register backspace command
//       editor.registerCommand(
//         KEY_BACKSPACE_COMMAND,
//         (event: KeyboardEvent) => {
//           const selection = $getSelection();
//           console.log('Backspace Pressed. Selection:', selection);  // Debugging
      
//           if ($isRangeSelection(selection)) {
//             const anchorNode = selection.anchor.getNode();
//             const focusNode = selection.focus.getNode();
      
//             console.log('Anchor Node:', anchorNode.getTextContent());  // Debugging
//             console.log('Focus Node:', focusNode.getTextContent());    // Debugging
      
//             if (
//               ($isVariableNode(anchorNode) && $isVariableNode(focusNode)) ||
//               ($isVariableNode(anchorNode) && anchorNode.getKey() === nodeKey) ||
//               ($isVariableNode(focusNode) && focusNode.getKey() === nodeKey)
//             ) {
//               event.preventDefault();
//               const node = $getNodeByKey(nodeKey);
//               if (node) {
//                 console.log('Removing VariableNode');  // Debugging node removal
//                 node.remove();
//                 return true;
//               }
//             }
//           }
      
//           // Call the onDelete logic to ensure deletion occurs if needed
//           return onDelete(event);
//         },
//         COMMAND_PRIORITY_LOW,
//       ),
//       // Register delete command
//       editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW)
//     );
//   }, [clearSelection, editor, isSelected, nodeKey, onDelete, setSelected]);

//   return null;
// }


export class VariableNode extends TextNode {
  __variableName: string;

  static getType(): string {
    return 'variable';
  }

  static clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__variableName, node.__text, node.__key);
  }

  constructor(variableName: string, text?: string, key?: NodeKey) {
    super(text || variableName, key); // No need to wrap with brackets as they're already in the variable name
    this.__variableName = variableName;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.setAttribute('data-lexical-variable', 'true');
    dom.classList.add('variable-node');
    dom.style.display = 'block'; // Ensure it's inline within text
    dom.style.fontWeight = 'bold';
    dom.style.cursor = 'pointer';
    return dom;
  }

  updateDOM(prevNode: VariableNode, dom: HTMLElement, config: EditorConfig): boolean {
    console.log("prevNode", prevNode, this, dom)
    const isUpdated = super.updateDOM(prevNode, dom, config);
    return isUpdated || prevNode.__variableName !== this.__variableName;
  }

  static importJSON(serializedNode: SerializedVariableNode): VariableNode {
    const node = $createVariableNode(serializedNode.variableName);
    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON(): SerializedVariableNode {
    return {
      ...super.exportJSON(),
      variableName: this.__variableName,
      type: 'variable',
      version: 1,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-variable', 'true');
    element.textContent = this.getTextContent();
    element.style.fontWeight = 'bold';
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.hasAttribute('data-lexical-variable')) {
          return {
            conversion: convertVariableElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  isTextEntity(): boolean {
    return true;
  }

  canInsertText(): boolean {
    return false
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  canBeEmpty(): boolean {
    return false;
  }
}

export function $createVariableNode(variableName: string): VariableNode {
  const variableNode = new VariableNode(variableName);
  variableNode.setMode('segmented').toggleDirectionless();
  return $applyNodeReplacement(variableNode);
}

export function $isVariableNode(node: LexicalNode | null | undefined): node is VariableNode {
  return node instanceof VariableNode;
}
