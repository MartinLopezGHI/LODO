import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
    adminCreateOrganization as createOrganization,
    adminUpdateOrganization as updateOrganization,
    adminFetchOrganizationById,
    fetchTaxonomies
} from '../../services/api';
import { toast } from 'sonner';
import {
    Save, Plus, Edit, Loader2, X, Globe, Linkedin, Instagram, Mail, Phone, Info, LayoutGrid,
    Database, ShieldCheck, Clock, Hash, Navigation, Youtube, Twitter, Music, Facebook, X as XIcon
} from 'lucide-react';

export default function OrgFormMaster({ isOpen, onClose, onCreated, editingOrg }) {
    const initialForm = {
        name: '',
        vertical: '',
        subVertical: '',
        location: {
            country: '',
            region: '',
            city: ''
        },
        estadioActual: '',
        solucion: '',
        mail: '',
        contactPhone: '',
        website: '',
        logoUrl: '',
        businessModel: '', // Nuevo campo para B2B, B2C, etc.
        socialMedia: {}, // Backend expects an object (map)
        founders: [],
        founded: '',
        organizationType: '',
        outcomeStatus: 'active',
        notes: '',
        badges: [],
        // Campos Técnicos y de Sistema
        id: '',
        status: '',
        lat: null,
        lng: null,
        createdAt: '',
        updatedAt: ''
    };

    const [form, setForm] = useState(initialForm);
    const [socialMediaList, setSocialMediaList] = useState([]); // Array for UI: [{ network: '', url: '' }]
    const [foundersList, setFoundersList] = useState([]); // Array for UI: ['']
    const [taxonomies, setTaxonomies] = useState({});
    const [loading, setLoading] = useState(false);
    const [newBadge, setNewBadge] = useState('');

    // --- Lógica de mapeo Vertical -> SubVertical ---
    const getSubVerticalsForVertical = (verticalValue, allSubVerticals = []) => {
        if (!verticalValue || verticalValue === 'otra') return [];

        // Definimos el mapeo de asociaciones basados en la base de datos
        const associations = {
            'agtech': ['digital_ag', 'ag_hardware', 'water_tech', 'ag_fintech'],
            'biotech_bioinputs': ['crop_genomics', 'biofertilizers', 'biopesticides', 'sustainable_inputs', 'genetics_breeding', 'bio_protection', 'biostimulants', 'agronomic_support', 'bioengineering'],
            'foodtech': ['novel_ingredients', 'food_processing', 'indoor_ag', 'food_safety'],
            'climatech': ['carbon_solutions', 'soil_health', 'env_impact'],
            'circular_economy': ['waste_upcycling']
        };

        const allowedValues = associations[verticalValue] || [];
        return allSubVerticals.filter(sv => allowedValues.includes(sv.value) || sv.value === 'otra_especificar');
    };

    const handleVerticalChange = (value) => {
        setForm(prev => {
            const updates = { ...prev, vertical: value };
            // Si cambia la vertical, limpiamos la subvertical actual para evitar incongruencias
            updates.subVertical = '';

            // Si es 'otra', nos aseguramos de no enviar subVertical y pedir notas
            if (value === 'otra') {
                updates.subVertical = '';
            }
            return updates;
        });
    };

    // Cargar diccionarios desde el backend al abrir el componente
    useEffect(() => {
        if (isOpen) {
            fetchTaxonomies()
                .then(setTaxonomies)
                .catch(() => toast.error("Error al sincronizar categorías del servidor"));
        }
    }, [isOpen]);

    // Sincronizar datos si estamos editando
    useEffect(() => {
        if (editingOrg?.id && isOpen) {
            setLoading(true);
            adminFetchOrganizationById(editingOrg.id)
                .then(fullOrg => {
                    if (!fullOrg) return;

                    // Mapeo SEGURO: Usamos el detalle completo pero preservamos lo que ya tenemos
                    setForm(prev => {
                        const merged = {
                            ...prev,
                            ...fullOrg,
                            // Mapeo manual de campos críticos para asegurar compatibilidad
                            name: fullOrg.name || fullOrg.Name || prev.name,
                            vertical: fullOrg.vertical || fullOrg.Vertical || prev.vertical,
                            subVertical: fullOrg.subVertical || fullOrg.sub_vertical || prev.subVertical,
                            organizationType: fullOrg.organizationType || fullOrg.organization_type || prev.organizationType,
                            businessModel: fullOrg.businessModel || fullOrg.business_model || prev.businessModel,
                            estadioActual: fullOrg.estadioActual || fullOrg.estadio_actual || prev.estadioActual,
                            outcomeStatus: fullOrg.outcomeStatus || fullOrg.outcome_status || prev.outcomeStatus,
                            contactPhone: fullOrg.contactPhone || fullOrg.contact_phone || prev.contactPhone,
                            logoUrl: fullOrg.logoUrl || fullOrg.logo_url || prev.logoUrl,
                            notes: fullOrg.notes || fullOrg.Notes || prev.notes,
                            solucion: fullOrg.solucion || fullOrg.Solucion || prev.solucion,
                            mail: fullOrg.mail || fullOrg.Mail || prev.mail,
                            website: fullOrg.website || fullOrg.Website || prev.website,
                            location: fullOrg.location || {
                                country: fullOrg.country || fullOrg.Country || '',
                                region: fullOrg.region || fullOrg.Region || '',
                                city: fullOrg.city || fullOrg.City || ''
                            },

                            socialMedia: fullOrg.socialMedia || fullOrg.social_media || prev.socialMedia || {},
                            founders: fullOrg.founders || fullOrg.Founders || prev.founders || [],
                            badges: fullOrg.badges || fullOrg.Badges || prev.badges || [],
                            founded: (fullOrg.founded !== null && fullOrg.founded !== undefined)
                                ? String(fullOrg.founded)
                                : prev.founded,
                        };

                        // Reconstruir listas auxiliares basadas en el nuevo estado
                        const smSource = merged.socialMedia || {};
                        const smArray = Object.entries(smSource)
                            .filter(([_, url]) => url !== null)
                            .map(([network, url]) => ({ network, url }));
                        setSocialMediaList(smArray);
                        setFoundersList(merged.founders || []);

                        return merged;
                    });
                })
                .catch(err => toast.error("Error al cargar el detalle completo: " + err.message))
                .finally(() => setLoading(false));
        } else if (isOpen) {
            setForm(initialForm);
            setSocialMediaList([]);
            setFoundersList([]);
        }
    }, [editingOrg?.id, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('location.')) {
            const field = name.split('.')[1];
            setForm(prev => ({
                ...prev,
                location: { ...prev.location, [field]: value }
            }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSelect = (name, value) => {
        if (name === 'vertical') {
            handleVerticalChange(value);
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    // Funciones para Redes Sociales
    const handleAddSocialMedia = () => {
        setSocialMediaList([...socialMediaList, { network: '', url: '' }]);
    };

    const handleUpdateSocialMedia = (index, field, value) => {
        const newList = [...socialMediaList];
        newList[index][field] = value;
        setSocialMediaList(newList);
    };

    const handleRemoveSocialMedia = (index) => {
        setSocialMediaList(socialMediaList.filter((_, i) => i !== index));
    };

    // Funciones para Fundadores
    const handleAddFounder = () => {
        setFoundersList([...foundersList, '']);
    };

    const handleUpdateFounder = (index, value) => {
        const newList = [...foundersList];
        newList[index] = value;
        setFoundersList(newList);
    };

    const handleRemoveFounder = (index) => {
        setFoundersList(foundersList.filter((_, i) => i !== index));
    };

    // Funciones para Insignias (Badges) con Taxonomía o custom
    const handleToggleBadge = (badgeValue) => {
        setForm(prev => {
            let currentBadges = prev.badges || [];

            // Lógica exclusiva para "Ninguna"
            if (badgeValue === 'none') {
                if (currentBadges.includes('none')) {
                    return { ...prev, badges: [] }; // Desmarcar "Ninguna"
                } else {
                    return { ...prev, badges: ['none'] }; // Marcar "Ninguna" borra las demás
                }
            }

            // Si selecciona otra cosa, quitamos "Ninguna"
            currentBadges = currentBadges.filter(b => b !== 'none');

            if (currentBadges.includes(badgeValue)) {
                return { ...prev, badges: currentBadges.filter(b => b !== badgeValue) };
            } else {
                return { ...prev, badges: [...currentBadges, badgeValue] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validación manual de campos obligatorios: Solo Nombre, País y Sitio Web
        if (!form.name?.trim()) { toast.error("El nombre es obligatorio"); setLoading(false); return; }
        if (!form.location?.country?.trim()) { toast.error("El país es obligatorio"); setLoading(false); return; }
        if (!form.website?.trim()) { toast.error("El sitio web es obligatorio"); setLoading(false); return; }

        // Convertir array de UI de vuelta al mapa (objeto) esperado por Backend
        const socialMediaMap = {};
        socialMediaList.forEach(item => {
            if (item.network && item.url) {
                socialMediaMap[item.network] = item.url;
            }
        });

        // Filtrar fundadores vacíos
        const cleanFounders = foundersList.filter(f => f.trim() !== '');

        // Preparamos el payload alineado EXACTAMENTE al struct de Go (camelCase)
        const payload = {
            name: form.name,
            vertical: form.vertical,
            subVertical: form.subVertical,
            organizationType: form.organizationType,
            businessModel: form.businessModel,
            estadioActual: form.estadioActual,
            outcomeStatus: form.outcomeStatus,
            solucion: form.solucion,
            mail: form.mail,
            contactPhone: form.contactPhone,
            website: form.website,
            logoUrl: form.logoUrl,
            location: {
                country: form.location.country,
                region: form.location.region || null,
                city: form.location.city || null
            },
            notes: form.notes,
            founded: form.founded ? parseInt(form.founded) : null,
            socialMedia: socialMediaMap,
            founders: cleanFounders,
            badges: form.badges || [],
            lat: form.lat ? parseFloat(form.lat) : null,
            lng: form.lng ? parseFloat(form.lng) : null
        };

        // Si estamos editando, incluimos el ID para el bindeo del backend
        if (editingOrg) {
            payload.id = editingOrg.id;
        }

        try {
            if (editingOrg) {
                // Para actualización el ID viaja en la URL y el cuerpo
                await updateOrganization(editingOrg.id, payload);
                toast.success("Datos actualizados");
            } else {
                // El ID no se envía para que el Backend genere el UUID automáticamente
                await createOrganization(payload);
                toast.success("Organización registrada con éxito");
            }
            onCreated(); // Refrescar la tabla o mapa
            onClose();   // Cerrar el drawer/modal
        } catch (err) {
            toast.error(`Error del servidor: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* Aplicamos la paleta de identidad visual LODO: Fondo Gris Clarito #f4f4f5 */}
            <DialogContent className="fixed left-[50%] top-[56%] z-[9999] w-[95vw] max-w-[850px] h-[80vh] translate-x-[-50%] translate-y-[-50%] border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden flex flex-col">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes border-walking {
                        0% { background-position: 0% 50%; }
                        100% { background-position: 200% 50%; }
                    }
                    .animated-type-border-hover:hover {
                        position: relative;
                        border: 1px solid transparent !important;
                        background: padding-box linear-gradient(white, white),
                                    border-box linear-gradient(90deg, #6FEA44 0%, #e5e7eb 50%, #6FEA44 100%);
                        background-size: 200% auto;
                        animation: border-walking 2s linear infinite;
                    }
                `}} />
                <DialogHeader className="p-2 bg-white border-b border-gray-200 relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#6FE844]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 z-0 pointer-events-none"></div>
                    <div className="flex items-center gap-3 relative z-10 px-4 py-2">
                        <div className="bg-[#6FE844]/20 text-[#6FE844] p-1.5 rounded-xl border border-[#6FE844]/20">
                            {editingOrg ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-black tracking-tight text-[#59595B]">
                                {editingOrg ? `EDITAR ${form.name}` : 'NUEVA ORGANIZACIÓN'}
                            </DialogTitle>
                            <DialogDescription className="text-[10px] font-medium opacity-60 text-[#59595B]">
                                {editingOrg ? 'Actualiza los campos del relevamiento.' : 'Registra una nueva entidad (ID y Geo generados automáticamente).'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <form id="org-master-form" onSubmit={handleSubmit} className="p-8 space-y-10">

                        {/* SECCIÓN 1: IDENTIDAD Y DESCRIPCIÓN */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[#6FE844]">
                                    <Info size={16} />
                                    <h3 className="text-xs font-bold uppercase tracking-widest">Identidad</h3>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-[#59595B]">Nombre de la Organización</Label>
                                    <Input name="name" value={form.name} onChange={handleChange} required placeholder="Nombre oficial" className="bg-white border-gray-200 text-[#59595B] h-11 focus:border-[#6FEA44]/50 focus:ring-1 focus:ring-[#6FEA44]/50 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-[#59595B]">URL del Logo (Opcional)</Label>
                                    <Input name="logoUrl" value={form.logoUrl} onChange={handleChange} placeholder="https://ejemplo.com/logo.png" className="bg-white border-gray-200 text-[#59595B] h-11 focus:border-[#6FEA44]/50 focus:ring-1 focus:ring-[#6FEA44]/50 rounded-xl" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[#6FE844]">
                                    <LayoutGrid size={16} />
                                    <h3 className="text-xs font-bold uppercase tracking-widest">Propuesta de Valor</h3>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-[#59595B]">Solución / Lo que hacen</Label>
                                    <textarea name="solucion" value={form.solucion} onChange={handleChange} className="w-full h-[80px] rounded-xl border border-gray-200 bg-white p-4 text-sm outline-none focus:ring-1 focus:ring-[#6FEA44]/50 focus:border-[#6FEA44]/50 text-[#59595B]" placeholder="Describe brevemente el proyecto..." />
                                </div>
                            </div>
                        </section>

                        <Separator className="bg-white/5" />

                        {/* SECCIÓN 2: CATEGORIZACIÓN */}
                        <section className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-[#59595B]">Vertical</Label>
                                    <Select value={form.vertical} onValueChange={(v) => handleSelect('vertical', v)}>
                                        <SelectTrigger className="bg-white border-gray-200 text-[#59595B] h-11 rounded-xl"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200 text-[#59595B]">
                                            {taxonomies.vertical?.map(t => <SelectItem key={t.id} value={t.value} className="hover:bg-gray-100">{t.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className={`space-y-2 transition-opacity ${form.vertical === 'otra' ? 'opacity-40 pointer-events-none' : ''}`}>
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-[#59595B]">Sub-Vertical</Label>
                                    <Select value={form.subVertical} onValueChange={(v) => handleSelect('subVertical', v)} disabled={form.vertical === 'otra'}>
                                        <SelectTrigger className="bg-white border-gray-200 text-[#59595B] h-11 rounded-xl"><SelectValue placeholder="Opcional..." /></SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200 text-[#59595B]">
                                            {getSubVerticalsForVertical(form.vertical, taxonomies.subvertical).map(t => (
                                                <SelectItem key={t.id} value={t.value} className="hover:bg-gray-100">{t.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-[#59595B]">Modelo Negocio</Label>
                                    <Select value={form.businessModel} onValueChange={(v) => handleSelect('businessModel', v)}>
                                        <SelectTrigger className="bg-white border-gray-200 text-[#59595B] h-11 rounded-xl"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200 text-[#59595B]">
                                            {!taxonomies.businessmodel || taxonomies.businessmodel.length === 0 ? (
                                                <>
                                                    <SelectItem value="b2b">B2B</SelectItem>
                                                    <SelectItem value="b2c">B2C</SelectItem>
                                                    <SelectItem value="b2b2c">B2B2C</SelectItem>
                                                    <SelectItem value="d2c">D2C</SelectItem>
                                                    <SelectItem value="saas">SaaS</SelectItem>
                                                    <SelectItem value="marketplace">Marketplace</SelectItem>
                                                    <SelectItem value="agtech_service">AgTech Service</SelectItem>
                                                    <SelectItem value="otra">Otro</SelectItem>
                                                </>
                                            ) : (
                                                taxonomies.businessmodel.map(t => (
                                                    <SelectItem key={t.id} value={t.value} className="hover:bg-gray-100">{t.label}</SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-[#59595B]">Madurez (Stage)</Label>
                                    <Select value={form.estadioActual} onValueChange={(v) => handleSelect('estadioActual', v)}>
                                        <SelectTrigger className="bg-white border-gray-200 text-[#59595B] h-11"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200 text-[#59595B]">
                                            {taxonomies.estadioactual?.map(t => <SelectItem key={t.id} value={t.value} className="hover:bg-gray-100">{t.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-[#59595B]">Tipo de Organización</Label>
                                    <Select value={form.organizationType} onValueChange={(v) => handleSelect('organizationType', v)}>
                                        <SelectTrigger className="bg-white border-gray-200 text-[#59595B] h-11 rounded-xl"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200 text-[#59595B]">
                                            {taxonomies.organizationtype?.map(t => <SelectItem key={t.id} value={t.value} className="hover:bg-gray-100">{t.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {(form.vertical === 'otra' || form.subVertical === 'otra_especificar') && (
                                <div className="p-4 bg-[#6FE844]/10 border border-[#6FE844]/30 rounded-xl space-y-2 animate-in fade-in zoom-in-95 duration-300">
                                    <Label className="text-[11px] font-bold uppercase text-[#6FE844]">Especificar Categoría (Notas) *</Label>
                                    <Input
                                        name="notes"
                                        value={form.notes}
                                        onChange={handleChange}
                                        placeholder="Escribe de qué trata el proyecto..."
                                        className="bg-white border-[#6FE844]/30 text-[#59595B]"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-[#59595B]">Estado Operativo</Label>
                                    <Select value={form.outcomeStatus} onValueChange={(v) => handleSelect('outcomeStatus', v)}>
                                        <SelectTrigger className="bg-white border-gray-200 text-[#59595B] h-11 rounded-xl"><SelectValue placeholder="Activa, Adquirida..." /></SelectTrigger>
                                        <SelectContent className="bg-white border-gray-200 text-[#59595B]">
                                            {/* Fallback si no hay taxonomía outcome_status */}
                                            {taxonomies.outcomestatus?.map(t => <SelectItem key={t.id} value={t.value} className="hover:bg-gray-100">{t.label}</SelectItem>) || (
                                                <>
                                                    <SelectItem value="active" className="hover:bg-gray-100">Activa</SelectItem>
                                                    <SelectItem value="acquired" className="hover:bg-gray-100">Adquirida</SelectItem>
                                                    <SelectItem value="closed" className="hover:bg-gray-100">Cerrada</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-[#59595B]">Año de Fundación</Label>
                                    <Input type="number" name="founded" value={form.founded} onChange={handleChange} placeholder="Ej. 2018" className="bg-white border-gray-200 text-[#59595B] h-11 focus:border-[#6FE844]/50" />
                                </div>
                            </div>
                        </section>

                        <Separator className="bg-white/5" />

                        {/* SECCIÓN 3: INSIGNIAS Y FUNDADORES */}
                        <section className="space-y-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#6FE844]">Insignias & Fundadores</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-[#59595B]">Insignias / Badges</Label>
                                    <div className="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-xl">

                                        {/* Opción Manual: Ninguna */}
                                        <div className="flex items-center space-x-2 pb-2 mb-2 border-b border-gray-100">
                                            <input
                                                type="checkbox"
                                                id="badge-none"
                                                checked={(form.badges || []).includes('none')}
                                                onChange={() => handleToggleBadge('none')}
                                                className="h-4 w-4 rounded border-gray-300 bg-white text-[#6FE844] border focus:ring-[#6FE844] cursor-pointer accent-[#6FE844]"
                                            />
                                            <label htmlFor="badge-none" className="text-sm font-medium leading-none cursor-pointer text-[#59595B]">
                                                Ninguna
                                            </label>
                                        </div>

                                        {taxonomies.badges?.length > 0 ? (
                                            taxonomies.badges.map(t => (
                                                <div key={t.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`badge-${t.id}`}
                                                        checked={(form.badges || []).includes(t.value)}
                                                        onChange={() => handleToggleBadge(t.value)}
                                                        disabled={(form.badges || []).includes('none')}
                                                        className="h-4 w-4 rounded border-gray-300 bg-white text-[#6FE844] border focus:ring-[#6FE844] cursor-pointer accent-[#6FE844] disabled:opacity-50 disabled:cursor-not-allowed"
                                                    />
                                                    <label htmlFor={`badge-${t.id}`} className={`text-sm font-medium leading-none cursor-pointer text-[#59595B] ${(form.badges || []).includes('none') ? 'opacity-50' : ''}`}>
                                                        {t.label}
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-xs text-[#59595B]/50 italic">No hay insignias en la taxonomía</span>
                                        )}

                                        {/* Input Manual para Otro / Custom */}
                                        <div className="pt-2 mt-2 border-t border-gray-100">
                                            <Label className="text-[10px] uppercase opacity-50 block mb-2 text-[#59595B]">Agregar Insignia Personalizada</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newBadge}
                                                    onChange={(e) => setNewBadge(e.target.value)}
                                                    placeholder="Ej: Premio local..."
                                                    className="bg-white border-gray-200 text-[#59595B] h-9 text-sm focus:border-[#6FE844]/50"
                                                    disabled={(form.badges || []).includes('none')}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={(e) => {
                                                        if (newBadge.trim() && !form.badges.includes(newBadge.trim())) {
                                                            setForm(prev => ({ ...prev, badges: [...prev.badges, newBadge.trim()] }));
                                                            setNewBadge('');
                                                        }
                                                    }}
                                                    className="h-9 px-3 bg-[#6FE844]/20 text-[#6FE844] hover:bg-[#6FE844]/30"
                                                    disabled={(form.badges || []).includes('none')}
                                                >
                                                    Añadir
                                                </Button>
                                            </div>

                                            {/* Badges Custom List */}
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {form.badges.filter(b => b !== 'none' && !taxonomies.badges?.some(tb => tb.value === b)).map((b, i) => (
                                                    <Badge key={`custom-${i}`} variant="secondary" className="px-3 py-1.5 flex items-center gap-2 bg-[#6FE844]/10 text-[#6FE844] hover:bg-[#6FE844]/20 border-[#6FE844]/20">
                                                        {b} <X className="h-3 w-3 cursor-pointer opacity-50 hover:opacity-100" onClick={() => handleToggleBadge(b)} />
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] font-bold uppercase opacity-60 text-[#59595B]">Fundadores / Equipo</Label>
                                        <Button type="button" variant="link" size="sm" onClick={handleAddFounder} className="h-auto p-0 text-[#6FE844] hover:text-[#6FE844]/80">
                                            + Agregar Creador
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {foundersList.map((founder, index) => (
                                            <div key={index} className="flex gap-2 relative">
                                                <Input
                                                    value={founder}
                                                    onChange={(e) => handleUpdateFounder(index, e.target.value)}
                                                    placeholder="Nombre Completo"
                                                    className="flex-1 bg-white border-gray-200 text-[#59595B] h-11 pr-10 focus:border-[#6FE844]/50"
                                                />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFounder(index)} className="absolute right-0 top-0 h-11 w-11 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {foundersList.length === 0 && (
                                            <div className="text-sm text-[#59595B]/50 italic bg-white p-4 border border-dashed border-gray-200 rounded-xl text-center">
                                                Sin fundadores agregados.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <Separator className="bg-white/5" />

                        <section className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#6FE844]">Geografía</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase opacity-50 px-1">País *</Label>
                                    <Input name="location.country" value={form.location.country} onChange={handleChange} required placeholder="País" className="bg-white border-gray-200 text-[#59595B] h-11 focus:border-[#6FE844]/50 rounded-xl" />
                                </div>
                                <div className={`space-y-1 transition-all duration-300 ${!form.location.country ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                    <Label className="text-[10px] uppercase opacity-50 px-1">Región / Provincia</Label>
                                    <Input name="location.region" value={form.location.region} onChange={handleChange} placeholder="Región" className="bg-white border-gray-200 text-[#59595B] h-11 focus:border-[#6FE844]/50 rounded-xl" />
                                </div>
                                <div className={`space-y-1 transition-all duration-300 ${!form.location.region ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                    <Label className="text-[10px] uppercase opacity-50 px-1">Ciudad</Label>
                                    <Input name="location.city" value={form.location.city} onChange={handleChange} placeholder="Ciudad" className="bg-white border-gray-200 text-[#59595B] h-11 focus:border-[#6FE844]/50 rounded-xl" />
                                </div>
                            </div>
                        </section>

                        <Separator className="bg-white/5" />

                        {/* SECCIÓN 5: CONTACTO Y REDES */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label className="text-[11px] font-bold uppercase opacity-60 text-[#59595B]">Canales Directos</Label>
                                <div className="space-y-3">
                                    <div className="relative"><Globe className="absolute left-3 top-3 h-4 w-4 text-[#6FEA44]" /><Input name="website" value={form.website} onChange={handleChange} required placeholder="Sitio Web" className="pl-10 h-11 bg-white border-gray-200 text-[#59595B] focus:border-[#6FEA44]/50 rounded-xl" /></div>
                                    <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-[#6FEA44]" /><Input name="mail" value={form.mail} onChange={handleChange} placeholder="Email de contacto" className="pl-10 h-11 bg-white border-gray-200 text-[#59595B] focus:border-[#6FEA44]/50 rounded-xl" /></div>
                                    <div className="relative"><Phone className="absolute left-3 top-3 h-4 w-4 text-[#6FEA44]" /><Input name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="Teléfono de contacto" className="pl-10 h-11 bg-white border-gray-200 text-[#59595B] focus:border-[#6FEA44]/50 rounded-xl" /></div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[11px] font-bold uppercase opacity-60 text-[#59595B]">Redes Sociales Dinámicas</Label>
                                    <Button type="button" variant="link" size="sm" onClick={handleAddSocialMedia} className="h-auto p-0 text-[#6FE844] hover:text-[#6FE844]/80">
                                        + Agregar Red
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {socialMediaList.map((item, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Select value={item.network} onValueChange={(val) => handleUpdateSocialMedia(index, 'network', val)}>
                                                <SelectTrigger className="w-[80px] bg-white border-gray-200 text-[#59595B] h-11 focus:border-[#6FEA44]/50 rounded-xl">
                                                    <SelectValue placeholder="Red" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-gray-200 text-[#59595B]">
                                                    <SelectItem value="linkedin" className="hover:bg-gray-100 flex items-center gap-2"><Linkedin className="h-4 w-4 opacity-70" /></SelectItem>
                                                    <SelectItem value="instagram" className="hover:bg-gray-100 flex items-center gap-2"><Instagram className="h-4 w-4 opacity-70" /></SelectItem>
                                                    <SelectItem value="x" className="hover:bg-gray-100 flex items-center gap-2"><XIcon className="h-4 w-4 opacity-70" /></SelectItem>
                                                    <SelectItem value="facebook" className="hover:bg-gray-100 flex items-center gap-2"><Facebook className="h-4 w-4 opacity-70" /></SelectItem>
                                                    <SelectItem value="youtube" className="hover:bg-gray-100 flex items-center gap-2"><Youtube className="h-4 w-4 opacity-70" /></SelectItem>
                                                    <SelectItem value="tiktok" className="hover:bg-gray-100 flex items-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 h-4 w-4">
                                                            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                                        </svg>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                value={item.url}
                                                onChange={(e) => handleUpdateSocialMedia(index, 'url', e.target.value)}
                                                placeholder="URL del perfil"
                                                className="flex-1 bg-white border-gray-200 text-[#59595B] h-11 focus:border-[#6FE844]/50"
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSocialMedia(index)} className="h-11 w-11 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 shrink-0">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {socialMediaList.length === 0 && (
                                        <div className="text-sm text-[#59595B]/50 italic bg-white p-4 border border-dashed border-gray-200 rounded-xl text-center">
                                            Sin redes agregadas. Haz clic en '+ Agregar Red'.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>



                    </form>
                </ScrollArea>

                <DialogFooter className="p-2 border-t border-gray-200 bg-white items-center">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="font-bold text-[#59595B] hover:text-[#59595B] hover:bg-white animated-type-border-hover rounded-xl px-5 h-9 text-xs transition-all">Cancelar</Button>
                    <Button form="org-master-form" type="submit" disabled={loading} className="px-6 h-9 rounded-xl font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#6FE844]/20 hover:scale-105 active:scale-95 bg-[#6FE844] hover:bg-[#59595B] hover:text-[#6FEA44] text-[#59595B] text-xs duration-300">
                        {loading ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                        {editingOrg ? 'Guardar Cambios' : 'Registrar Startup'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}