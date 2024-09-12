// VariableNode.ts
import {
  type DOMConversionMap,
  type DOMExportOutput,
  type EditorConfig,
  ElementNode,
  LexicalNode,
  DOMConversionOutput,
  LexicalEditor,
  KEY_BACKSPACE_COMMAND,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
} from 'lexical';

export type SerializedVariableNode = {
  variableName: string;
  displayText: string;
  type: string;
  version: number;
};

function convertVariableElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const italicText = domNode.querySelector('i')?.textContent || '';
  const boldText = domNode.querySelector('b')?.textContent || '';

  if (italicText !== null && boldText !== null) {
    const node = $createVariableNode(italicText, boldText);
    return {
      node,
    };
  }

  return null;
}

// const variableStyle = 'background-color: rgba(103, 58, 183, 0.2)';

export class VariableNode extends ElementNode {
  __variableName: string;
  __displayText: string;

  static getType(): string {
    return 'variable';
  }

  static clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__variableName, node.__displayText, node.__key);
  }

  constructor(variableName: string, displayText: string, key?: string) {
    super(key);
    this.__variableName = variableName;
    this.__displayText = displayText;
  }

  // Deletion handling logic
  static registerCommandHandlers(editor: LexicalEditor) {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event: KeyboardEvent) => {
        event.preventDefault();
        const selection = $getSelection();
        if ($isRangeSelection(selection) && selection.isCollapsed()) {
          const node = selection.anchor.getNode();
          console.log("nodenodenode", node)
          if ($isVariableNode(node)) {
            editor.update(() => {
              node.remove();
            });
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }

  static importJSON(serializedNode: SerializedVariableNode): VariableNode {
    const { variableName, displayText } = serializedNode;
    return new VariableNode(variableName, displayText);
  }

  // exportJSON(): SerializedVariableNode {
  //   return {
  //     variableName: this.__variableName,
  //     displayText: this.__displayText,
  //     type: VariableNode.getType(),
  //     version: 1,
  //   };
  // }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('span');
    // dom.style.cssText = variableStyle;

    // Create italic part for "bom-A.name"
    const italicElement = document.createElement('i');
    italicElement.textContent = this.__variableName;

    // Create bold part for "Pipeline Structure"
    const boldElement = document.createElement('b');
    boldElement.textContent = this.__displayText;

    // Append to the main span
    dom.appendChild(italicElement);
    dom.appendChild(document.createElement('br')); // Add a space
    dom.appendChild(boldElement);

    return dom;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    // element.style.cssText = variableStyle;

    const italicElement = document.createElement('i');
    italicElement.textContent = this.__variableName;

    const boldElement = document.createElement('b');
    boldElement.textContent = this.__displayText;

    element.appendChild(italicElement);
    element.appendChild(document.createElement('br'));
    element.appendChild(boldElement);

    return { element };
  }

  updateDOM(prevNode: VariableNode): boolean {
    return (
      prevNode.__variableName !== this.__variableName ||
      prevNode.__displayText !== this.__displayText
    );
  }

  static importDOM(): DOMConversionMap {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.hasAttribute('data-lexical-variable')) {
          return {
            conversion: convertVariableElement,
            priority: 2,
          };
        }
        return null;
      },
    };
  }
}

// Helper function to create a VariableNode
export function $createVariableNode(variableName: string, displayText: string): VariableNode {
  return new VariableNode(variableName, displayText);
}

// Helper function to check if a node is a VariableNode
export function $isVariableNode(node: LexicalNode | null | undefined): node is VariableNode {
  return node instanceof VariableNode;
}
