import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import AdminTable from '../components/admin/AdminTable';
// MEJORA: Importamos el nuevo Formulario Maestro alineado al Backend
import OrgFormMaster from '../components/admin/OrgFormMaster';
import { adminFetchOrganizations as listOrganizations } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Plus, Search,
    Filter, Database, RefreshCcw,
    AlertCircle, ShieldX, LogIn,
    Map as MapIcon
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import LoginModal from '../components/auth/LoginModal';

export default function AdminPage() {
    const { isAuthenticated, isAdmin, loading: authLoading, user } = useAuth();
    const navigate = useNavigate();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);

    const refreshData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await listOrganizations();
            setOrganizations(data || []);
            setError(null);
        } catch (err) {
            setError("Error al cargar datos. Verifica la conexión y el token.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const filteredOrgs = useMemo(() => {
        return organizations.filter(org => {
            const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                org.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || org.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [organizations, searchTerm, statusFilter]);

    const counts = useMemo(() => {
        return {
            TOTAL: organizations.length,
            DRAFT: organizations.filter(o => o.status === 'DRAFT').length,
            IN_REVIEW: organizations.filter(o => o.status === 'IN_REVIEW').length,
            PUBLISHED: organizations.filter(o => o.status === 'PUBLISHED').length,
            ARCHIVED: organizations.filter(o => o.status === 'ARCHIVED').length,
        };
    }, [organizations]);

    const handleEdit = (org) => {
        setSelectedOrg(org);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setSelectedOrg(null);
        setIsFormOpen(true);
    };

    if (authLoading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-full bg-slate-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-slate-500">Verificando acceso...</p>
                    </div>
                </div>
            </AppShell>
        );
    }

    if (!isAdmin) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-full bg-slate-50">
                    <div className="text-center max-w-md p-8">
                        <div className="bg-rose-100 p-4 rounded-full w-fit mx-auto mb-6">
                            <ShieldX className="h-12 w-12 text-rose-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Acceso Denegado</h2>
                        <p className="text-slate-500 mb-6">
                            No tienes permisos de administrador para acceder a esta sección.
                            <br />
                            <span className="text-sm">Conectado como: {user?.email}</span>
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button variant="outline" onClick={() => navigate('/')}>
                                Volver al Inicio
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/map')}>
                                Ver Mapa
                            </Button>
                        </div>
                    </div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="flex flex-col min-h-full bg-slate-50/50">
                <div className="bg-background border-b px-8 py-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1.5 opacity-80">
                                <LayoutDashboard className="h-3.5 w-3.5" />
                                Admin Panel
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                                <Database className="h-6 w-6 text-slate-400" />
                                Gestión de Organizaciones
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refreshData()}
                                disabled={loading}
                                className="bg-background border-slate-200"
                            >
                                <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Actualizar
                            </Button>
                            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 rounded-xl px-6 h-11 transition-all active:scale-95">
                                <Plus className="h-5 w-5 mr-2" />
                                Nueva Organización
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        {Object.entries(counts).map(([status, count]) => (
                            <div
                                key={status}
                                onClick={() => setStatusFilter(status === 'TOTAL' ? 'ALL' : status)}
                                className={`
                                    p-4 rounded-2xl border transition-all cursor-pointer group
                                    ${(status === 'TOTAL' ? statusFilter === 'ALL' : statusFilter === status)
                                        ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary'
                                        : 'bg-background hover:bg-slate-50 border-slate-200'}
                                `}
                            >
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">{status}</p>
                                <p className="text-2xl font-black text-slate-900">{count}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Buscar por nombre o ID..."
                                className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-background transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <Button
                                variant={statusFilter === 'ALL' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setStatusFilter('ALL')}
                                className="rounded-lg h-9 px-4 text-xs font-bold"
                            >
                                Todos
                            </Button>
                            <Button
                                variant={statusFilter === 'DRAFT' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setStatusFilter('DRAFT')}
                                className="rounded-lg h-9 px-4 text-xs font-bold"
                            >
                                Borradores
                            </Button>
                            <Button
                                variant={statusFilter === 'PUBLISHED' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setStatusFilter('PUBLISHED')}
                                className="rounded-lg h-9 px-4 text-xs font-bold"
                            >
                                Publicados
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-8 pt-6">
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 bg-background rounded-3xl border border-dashed border-rose-200 p-8 text-center shadow-sm">
                            <div className="bg-rose-50 p-4 rounded-full mb-4">
                                <AlertCircle className="h-8 w-8 text-rose-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{error}</h3>
                            <Button variant="outline" onClick={() => refreshData()} className="mt-2">Reintentar</Button>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <AdminTable
                                organizations={filteredOrgs}
                                onRefresh={() => refreshData(true)}
                                onSelect={handleEdit}
                            />

                            {filteredOrgs.length === 0 && (
                                <div className="py-20 text-center flex flex-col items-center">
                                    <div className="bg-slate-100 p-6 rounded-full mb-4">
                                        <Search className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 font-medium">No se encontraron resultados para los filtros aplicados.</p>
                                    <Button variant="link" onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}>Limpiar filtros</Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MEJORA: Utilizamos el OrgFormMaster para manejar creaciones y ediciones */}
            <OrgFormMaster
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onCreated={() => refreshData(true)}
                editingOrg={selectedOrg}
            />
        </AppShell>
    );
}