import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '../ui/dropdown-menu';
import {
    MoreHorizontal, Edit, Send, CheckCircle,
    Archive, MapPin, ExternalLink, Trash2, XCircle
} from 'lucide-react';
import {
    adminSubmitForReview as submitForReview,
    adminPublishOrganization as publishOrganization,
    adminArchiveOrganization as archiveOrganization,
    adminDeleteOrganization as deleteOrganization
} from '../../services/api';
import { toast } from 'sonner';
import ConfirmModal from './ConfirmModal';

const statusStyles = {
    DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
    IN_REVIEW: "bg-amber-100 text-amber-700 border-amber-200",
    PUBLISHED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    ARCHIVED: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function AdminTable({ organizations, onRefresh, onSelect }) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [orgToDelete, setOrgToDelete] = React.useState(null);
    const [loading, setLoading] = React.useState(false);

    const handleAction = async (id, actionFn, label) => {
        const promise = actionFn(id);
        toast.promise(promise, {
            loading: `Ejecutando: ${label}...`,
            success: () => {
                onRefresh();
                return `Organización ${label} con éxito`;
            },
            error: (err) => `Error: ${err.message}`
        });
    };

    const confirmDelete = (org) => {
        setOrgToDelete(org);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!orgToDelete) return;
        setLoading(true);
        try {
            // Si ya está archivada, mandamos force=true para permitir el hard delete
            const isArchived = orgToDelete.status === 'ARCHIVED';
            await deleteOrganization(orgToDelete.id, isArchived);

            toast.success(isArchived ? "Organización eliminada permanentemente" : "Organización eliminada/archivada correctamente");
            onRefresh();
            setIsDeleteModalOpen(false);
        } catch (err) {
            if (err.message === 'published_blocked') {
                if (orgToDelete.status === 'PUBLISHED') {
                    toast.warning("Las organizaciones publicadas no se borran físicamente. Se ha movido a ARCHIVADOS.");
                } else {
                    toast.error("No se pudo eliminar la organización.");
                }
                onRefresh();
                setIsDeleteModalOpen(false);
            } else {
                toast.error(`Error al eliminar: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="font-bold whitespace-nowrap">Nombre</TableHead>
                        <TableHead className="font-bold whitespace-nowrap">ID / Ubicación</TableHead>
                        <TableHead className="font-bold">Estado</TableHead>
                        <TableHead className="font-bold">Actualizado</TableHead>
                        <TableHead className="font-bold text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {organizations.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No se encontraron organizaciones.
                            </TableCell>
                        </TableRow>
                    ) : (
                        organizations.map((org) => (
                            <TableRow key={org.id} className="hover:bg-muted/20 transition-colors">
                                <TableCell className="font-medium">
                                    <div className="flex flex-col min-w-[150px]">
                                        <span className="text-sm font-bold truncate max-w-[200px]" title={org.name}>{org.name}</span>
                                        {/* AJUSTE NUEVO: Usamos 'vertical' en lugar de 'sectorPrimary' */}
                                        <span className="text-[10px] text-muted-foreground uppercase">{org.vertical}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <code className="text-[10px] px-1.5 py-0.5 bg-muted rounded self-start">{org.id}</code>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <MapPin className="h-2.5 w-2.5" />
                                            {org.city}, {org.country}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={statusStyles[org.status] || ""}>
                                        {org.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-[11px] text-muted-foreground">
                                        {new Date(org.updatedAt).toLocaleDateString()}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onSelect(org)}
                                            className="h-8 hover:bg-primary/5 hover:text-primary transition-all font-bold"
                                        >
                                            <Edit className="h-3.5 w-3.5 mr-2" />
                                            Editar
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 p-2">
                                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50 px-2 py-1.5"> Lifecycle </DropdownMenuLabel>
                                                <DropdownMenuSeparator />

                                                {(org.status === 'DRAFT' || org.status === 'PUBLISHED' || org.status === 'ARCHIVED') && (
                                                    <DropdownMenuItem onClick={() => handleAction(org.id, submitForReview, 'enviada a revisión')}>
                                                        <Send className="mr-2 h-4 w-4 text-primary" />
                                                        Solicitar Revisión
                                                    </DropdownMenuItem>
                                                )}

                                                {org.status === 'IN_REVIEW' && (
                                                    <DropdownMenuItem onClick={() => handleAction(org.id, publishOrganization, 'publicada')} className="bg-emerald-50 focus:bg-emerald-100 text-emerald-700">
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Publicar Ahora
                                                    </DropdownMenuItem>
                                                )}

                                                {org.status === 'PUBLISHED' && (
                                                    <DropdownMenuItem onClick={() => handleAction(org.id, archiveOrganization, 'archivada')}>
                                                        <Archive className="mr-2 h-4 w-4 text-rose-600" />
                                                        Archivar / Despublicar
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50 px-2 py-1.5"> Administrativo </DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => window.open(`http://localhost:8080/public/organizations/${org.id}`, '_blank')}>
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Inspeccionar API
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => confirmDelete(org)}
                                                    className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                loading={loading}
                title="Eliminar Organización"
                message={`¿Estás seguro de que deseas eliminar "${orgToDelete?.name}"? Las organizaciones publicadas serán archivadas en lugar de eliminadas físicamente.`}
            />
        </div>
    );
}