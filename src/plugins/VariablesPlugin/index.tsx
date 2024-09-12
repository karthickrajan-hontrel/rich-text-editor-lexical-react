import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
  $getRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { $createVariableNode, VariableNode } from '../../nodes/VariableNode';

export const INSERT_VARIABLE_COMMAND = createCommand<{ value: string; displayText: string }>();

export default function VariablesPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([VariableNode])) {
      throw new Error('VariablesPlugin: VariableNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand(
        INSERT_VARIABLE_COMMAND,
        ({ value, displayText }) => {
          editor.update(() => {
            const root = $getRoot();
            const variableNode = $createVariableNode(value, displayText);
            root.append(variableNode);
            variableNode.selectEnd();
          });
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
    );
  }, [editor]);

  return null;
}