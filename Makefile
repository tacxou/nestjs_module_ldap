#!make

ifneq (,$(wildcard ./.env))
	include .env
	export
endif

YARN        ?= yarn
NPX         ?= npx
ASSETS_DIR  := docs/assets
RESVG       := $(NPX) --yes @resvg/resvg-js-cli

.PHONY: help install install-ci build clean lint format check test test-coverage verify logos ncu ncu-upgrade

.DEFAULT_GOAL := help

help: ## Show this help
	@printf "\033[33mUsage:\033[0m\n  make [target]\n\n\033[33mTargets:\033[0m\n"
	@awk 'BEGIN { FS = ":.*##"; } /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install dependencies (yarn)
	$(YARN) install

install-ci: ## Install dependencies with frozen lockfile (CI parity)
	$(YARN) install --frozen-lockfile

build: ## Compile TypeScript to dist/
	$(YARN) build

clean: ## Remove dist/ and coverage/
	$(YARN) rimraf dist coverage

lint: ## Run Biome check (lint + format, no write)
	$(YARN) lint

format: ## Apply Biome formatting
	$(YARN) format

check: ## Run Biome check with auto-fix
	$(YARN) check

test: ## Run unit tests
	$(YARN) test

test-coverage: ## Run tests with coverage report
	$(YARN) test:coverage

verify: lint test build ## Run lint, test and build (local CI parity)

logos: ## Regenerate logo-lockup-2b.png from SVG (GitHub README)
	$(RESVG) --fit-width 1120 $(ASSETS_DIR)/logo-lockup-2b.svg $(ASSETS_DIR)/logo-lockup-2b.png

ncu: ## Check latest versions of all project dependencies
	$(NPX) npm-check-updates

ncu-upgrade: ## Upgrade all project dependencies to the latest versions
	$(NPX) npm-check-updates -u
