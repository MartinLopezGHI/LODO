package organizations

import (
	"encoding/json"
	"errors"
	"net/http"
)

// decodeJSON decodifica el body de la petición. 
// DisallowUnknownFields es excelente para robustez: si el frontend envía un campo 
// con nombre viejo (ej: sectorPrimary), el API devolverá error en lugar de ignorarlo.
func decodeJSON(r *http.Request, dst interface{}) error {
	if r.Body == nil {
		return errors.New("request body is empty")
	}
	defer r.Body.Close()

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields() 

	if err := decoder.Decode(dst); err != nil {
		return err
	}
	return nil
}

// encodeJSON responde al cliente. 
// El SetIndent es bueno para desarrollo, aunque en producción podrías quitarlo para ahorrar bytes.
func encodeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	encoder := json.NewEncoder(w)
	encoder.SetIndent("", "  ")
	encoder.Encode(data)
}