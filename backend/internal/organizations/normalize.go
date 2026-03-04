package organizations

import (
	"fmt"
	"strings"
)

// Normalize limpia y valida los datos de una organización antes de persistirlos.
func Normalize(org *Organization) error {
	// 1. Trim en campos de texto obligatorios y opcionales
	org.ID = strings.TrimSpace(org.ID)
	org.Name = strings.TrimSpace(org.Name)
	org.Country = strings.TrimSpace(org.Country)
	org.Region = strings.TrimSpace(org.Region)
	org.City = strings.TrimSpace(org.City)

	// 2. Validación de campos mínimos indispensables para existir en la DB
	if org.Name == "" {
		return fmt.Errorf("el nombre de la organización es obligatorio")
	}

	// 3. Normalizar campos opcionales (Punteros a string)
	org.Vertical = normalizeOptional(org.Vertical)
	org.OrganizationType = normalizeOptional(org.OrganizationType)
	org.OutcomeStatus = normalizeOptional(org.OutcomeStatus)
	org.Website = normalizeOptional(org.Website)
	org.SubVertical = normalizeOptional(org.SubVertical)
	org.EstadioActual = normalizeOptional(org.EstadioActual)
	org.Solucion = normalizeOptional(org.Solucion)
	org.Mail = normalizeOptional(org.Mail)
	org.ContactPhone = normalizeOptional(org.ContactPhone)
	org.Notes = normalizeOptional(org.Notes)
	org.LogoURL = normalizeOptional(org.LogoURL)
	org.BusinessModel = normalizeOptional(org.BusinessModel)

	// --- Lógica de validación para "OTRA / OTRO" ---
	if org.Vertical != nil {
		isVerticalOtra := strings.EqualFold(*org.Vertical, "otra") || strings.EqualFold(*org.Vertical, "otro")
		if isVerticalOtra {
			if org.Notes == nil || len(strings.TrimSpace(*org.Notes)) < 3 {
				return fmt.Errorf("al seleccionar 'OTRA' como vertical, debe detallar la categoría en el campo de notas")
			}
		}
	}

	// 4. Validar consistencia de coordenadas geográficas
	if (org.Lat != nil && org.Lng == nil) || (org.Lat == nil && org.Lng != nil) {
		return fmt.Errorf("se deben proporcionar ambos valores (latitud y longitud) o ninguno")
	}

	// 5. Validar año de fundación (Founded)
	if org.Founded != nil {
		currentYear := 2026
		if *org.Founded < 1850 || *org.Founded > currentYear {
			return fmt.Errorf("el año de fundación (%d) no es válido", *org.Founded)
		}
	}

	// 6. Limpieza profunda de Slices (Founders, Badges)
	org.Founders = cleanSlice(org.Founders)
	org.Badges = cleanSlice(org.Badges)

	return nil
}

// ValidateForPublish realiza el checklist corporativo antes de permitir el paso a PUBLISHED.
func ValidateForPublish(org *Organization) error {
	if org.Name == "" {
		return fmt.Errorf("el nombre de la organización es obligatorio para publicar")
	}
	if org.Country == "" {
		return fmt.Errorf("el país es obligatorio para publicar")
	}
	if org.Website == nil || *org.Website == "" {
		return fmt.Errorf("el sitio web es obligatorio para publicar")
	}

	return nil
}

// Helpers para normalización
func normalizeOptional(s *string) *string {
	if s == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*s)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func cleanSlice(items []string) []string {
	if items == nil {
		return nil
	}
	cleaned := make([]string, 0)
	for _, item := range items {
		trimmed := strings.TrimSpace(item)
		if trimmed != "" {
			cleaned = append(cleaned, trimmed)
		}
	}
	if len(cleaned) == 0 {
		return nil
	}
	return cleaned
}
