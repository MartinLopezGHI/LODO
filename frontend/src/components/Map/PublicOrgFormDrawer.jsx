import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Mail, Globe, MapPin, Send, User } from 'lucide-react';
import { fetchTaxonomies } from '../../services/api';

export default function PublicOrgFormDrawer({ isOpen, onClose, onSubmitted }) {
    const [loading, setLoading] = useState(false);
    const [taxonomies, setTaxonomies] = useState({});
    
    // Estado inicial alineado a la estructura del nuevo Backend
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        name: '',        // Antes companyName
        vertical: '',    // Antes companyType
        country: '',
        region: '',
        city: '',
        solucion: '',    // Antes description
        website: '',
        mail: '',        // Antes email
        phone: ''
    });

    // Cargamos las categorías para que el usuario elija una válida del sistema
    useEffect(() => {
        if (isOpen) {
            fetchTaxonomies().then(setTaxonomies).catch(() => console.error("Error al cargar categorías"));
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSelect = (val) => {
        setForm(prev => ({ ...prev, vertical: val }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        // Preparamos el cuerpo del correo con el nuevo estándar
        const body = `SOLICITUD DE ALTA - ECOSISTEMA LODO\n
--------------------------------------
DATOS DEL CONTACTO:
Nombre: ${form.firstName} ${form.lastName}
Email: ${form.mail}
Teléfono: ${form.phone}

DATOS DE LA EMPRESA:
Nombre: ${form.name}
Vertical: ${form.vertical}
Solución: ${form.solucion}
Ubicación: ${form.city}, ${form.region}, ${form.country}
Website: ${form.website}
--------------------------------------`;

        const mailto = `mailto:emilianor92@gmail.com?subject=${encodeURIComponent('Nueva Postulación - Startup LODO')}&body=${encodeURIComponent(body)}`;

        try {
            window.location.href = mailto;
            toast.success('Se abrió tu cliente de correo. Envía el mensaje para completar la postulación.');
            if (onSubmitted) onSubmitted();
            onClose();
        } catch (err) {
            toast.error('No se pudo abrir el correo. Copiando datos...');
            navigator.clipboard?.writeText(body);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-muted/20 border-b">
                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <Send className="h-6 w-6 text-primary" />
                        AGREGAR EMPRESA
                    </DialogTitle>
                    <DialogDescription>
                        Envíanos tus datos para validar tu proyecto.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {/* Persona de Contacto */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase opacity-60">Nombre</Label>
                            <Input name="firstName" value={form.firstName} onChange={handleChange} required className="h-10" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase opacity-60">Apellido</Label>
                            <Input name="lastName" value={form.lastName} onChange={handleChange} required className="h-10" />
                        </div>
                    </div>

                    {/* Empresa y Vertical */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase opacity-60">Nombre Comercial de la Empresa</Label>
                            <Input name="name" value={form.name} onChange={handleChange} required className="h-10" />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase opacity-60">Vertical de Negocio</Label>
                            <Select value={form.vertical} onValueChange={handleSelect}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {taxonomies.vertical?.map(t => (
                                        <SelectItem key={t.id} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Ubicación */}
                    <div className="p-4 bg-muted/30 rounded-xl space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Localización</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Input name="country" placeholder="País" value={form.country} onChange={handleChange} required className="h-9 text-xs" />
                            <Input name="region" placeholder="Prov." value={form.region} onChange={handleChange} required className="h-9 text-xs" />
                            <Input name="city" placeholder="Ciudad" value={form.city} onChange={handleChange} required className="h-9 text-xs" />
                        </div>
                    </div>

                    {/* Solución */}
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase opacity-60">Breve descripción de la solución</Label>
                        <textarea 
                            name="solucion" 
                            value={form.solucion} 
                            onChange={handleChange} 
                            required 
                            className="w-full h-20 p-3 rounded-md border bg-background text-sm focus:ring-1 focus:ring-primary outline-none"
                            placeholder="¿Qué problema resuelven?"
                        />
                    </div>

                    {/* Contacto Final */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase opacity-60">Email corporativo</Label>
                            <Input name="mail" type="email" value={form.mail} onChange={handleChange} required className="h-10" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase opacity-60">Teléfono</Label>
                            <Input name="phone" value={form.phone} onChange={handleChange} className="h-10" />
                        </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground italic text-center pt-2">
                        * Al hacer clic se abrirá tu email para enviar la solicitud de forma segura.
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
                        <Button type="submit" disabled={loading} className="flex-[2] font-bold uppercase tracking-widest">
                            {loading ? 'Procesando...' : 'Generar Email'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}