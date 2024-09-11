/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {LexicalCommand} from 'lexical';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot, mergeRegister} from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import {useEffect} from 'react';

import { $createVariableNode, VariableNode } from '../../nodes/VariableNode';

export const INSERT_VARIABLE_COMMAND: LexicalCommand<string> =
  createCommand<string>();

export function VariablesPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([VariableNode]))
      throw new Error(
        'VariablesPlugin: VariableNode is not registered on editor',
      );

    return mergeRegister(
        editor.registerCommand(
        INSERT_VARIABLE_COMMAND,
        (value) => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection)) return false;

          const focusNode = selection.focus.getNode();
          if (focusNode !== null) {
            const variable = $createVariableNode(value);
            console.log("valuevaluevaluevalue", value, variable)
            $insertNodeToNearestRoot(variable);
            variable.select();
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  return null;
}
