import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '../ui/badge';

export default function ActiveChips({ filters, onRemove }) {
    // Filtramos las llaves que no queremos mostrar como chips (búsqueda de texto o flags)
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
        if (key === 'q' || key === 'onlyMappable') return false;
        return value !== '' && value !== null && value !== undefined;
    });

    if (activeFilters.length === 0) return null;

    // Diccionario de traducción de keys técnicas a etiquetas amigables
    const labelMap = {
        country: 'País',
        vertical: 'Vertical',      // Sincronizado con Backend
        organizationType: 'Tipo',
        estadioActual: 'Etapa',    // Sincronizado con Backend
        outcomeStatus: 'Estado'
    };

    return (
        <div className="flex flex-wrap gap-2 pt-2">
            {activeFilters.map(([key, value]) => (
                <Badge
                    key={key}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border-none rounded-xl hover:bg-primary/20 transition-all shadow-sm"
                >
                    <span className="text-[9px] uppercase font-black opacity-50 tracking-tighter">
                        {labelMap[key] || key}
                    </span>
                    <span className="font-bold text-xs">{value}</span>
                    <button
                        onClick={() => onRemove(key, '')}
                        className="ml-0.5 bg-primary/20 hover:bg-primary/40 rounded-full p-0.5 transition-colors"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
        </div>
    );
}