// components/Filters/VariableSelector.tsx
// Componente para seleção de variável oceanográfica

import React from 'react';
import { VariableId } from '../../types/copernicus';
import { VARIABLES } from '../../constants/datasets';

interface VariableSelectorProps {
  selectedVariable: VariableId;
  onVariableChange: (variableId: VariableId) => void;
}

export function VariableSelector({
  selectedVariable,
  onVariableChange
}: VariableSelectorProps) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/95 backdrop-blur-md rounded-lg border border-ocean-500/30 shadow-lg">
      <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
        Variável Oceanográfica
      </h3>

      <div className="grid grid-cols-1 gap-2">
        {(Object.keys(VARIABLES) as VariableId[]).map((varId) => {
          const variable = VARIABLES[varId];
          const isSelected = selectedVariable === varId;

          return (
            <button
              key={varId}
              onClick={() => onVariableChange(varId)}
              className={`px-3 py-2 rounded-lg text-left text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-ocean-500 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{variable.name}</span>
                <span className="text-[10px] opacity-70">{variable.unit}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
