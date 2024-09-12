// VariablesPlugin.tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { createCommand, $getRoot } from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { $createVariableNode, VariableNode } from '../../nodes/VariableNode';

export const INSERT_VARIABLE_COMMAND = createCommand<string>('INSERT_VARIABLE_COMMAND');

export default function VariablesPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([VariableNode])) {
      throw new Error('VariableNode not registered in the editor');
    }

    return mergeRegister(
      editor.registerCommand(
        INSERT_VARIABLE_COMMAND,
        (variableName) => {
          editor.update(() => {
            const root = $getRoot();
            const variableNode = $createVariableNode(variableName);
            root.append(variableNode); // Insert node at root
          });
          return true;
        },
        0 // Use a priority value of 0 or COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);

  return null;
}
