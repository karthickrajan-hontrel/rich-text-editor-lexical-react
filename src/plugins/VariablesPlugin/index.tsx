import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  DELETE_CHARACTER_COMMAND,
  KEY_BACKSPACE_COMMAND,
  LexicalCommand,
  LexicalEditor
} from 'lexical';
import { useEffect } from 'react';
import { $createVariableNode, $isVariableNode, VariableNode } from '../../nodes/VariableNode';
import { mergeRegister } from '@lexical/utils';

export const INSERT_VARIABLE_COMMAND: LexicalCommand<string> = createCommand();

export default function VariablesPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([VariableNode])) {
      throw new Error('VariablesPlugin: VariableNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<string>(
        INSERT_VARIABLE_COMMAND,
        (variableName) => {
          const selection = $getSelection();
  
          if ($isRangeSelection(selection)) {
            const variableNode = $createVariableNode(variableName);
            selection.insertNodes([variableNode]);
  
            // // Insert a space after the variable
            // const spaceNode = $createTextNode(' ');
            // variableNode.insertAfter(spaceNode);
  
            // Move the selection after the space
            variableNode.select();
          }
  
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),

     // Handle deleting variable node on backspace
     editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        const selection = $getSelection();
        console.log("selection", selection)

        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const focusNode = selection.focus.getNode();

          // Ensure both anchor and focus are the same node (no range)
          if (anchorNode === focusNode) {
            // Check if the previous sibling is a VariableNode and remove it
            const prevSibling = anchorNode.getPreviousSibling();
            if ($isVariableNode(prevSibling)) {
              const nodeKey = prevSibling.getKey();
              const node = $getNodeByKey(nodeKey);

              if ($isVariableNode(node)) {
                event.preventDefault(); // Prevent default backspace action
                node.remove(); // Remove the entire VariableNode
                return true; // Indicate that we handled the event
              }
            }
          }
        }

        return false; // Let Lexical handle other cases
      },
      COMMAND_PRIORITY_EDITOR
    )
    );
  }, [editor]);

  return null;
}

// Helper function to trigger variable insertion
export function insertVariable(editor: LexicalEditor, variableName: string) {
  editor.dispatchCommand(INSERT_VARIABLE_COMMAND, variableName);
}