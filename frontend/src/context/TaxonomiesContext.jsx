import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchTaxonomies } from '../services/api';

const TaxonomiesContext = createContext();

export const useTaxonomies = () => {
    const context = useContext(TaxonomiesContext);
    if (!context) {
        throw new Error('useTaxonomies must be used within a TaxonomiesProvider');
    }
    return context;
};

export const TaxonomiesProvider = ({ children }) => {
    // Sincronizado con los nombres exactos de las tablas en MariaDB (003_seed_taxonomies.sql)
    const [taxonomies, setTaxonomies] = useState({
        organizationtype: [],
        vertical: [],
        subvertical: [],
        estadioactual: [],
        outcomestatus: [],
        technology: [],
        impactarea: [],
        badge: [],
    });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadTaxonomies = async () => {
            try {
                const data = await fetchTaxonomies();
                // Mergeamos los datos asegurando que las llaves del backend sobrescriban las iniciales
                setTaxonomies(prev => ({ ...prev, ...data }));
                setLoading(false);
            } catch (err) {
                console.error("Failed to load taxonomies from API:", err);
                setError(err);
                setLoading(false);
            }
        };

        loadTaxonomies();
    }, []);

    /**
     * getOptions: Retorna la lista de una categoría.
     * Mejora: Normaliza el nombre de la categoría a minúsculas por seguridad.
     */
    const getOptions = (category) => {
        if (!category) return [];
        const key = category.toLowerCase();
        return taxonomies[key] || [];
    };

    /**
     * getValue: Encuentra un objeto completo {value, label} dado un valor.
     */
    const getValue = (category, value) => {
        const list = getOptions(category);
        return list.find(item => item.value === value);
    };

    const value = {
        taxonomies,
        loading,
        error,
        getOptions,
        getValue
    };

    return (
        <TaxonomiesContext.Provider value={value}>
            {children}
        </TaxonomiesContext.Provider>
    );
};