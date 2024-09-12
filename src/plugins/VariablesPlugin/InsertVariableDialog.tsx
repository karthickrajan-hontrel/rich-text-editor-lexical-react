// InsertVariableDialog.tsx
import { useState, useEffect, useCallback } from 'react';
import { LexicalEditor } from 'lexical';
import { INSERT_VARIABLE_COMMAND } from '.';
import DropDown, { DropDownItem } from '../../ui/DropDown';
import Button from '../../ui/Button';

export default function InsertVariableDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [variable, setVariable] = useState<string>('');

  useEffect(() => {
    // Fetch data from API
    fetch('https://dummyapi.online/api/products')
      .then((response) => response.json())
      .then((data) => {
        const ops = data.map((item: { name: string; id: number }) => ({
          label: item.name,
          value: item.name.toLowerCase().replace(' ', ''),
        }));
        setOptions(ops);
        setVariable(ops[0]?.value || '');
      });
  }, []);

  const insertVariable = useCallback(() => {
    if (variable) {
      activeEditor.dispatchCommand(INSERT_VARIABLE_COMMAND, variable);
      onClose();
    }
  }, [activeEditor, variable, onClose]);

  return (
    <>
      <DropDown
        buttonClassName="toolbar-item dialog-dropdown"
        buttonLabel={options.find((opt) => opt.value === variable)?.label || 'Select a variable'}
      >
        {options.map(({ label, value }) => (
          <DropDownItem  className="item" key={value} onClick={() => setVariable(value)}>
            {label}
          </DropDownItem>
        ))}
      </DropDown>
      <Button onClick={insertVariable} disabled={!variable}>
        Insert Variable
      </Button>
    </>
  );
}
