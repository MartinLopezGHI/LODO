# Variables - Reemplaza con tus datos reales
PROJECT_ID=probable-anchor-483603-m8
REGION=southamerica-east1
BACK_REPO=southamerica-east1-docker.pkg.dev/$(PROJECT_ID)/lodo-repo/backend-lodo
FRONT_REPO=southamerica-east1-docker.pkg.dev/$(PROJECT_ID)/lodo-front-repo/frontend-lodo
VERSION=v5

# --- COMANDOS PARA EL BACKEND ---
deploy-back:
	@echo "Construyendo Backend $(VERSION)..."
	docker build -t $(BACK_REPO):$(VERSION) ./backend
	docker push $(BACK_REPO):$(VERSION)
	gcloud run services update lodo-backend --image $(BACK_REPO):$(VERSION) --region $(REGION)

# --- COMANDOS PARA EL FRONTEND ---
deploy-front:
	@echo "Construyendo Frontend $(VERSION)..."
	docker build \
		--build-arg VITE_API_URL=https://lodo-backend-412424314458.southamerica-east1.run.app \
		--build-arg VITE_ADMIN_TOKEN=tu_token_aqui \
		-t $(FRONT_REPO):$(VERSION) -f frontend/Dockerfile .
	docker push $(FRONT_REPO):$(VERSION)
	gcloud run services update lodo-frontend --image $(FRONT_REPO):$(VERSION) --region $(REGION)

# --- LIMPIEZA LOCAL ---
clean:
	docker system prune -f


#Cómo ejecutar tus nuevas mejoras:
#Para desplegar el Backend seguro:
#Abre la terminal en la raíz y escribe: make deploy-back.

#Para desplegar el Frontend con la nueva estructura:
#Escribe: make deploy-front.

#Para limpiar imágenes viejas en tu PC:
#Escribe: make clean.