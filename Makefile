# ===== Deploy helpers =====

FRONTEND_DIR := frontend
BACKEND_DIR  := backend
STATIC_DIR   := $(BACKEND_DIR)/static
DIST_DIR     := $(FRONTEND_DIR)/dist

BRANCH ?= $(shell git rev-parse --abbrev-ref HEAD)
COMMIT ?= chore: deploy

.PHONY: install-frontend build-frontend clean-static copy-frontend deploy push \
        _ensure-dist _commit-and-push

install-frontend:
	cd $(FRONTEND_DIR) && npm ci

# Build using a clean install to avoid local drift
build-frontend: install-frontend
	cd $(FRONTEND_DIR) && npm run build

# Wipe ONLY the static folder (it should contain frontend assets only)
clean-static:
	@mkdir -p $(STATIC_DIR)
	rm -rf $(STATIC_DIR)/*
	@mkdir -p $(STATIC_DIR)

# Copy dist -> backend/static
copy-frontend: _ensure-dist
	@mkdir -p $(STATIC_DIR)
	cp -R $(DIST_DIR)/* $(STATIC_DIR)/
	@echo "Copied frontend build into $(STATIC_DIR)"

deploy: build-frontend clean-static copy-frontend
	@$(MAKE) _commit-and-push

push:
	@$(MAKE) _commit-and-push

_ensure-dist:
	@test -d $(DIST_DIR) || (echo "Run 'make build-frontend' first." && exit 1)

_commit-and-push:
	@git add -A
	@git commit -m "$(COMMIT)" || echo "Nothing to commit."
	git push origin $(BRANCH)
