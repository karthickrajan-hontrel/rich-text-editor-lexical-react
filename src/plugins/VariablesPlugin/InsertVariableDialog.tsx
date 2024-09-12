// InsertVariableDialog.tsx
import { useState, useEffect, useCallback } from 'react';
import { LexicalEditor } from 'lexical';
import { INSERT_VARIABLE_COMMAND } from '.';
import DropDown, { DropDownItem } from '../../ui/DropDown';
import Button from '../../ui/Button';

type Option = { label: string; value: string, placeholder: string };

export default function InsertVariableDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}) {
  const [options, setOptions] = useState<Option[]>([]);
  const [variable, setVariable] = useState<Option | null>(null);

  useEffect(() => {
    fetch('https://dummyapi.online/api/products')
      .then((response) => response.json())
      .then((data) => {
        const ops = data.map((item: { name: string; id: number; brand: string }) => ({
          label: item.name,
          value: item.name,
          placeholder: item.brand
        }));
        setOptions(ops);
        if (ops.length > 0) {
          setVariable(ops[0]);
        }
      });
  }, []);

  const insertVariable = useCallback(() => {
    if (variable) {
      activeEditor.dispatchCommand(INSERT_VARIABLE_COMMAND, {
        value: `{{ ${variable.placeholder} }}`,
        displayText: variable.label,
      });
      onClose();
    }
  }, [activeEditor, variable, onClose]);

  return (
    <>
      <DropDown
        buttonClassName="toolbar-item dialog-dropdown"
        buttonLabel={options.find((opt) => opt.value === variable?.value)?.label || 'Select a variable'}
      >
        {options.map((op) => (
          <DropDownItem className="item" key={op.value} onClick={() => setVariable(op)}>
            {op.label}
          </DropDownItem>
        ))}
      </DropDown>
      <Button onClick={insertVariable} disabled={!variable}>
        Insert Variable
      </Button>
    </>
  );
}
