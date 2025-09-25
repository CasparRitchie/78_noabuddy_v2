# ===== Deploy helpers =====
FRONTEND := frontend
BACKEND  := backend
STATIC   := $(BACKEND)/static

BRANCH   ?= $(shell git rev-parse --abbrev-ref HEAD)
COMMIT   ?= chore: deploy

.PHONY: install-frontend build-frontend clean-static copy-frontend deploy push

install-frontend:
	cd $(FRONTEND) && npm ci

# Build using a clean install to avoid local drift
build-frontend: install-frontend
	cd $(FRONTEND) && npm run build

# Wipe ONLY the static folder (it should contain frontend assets only)
clean-static:
	@mkdir -p $(STATIC)
	rm -rf $(STATIC)/*
	@mkdir -p $(STATIC)

# Copy dist -> backend/static
copy-frontend:
	@test -d $(FRONTEND)/dist || (echo "Run 'make build-frontend' first." && exit 1)
	@mkdir -p $(STATIC)
	cp -R $(FRONTEND)/dist/* $(STATIC)/
	@echo "Copied frontend build into $(STATIC)"

# One-liner: build + copy + push (Heroku GitHub auto-deploy will pick this up)
deploy: build-frontend clean-static copy-frontend
	@git add -A
	@git commit -m "$(COMMIT)" || echo "Nothing to commit."
	git push origin $(BRANCH)

# Just commit & push current changes
push:
	@git add -A
	@git commit -m "$(COMMIT)" || echo "Nothing to commit."
	git push origin $(BRANCH)
