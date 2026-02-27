import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '../ui/accordion';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../ui/select';
import { useTaxonomies } from '../../context/TaxonomiesContext';

export default function FiltersPanel({ filters, onFilterChange, aggregates, loading = false }) {
    const { taxonomies } = useTaxonomies();

    // Función para combinar etiquetas de taxonomía con conteos en tiempo real
    const getOptionsWithCounts = (category, aggregateField) => {
        const taxonomyList = taxonomies[category] || [];
        const aggregateList = aggregates && aggregates[aggregateField] ? aggregates[aggregateField] : [];

        const countMap = {};
        aggregateList.forEach(item => {
            countMap[item.value] = item.count;
        });

        // Si el backend devolvió agregados, los usamos como fuente de verdad
        if (aggregateList.length > 0) {
            return aggregateList
                .filter(item => item.value && item.value.trim() !== '')
                .map(item => {
                    const taxMatch = taxonomyList.find(t => t.value === item.value || t.id === item.value);
                    return {
                        value: item.value,
                        label: taxMatch?.label || item.value,
                        count: item.count
                    };
                });
        }

        // Fallback: mostrar opciones de taxonomía con conteo 0 si no hay datos aún
        return taxonomyList
            .filter(t => (t.value || t.id) && (t.value || t.id).trim() !== '')
            .map(t => ({
                value: t.value || t.id,
                label: t.label || t.value,
                count: 0
            }));
    };

    /**
     * CONFIGURACIÓN CRÍTICA: 
     * 'agg' debe coincidir con la llave JSON del backend (Go struct).
     * 'key' debe coincidir con el parámetro esperado por el repositorio SQL.
     */
    const filterConfigs = [
        { key: 'country', label: 'País / Región', agg: 'countries', tax: 'country' },
        { key: 'vertical', label: 'Vertical Principal', agg: 'verticals', tax: 'vertical' },
        { key: 'organizationType', label: 'Tipo de Organización', agg: 'organizationTypes', tax: 'organizationType' },
        { key: 'estadioActual', label: 'Etapa / Madurez', agg: 'estadios', tax: 'estadioActual' },
        { key: 'outcomeStatus', label: 'Estado de Impacto', agg: 'outcomeStatuses', tax: 'outcomeStatus' },
    ];

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <Accordion type="multiple" className="w-full space-y-3">
                {filterConfigs.map((config) => {
                    const options = getOptionsWithCounts(config.tax, config.agg);
                    const currentValue = filters[config.key] || "all";

                    return (
                        <AccordionItem
                            key={config.key}
                            value={config.key}
                            className="border-none bg-muted/30 rounded-2xl px-5 transition-all data-[state=open]:bg-muted/50"
                        >
                            <AccordionTrigger className="hover:no-underline py-4">
                                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-foreground/70">
                                    {config.label} {filters[config.key] && "●"}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="pb-5">
                                <Select
                                    value={currentValue}
                                    onValueChange={(val) => onFilterChange(config.key, val === "all" ? "" : val)}
                                >
                                    <SelectTrigger className="w-full h-10 bg-background border-none shadow-sm rounded-xl font-bold text-[12px] focus:ring-2 focus:ring-primary/20">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-2xl z-[9999]">
                                        <SelectItem value="all" className="font-extrabold text-[9px] uppercase opacity-50">Todos</SelectItem>
                                        {options.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                <div className="flex justify-between items-center w-full gap-6 min-w-[180px]">
                                                    <span className="font-bold text-[12px]">{opt.label}</span>
                                                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black tabular-nums">
                                                        {opt.count}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </div>
    );
}