import React, { useState, useEffect } from 'react';
import {
    X, ExternalLink, MapPin, Globe, Linkedin, Mail, Phone,
    Instagram, Tag, Info, Layers, Award
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { fetchOrganizationById } from '../../services/api';

export default function OrgDetailDrawer({ orgId, onClose }) {
    const lodoGreen = "#6FEA44";
    const lodoDark = "#59595B";

    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const formatLabel = (label) => {
        if (!label) return '';
        const clean = label.replace(/_/g, ' ').toLowerCase();
        return clean.charAt(0).toUpperCase() + clean.slice(1);
    };

    useEffect(() => {
        if (!orgId) return;
        setLoading(true);
        setError(null);
        fetchOrganizationById(orgId)
            .then(data => {
                setOrg(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [orgId]);

    return (
        <Dialog open={!!orgId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent hideClose className="fixed left-[50%] top-[52%] z-[9999] w-[95vw] max-w-[700px] h-[80vh] translate-x-[-50%] translate-y-[-45%] border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden flex flex-col">

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes border-walking {
                        0% { background-position: 0% 50%; }
                        100% { background-position: 200% 50%; }
                    }
                    @keyframes pulse-dot {
                        0% { transform: scale(0.9); opacity: 0.5; background-color: #e5e7eb; }
                        50% { transform: scale(1.1); opacity: 1; background-color: #6FEA44; }
                        100% { transform: scale(0.9); opacity: 0.5; background-color: #e5e7eb; }
                    }
                    .animated-type-border {
                        position: relative;
                        border: 1px solid transparent !important;
                        background: linear-gradient(white, white) padding-box,
                                    linear-gradient(90deg, #6FEA44 0%, #e5e7eb 50%, #6FEA44 100%) border-box;
                        background-size: 200% auto;
                        animation: border-walking 4s linear infinite;
                    }
                    .active-pulse-dot {
                        animation: pulse-dot 2s infinite ease-in-out;
                    }
                `}} />

                {loading ? (
                    <div className="p-8 space-y-6">
                        <Skeleton className="h-40 w-full rounded-3xl" />
                    </div>
                ) : org ? (
                    <>
                        {/* HEADER: Ajustado de h-40 a h-24 para subir todo el contenido */}
                        <div className="h-24 relative overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(111, 234, 68, 0.125), rgba(111, 234, 68, 0.02), transparent)' }}>
                            <div className="absolute inset-0 opacity-10" style={{ backgroundimage: 'radial-gradient(rgb(89, 89, 91) 0.5px, transparent 0.5px)', backgroundsize: '20px 20px' }}></div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="absolute right-6 top-6 bg-white/40 backdrop-blur-md hover:bg-white transition-all rounded-2xl z-50 h-10 w-10"
                            >
                                <X className="h-5 w-5" style={{ color: lodoDark }} />
                            </Button>
                        </div>

                        {/* CONTENIDO: Mantiene el -mt-16 para que el logo y los badges queden bien posicionados sobre el header corto */}
                        <div className="px-10 flex flex-col flex-1 min-h-0 bg-white rounded-t-[3rem] relative z-20 -mt-16">
                            <div className="flex flex-row items-end gap-6 mb-6">
                                <div className="bg-white p-4 rounded-[2rem] shadow-2xl border-4 border-white -mt-10 overflow-hidden w-28 h-28 flex items-center justify-center flex-shrink-0 relative z-30">
                                    {org.logoUrl ? <img src={org.logoUrl} alt={org.name} className="max-h-full max-w-full object-contain" /> : <Globe className="h-10 w-10 opacity-20" />}
                                </div>

                                <div className="flex flex-col pb-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="animated-type-border text-[9px] uppercase font-black tracking-[0.2em] px-3 h-6 flex items-center rounded-lg" style={{ color: lodoDark }}>
                                            {formatLabel(org.organizationType)}
                                        </div>
                                        <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-[0.2em] px-3 h-6 rounded-lg border-none" style={{ backgroundColor: `${lodoGreen}15`, color: '#2DA01D' }}>
                                            {formatLabel(org.vertical)}
                                        </Badge>
                                    </div>
                                    <DialogTitle className="text-3xl font-black tracking-tighter leading-none" style={{ color: lodoDark }}>{org.name}</DialogTitle>
                                    <DialogDescription className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mt-3" style={{ color: lodoDark }}>
                                        <MapPin className="h-3.5 w-3.5" style={{ color: lodoGreen }} />
                                        {org.location?.country || org.country}
                                        {(org.location?.region || org.region) ? `, ${formatLabel(org.location?.region || org.region)}` : ''}
                                        {(org.location?.city || org.city) ? ` · ${formatLabel(org.location?.city || org.city)}` : ''}
                                    </DialogDescription>
                                </div>
                            </div>

                            <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                                <TabsList className="w-full justify-start bg-transparent border-b rounded-none px-0 mb-6 gap-8 h-auto pb-0" style={{ borderColor: '#59595B08' }}>
                                    {['overview', 'location', 'links'].map((tab) => (
                                        <TabsTrigger
                                            key={tab}
                                            value={tab}
                                            className="group relative rounded-none px-0 pb-3 text-[9px] font-black uppercase tracking-[0.2em] data-[state=active]:border-b-4 bg-transparent shadow-none border-none outline-none focus-visible:ring-0 opacity-40 data-[state=active]:opacity-100 flex items-center gap-2"
                                            style={{ '--tw-state-active-border-color': lodoGreen, color: lodoDark }}
                                        >
                                            {tab === 'overview' ? 'Resumen' : tab === 'location' ? 'Ubicación' : 'Contacto'}
                                            <div className="h-1.5 w-1.5 rounded-full active-pulse-dot scale-0 group-data-[state=active]:scale-100 transition-transform" />
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                <ScrollArea className="flex-1 pr-2">
                                    <TabsContent value="overview" className="mt-0 space-y-8 pb-8">
                                        <section className="bg-[#f4f4f5] p-6 rounded-[2rem] border border-[#59595B05]">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-5 w-1 bg-[#6FEA44] rounded-full" />
                                                <h4 className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: lodoDark }}>Sobre la Solución</h4>
                                            </div>
                                            <p className="text-xs leading-relaxed font-bold opacity-70" style={{ color: lodoDark }}>{org.solucion}</p>
                                        </section>

                                        <Separator style={{ backgroundColor: `${lodoDark}10` }} />

                                        <div className="grid grid-cols-2 gap-8">
                                            <section>
                                                <div className="flex items-center gap-2 mb-4" style={{ color: lodoDark }}>
                                                    <Layers className="h-4 w-4" style={{ color: lodoGreen }} />
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Estado</h4>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="bg-white p-5 rounded-2xl border border-[#59595B05] shadow-sm">
                                                        <p className="text-[9px] font-black uppercase mb-1 opacity-40">Etapa Actual</p>
                                                        <p className="text-sm font-black tracking-tight" style={{ color: lodoDark }}>{formatLabel(org.estadioActual || org.estadio_actual)}</p>
                                                    </div>
                                                    <div className="bg-white p-5 rounded-2xl border border-[#59595B05] shadow-sm">
                                                        <p className="text-[9px] font-black uppercase mb-1 opacity-40">Estado Operativo</p>
                                                        <p className="text-sm font-black tracking-tight" style={{ color: lodoDark }}>{formatLabel(org.outcomeStatus || org.outcome_status)}</p>
                                                    </div>
                                                </div>
                                            </section>

                                            <section>
                                                <div className="flex items-center gap-2 mb-4" style={{ color: lodoDark }}>
                                                    <Tag className="h-4 w-4" style={{ color: lodoGreen }} />
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Atributos</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {(org.badges || []).map((badge, i) => (
                                                        <Badge key={i} variant="secondary" className="text-[9px] font-black uppercase tracking-widest h-7 px-3 rounded-lg border-none" style={{ backgroundColor: '#f4f4f5', color: lodoDark }}>{formatLabel(badge)}</Badge>
                                                    ))}
                                                    {org.founders?.length > 0 && (
                                                        <div className="w-full mt-6 bg-white p-5 rounded-2xl border border-[#59595B05] shadow-sm">
                                                            <p className="text-[9px] font-black uppercase mb-1 opacity-40">Fundadores</p>
                                                            <p className="text-sm font-black tracking-tight leading-relaxed" style={{ color: lodoDark }}>{org.founders.join(', ')}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="location" className="mt-0 space-y-6 pb-8">
                                        <div className="rounded-[2rem] border bg-white p-7 space-y-4 shadow-xl" style={{ borderColor: '#59595B08' }}>
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-2xl shadow-inner" style={{ backgroundColor: `${lodoGreen}10` }}>
                                                    <MapPin className="h-5 w-5" style={{ color: lodoGreen }} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-xl tracking-tighter" style={{ color: lodoDark }}>{(org.location?.city || org.city) || 'Ubicación'}</h4>
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mt-0.5" style={{ color: lodoDark }}>{(org.location?.region || org.region) ? `${formatLabel(org.location?.region || org.region)}, ` : ''}{org.location?.country || org.country}</p>
                                                </div>
                                            </div>
                                            {org.lat && org.lng && (
                                                <div className="text-[10px] font-black tracking-widest p-4 rounded-xl bg-[#f4f4f5] border border-[#59595B05]" style={{ color: lodoDark }}>
                                                    GPS <span className="mx-2 opacity-20">|</span> {org.lat.toFixed(6)} , {org.lng.toFixed(6)}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="links" className="mt-0 space-y-4 pb-8">
                                        {org.website && (
                                            <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 rounded-[1.5rem] border bg-white hover:shadow-lg transition-all group" style={{ borderColor: '#59595B05' }}>
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 rounded-xl bg-[#6FEA4410]"><Globe className="h-5 w-5" style={{ color: lodoGreen }} /></div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: lodoDark }}>Sitio Web Oficial</p>
                                                        <p className="text-[10px] font-medium opacity-40 lowercase" style={{ color: lodoDark }}>{org.website.replace(/^https?:\/\//, '')}</p>
                                                    </div>
                                                </div>
                                                <ExternalLink className="h-4 w-4 opacity-20 group-hover:opacity-100" />
                                            </a>
                                        )}
                                        {org.socialMedia?.linkedin && (
                                            <a href={org.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 rounded-[1.5rem] border bg-white hover:shadow-lg transition-all group" style={{ borderColor: '#59595B05' }}>
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 rounded-xl bg-[#6FEA4410]"><Linkedin className="h-5 w-5" style={{ color: lodoGreen }} /></div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: lodoDark }}>LinkedIn</p>
                                                </div>
                                                <ExternalLink className="h-4 w-4 opacity-20 group-hover:opacity-100" />
                                            </a>
                                        )}
                                        {org.contactPhone && (
                                            <div className="flex items-center gap-4 p-5 rounded-[1.5rem] border bg-white shadow-sm" style={{ borderColor: '#59595B05' }}>
                                                <div className="p-2.5 rounded-xl bg-[#6FEA4410]"><Phone className="h-5 w-5" style={{ color: lodoGreen }} /></div>
                                                <div>
                                                    <p className="text-[8px] font-black uppercase opacity-40 mb-1">Teléfono</p>
                                                    <p className="text-xs font-black tracking-tight" style={{ color: lodoDark }}>{org.contactPhone}</p>
                                                </div>
                                            </div>
                                        )}
                                        {org.mail && (
                                            <div className="flex items-center gap-4 p-5 rounded-[1.5rem] border bg-white shadow-sm" style={{ borderColor: '#59595B05' }}>
                                                <div className="p-2.5 rounded-xl bg-[#6FEA4410]"><Mail className="h-5 w-5" style={{ color: lodoGreen }} /></div>
                                                <div>
                                                    <p className="text-[8px] font-black uppercase opacity-40 mb-1">Email</p>
                                                    <p className="text-xs font-black tracking-tight" style={{ color: lodoDark }}>{org.mail}</p>
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>
                                </ScrollArea>
                            </Tabs>
                        </div>
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}