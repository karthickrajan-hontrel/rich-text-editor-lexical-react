/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {LexicalEditor} from 'lexical';
import * as React from 'react';
import {useState} from 'react';

import Button from '../../ui/Button';
import DropDown, {DropDownItem} from '../../ui/DropDown';
import { INSERT_VARIABLE_COMMAND } from '.';

export default function InsertVariableDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [variable, setVariable] = useState<string>('');
  const buttonLabel = options.find((item) => item.value === variable)?.label;

  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_VARIABLE_COMMAND, variable);
    onClose();
  };

  React.useEffect(() => {
    fetch('https://dummyapi.online/api/products')
    .then((response) => response.json())
    .then((json) => {
        const ops = json.map(((j: { name: string; id: number }) => ({ ...j, label: j.name, value: j.name.toLowerCase().replaceAll(" ", "") })));
        setOptions(ops);
        if (ops.length > 0) {
            setVariable(ops[0].value);
        }
    })
  }, [])

  return (
    <>
      <DropDown
        buttonClassName="toolbar-item dialog-dropdown"
        buttonLabel={buttonLabel}>
        {options.map(({label, value}) => (
          <DropDownItem
            key={value}
            className="item"
            onClick={() => setVariable(value)}>
            <span className="text">{label}</span>
          </DropDownItem>
        ))}
      </DropDown>
      <Button onClick={onClick}>Insert</Button>
    </>
  );
}
