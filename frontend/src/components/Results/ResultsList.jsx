import React from 'react';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { MapPin, ArrowRight } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export default function ResultsList({ organizations, onSelect, loading, hideHeader = false }) {
    if (loading) {
        return (
            <div className="p-5 space-y-6">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-5 w-3/4 rounded-lg" />
                        <Skeleton className="h-4 w-1/2 rounded-lg" />
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!organizations || organizations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
                <div className="bg-primary/5 p-6 rounded-3xl mb-4">
                    <MapPin className="h-10 w-10 text-primary opacity-40" />
                </div>
                <h3 className="font-bold text-lg tracking-tight">Sin resultados</h3>
                <p className="text-sm text-muted-foreground mt-2 px-6 leading-relaxed">
                    Prueba a ajustar los filtros o mover el mapa para encontrar lo que buscas.
                </p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col">
                {!hideHeader && (
                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur p-4 border-b text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Lista de Resultados ({organizations.length})
                    </div>
                )}
                {organizations.map((org) => (
                    <div
                        key={org.id}
                        onClick={() => onSelect(org)}
                        className="group relative p-6 border-b last:border-0 hover:bg-slate-50 cursor-pointer transition-all duration-300"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-base leading-tight text-foreground group-hover:text-primary transition-colors pr-8">
                                {org.name}
                            </h3>
                            <ArrowRight className="h-4 w-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 absolute right-6 top-6" />
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5 font-semibold tracking-tight">
                            <MapPin className="h-3.5 w-3.5 text-primary/60" />
                            <span>{org.country}{org.city ? ` · ${org.city}` : ''}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge
                                variant="secondary"
                                className="text-[10px] uppercase font-black px-2.5 py-0.5 bg-muted/40 text-muted-foreground border-none tracking-widest"
                            >
                                {org.organizationType}
                            </Badge>
                            
                            {/* ALINEACIÓN: Usamos vertical en lugar de sectorPrimary */}
                            <Badge
                                className="text-[10px] uppercase font-black px-2.5 py-0.5 bg-primary/10 text-primary border-none tracking-widest"
                            >
                                {org.vertical}
                            </Badge>

                            {/* ALINEACIÓN: Usamos estadioActual en lugar de stage */}
                            {org.estadioActual && (
                                <Badge
                                    className="text-[10px] uppercase font-black px-2.5 py-0.5 bg-accent/20 text-accent-foreground border-none tracking-widest"
                                >
                                    {org.estadioActual}
                                </Badge>
                            )}
                        </div>

                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}