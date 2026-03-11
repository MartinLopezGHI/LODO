package organizations

import "time"

// OrganizationStatus representa el estado del ciclo de vida del dato.
type OrganizationStatus string

const (
	StatusDraft     OrganizationStatus = "DRAFT"
	StatusInReview  OrganizationStatus = "IN_REVIEW"
	StatusPublished OrganizationStatus = "PUBLISHED"
	StatusArchived  OrganizationStatus = "ARCHIVED"
)

// Location representa la ubicación geográfica de una organización.
type Location struct {
	Country string  `json:"country"`
	Region  *string `json:"region,omitempty"`
	City    *string `json:"city,omitempty"`
}

// Organization es la entidad principal con la estructura corporativa completa.
type Organization struct {
	ID               string             `json:"id"`
	Name             string             `json:"name"`
	Website          *string            `json:"website,omitempty"`
	Vertical         *string            `json:"vertical,omitempty"` // Opcional
	SubVertical      *string            `json:"subVertical,omitempty"`
	Location         Location           `json:"location"`
	LogoURL          *string            `json:"logoUrl,omitempty"`
	EstadioActual    *string            `json:"estadioActual,omitempty"`
	Solucion         *string            `json:"solucion,omitempty"`
	Mail             *string            `json:"mail,omitempty"`
	SocialMedia      map[string]string  `json:"socialMedia,omitempty"`
	ContactPhone     *string            `json:"contactPhone,omitempty"`
	Founders         []string           `json:"founders,omitempty"`
	Founded          *int               `json:"founded,omitempty"`
	OrganizationType *string            `json:"organizationType,omitempty"` // Opcional
	OutcomeStatus    *string            `json:"outcomeStatus,omitempty"`    // Opcional
	BusinessModel    *string            `json:"businessModel,omitempty"`
	Badges           []string           `json:"badges,omitempty"` // Unicornio, B-Corp, etc.
	Notes            *string            `json:"notes,omitempty"`  // Obligatorio si Vertical es "OTRA"
	Status           OrganizationStatus `json:"status"`
	Lat              *float64           `json:"lat,omitempty"`
	Lng              *float64           `json:"lng,omitempty"`
	CreatedAt        time.Time          `json:"createdAt"`
	UpdatedAt        time.Time          `json:"updatedAt"`
}

// OrganizationSummary se utilizará para listados rápidos y mapeo.
type OrganizationSummary struct {
	ID       string   `json:"id"`
	Name     string   `json:"name"`
	Vertical string   `json:"vertical"`
	Country  string   `json:"country"`
	Lat      *float64 `json:"lat,omitempty"`
	Lng      *float64 `json:"lng,omitempty"`
	Status   string   `json:"status"`
}
