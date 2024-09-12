// VariableNode.ts
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  type DOMConversionMap,
  type DOMExportOutput,
  type EditorConfig,
  LexicalNode,
  DOMConversionOutput,
  KEY_BACKSPACE_COMMAND,
  $getSelection,
  COMMAND_PRIORITY_LOW,
  KEY_DELETE_COMMAND,
  $isNodeSelection,
  NodeKey,
  $getNodeByKey,
  CLICK_COMMAND,
  DecoratorNode,
} from 'lexical';
import { useCallback, useEffect } from 'react';

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

function VariableComponent({nodeKey}: {nodeKey: NodeKey}) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  const onDelete = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault();
      if (isSelected && $isNodeSelection($getSelection())) {
        const node = $getNodeByKey(nodeKey);
        if ($isVariableNode(node)) {
          node.remove();
          return true;
        }
      }
      return false;
    },
    [isSelected, nodeKey],
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          const pbElem = editor.getElementByKey(nodeKey);

          if (event.target === pbElem) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(!isSelected);
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [clearSelection, editor, isSelected, nodeKey, onDelete, setSelected]);

  useEffect(() => {
    const pbElem = editor.getElementByKey(nodeKey);
    if (pbElem !== null) {
      pbElem.className = isSelected ? 'selected' : '';
    }
  }, [editor, isSelected, nodeKey]);

  return null;
}


// const variableStyle = 'background-color: rgba(103, 58, 183, 0.2)';

export class VariableNode extends DecoratorNode<JSX.Element> {
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

  static importJSON(serializedNode: SerializedVariableNode): VariableNode {
    const { variableName, displayText } = serializedNode;
    return new VariableNode(variableName, displayText);
  }

  exportJSON(): SerializedVariableNode {
    return {
      variableName: this.__variableName,
      displayText: this.__displayText,
      type: VariableNode.getType(),
      version: 1,
    };
  }
  

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
    dom.appendChild(document.createElement('br')); // Add break
    dom.appendChild(boldElement);
    dom.appendChild(document.createElement('br')); // Add break
    dom.appendChild(document.createTextNode(' ')); // Add Space

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
    element.appendChild(document.createElement('br')); // Add break
    element.appendChild(document.createTextNode(' ')); // Add Space

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

  decorate(): JSX.Element {
    return <VariableComponent nodeKey={this.__key} />;
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
