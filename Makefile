#!make

ifneq (,$(wildcard ./.env))
	include .env
	export
endif

YARN        ?= yarn
NPX         ?= npx
ASSETS_DIR  := docs/assets
RESVG       := $(NPX) --yes @resvg/resvg-js-cli

VERSION ?=
CHANNEL ?= latest
WATCH ?=

.PHONY: help install install-ci build clean lint typecheck format check test test-coverage test-scripts docs docs-build docs-preview changelog-build changelog-check package release release-status verify logos ncu ncu-upgrade

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

typecheck: ## Type-check library and tests without emitting files
	$(YARN) typecheck

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

test-scripts: ## Test changelog, packaging and release tooling
	$(YARN) test:scripts

docs: ## Start the VitePress documentation site
	$(YARN) docs:dev

docs-build: ## Build the VitePress documentation site
	$(YARN) docs:build

docs-preview: ## Preview the built documentation site
	$(YARN) docs:preview

changelog-build: ## Generate CHANGELOG.md from versioned sources
	$(YARN) changelog:build

changelog-check: ## Verify CHANGELOG.md is synchronized
	$(YARN) changelog:check

package: ## Build and audit the npm tarball in .artifacts/npm/
	$(YARN) package

release: ## Dispatch release.yml (VERSION=X.Y.Z [CHANNEL=latest|next] [WATCH=1])
	$(YARN) release --version "$(VERSION)" --channel "$(CHANNEL)" $(if $(strip $(WATCH)),--watch,)

release-status: ## Show the latest Release workflow runs
	gh run list --workflow release.yml --limit 5

verify: lint typecheck test-coverage test-scripts build docs-build changelog-check package ## Run full CI parity

logos: ## Regenerate logo-lockup-2b.png from SVG (GitHub README)
	$(RESVG) --fit-width 1120 $(ASSETS_DIR)/logo-lockup-2b.svg $(ASSETS_DIR)/logo-lockup-2b.png

ncu: ## Check latest versions of all project dependencies
	$(NPX) npm-check-updates

ncu-upgrade: ## Upgrade all project dependencies to the latest versions
	$(NPX) npm-check-updates -u
