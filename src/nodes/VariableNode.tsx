// VariableNode.ts
import {
  type DOMConversionMap,
  type DOMExportOutput,
  type EditorConfig,
  ElementNode,
  LexicalNode,
  DOMConversionOutput,
} from 'lexical';

export type SerializedVariableNode = {
  variableName: string;
  type: string;
  version: number;
};


function convertVariableElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const textContent = domNode.textContent;

  if (textContent !== null) {
    const node = $createVariableNode(textContent);
    return {
      node,
    };
  }

  return null;
}

const variableStyle = 'background-color: rgba(103, 58, 183, 0.2)';

export class VariableNode extends ElementNode {
  __variableName: string;

  static getType(): string {
    return 'variable';
  }

  static clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__variableName, node.__key);
  }

  constructor(variableName: string, key?: string) {
    super(key);
    this.__variableName = variableName;
  }

  // Importing a node from JSON
  static importJSON(serializedNode: SerializedVariableNode): VariableNode {
    const { variableName } = serializedNode;
    return new VariableNode(variableName);
  }

  // Exporting a node to JSON
  // exportJSON(): SerializedVariableNode {
  //   return {
  //     variableName: this.__variableName,
  //     type: VariableNode.getType(),
  //     version: 1,
  //   };
  // }

  // Create the DOM element for this node
  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('span');
    dom.style.cssText = variableStyle;
    dom.textContent = this.__variableName;
    return dom;
  }

  // Export the DOM element to HTML
  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.style.cssText = variableStyle;
    element.textContent = this.__variableName;
    return { element };
  }

  // Define how this node should be updated in the DOM
  updateDOM(prevNode: VariableNode): boolean {
    return prevNode.__variableName !== this.__variableName;
  }

  // Conversion from DOM to Lexical node
  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-mention')) {
          return null;
        }
        return {
          conversion: convertVariableElement,
          priority: 1,
        };
      },
    };
  }
}

// Helper function to create a VariableNode
export function $createVariableNode(variableName: string): VariableNode {
  return new VariableNode(variableName);
}

// Helper function to check if a node is a VariableNode
export function $isVariableNode(node: LexicalNode | null | undefined): node is VariableNode {
  return node instanceof VariableNode;
}
