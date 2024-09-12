// VariablesPlugin.tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { createCommand, $getRoot, KEY_BACKSPACE_COMMAND, $getSelection, COMMAND_PRIORITY_HIGH, $isRangeSelection, $isNodeSelection } from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { $createVariableNode, $isVariableNode, VariableNode } from '../../nodes/VariableNode';

export const INSERT_VARIABLE_COMMAND = createCommand<{ value: string; displayText: string }>(
  'INSERT_VARIABLE_COMMAND'
);

export default function VariablesPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([VariableNode])) {
      throw new Error('VariableNode not registered in the editor');
    }

    return mergeRegister(
      editor.registerCommand(
        INSERT_VARIABLE_COMMAND,
        ({ value, displayText }) => {
          editor.update(() => {
            const root = $getRoot();
            const variableNode = $createVariableNode(value, displayText);
            root.append(variableNode);
          });
          return true;
        },
        0 // Use a priority value of 0 or COMMAND_PRIORITY_EDITOR
      ),
      VariableNode.registerCommandHandlers(editor),
    );
  }, [editor]);

  return null;
}
