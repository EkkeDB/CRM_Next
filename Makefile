# NextCRM Development Makefile

.PHONY: help build up down logs shell-backend shell-frontend migrate seed test clean

# Default target
help:
	@echo "NextCRM Development Commands"
	@echo "============================"
	@echo ""
	@echo "Setup Commands:"
	@echo "  build         Build all Docker containers"
	@echo "  up            Start all services"
	@echo "  down          Stop all services"
	@echo ""
	@echo "Development Commands:"
	@echo "  logs          Show logs from all services"
	@echo "  logs-backend  Show backend logs"
	@echo "  logs-frontend Show frontend logs"
	@echo "  shell-backend Enter backend container shell"
	@echo "  shell-frontend Enter frontend container shell"
	@echo ""
	@echo "Database Commands:"
	@echo "  migrate       Run Django migrations"
	@echo "  makemigrations Create new migrations"
	@echo "  seed          Load initial data"
	@echo "  dbshell       Access PostgreSQL shell"
	@echo ""
	@echo "Testing Commands:"
	@echo "  test          Run all tests"
	@echo "  test-backend  Run backend tests"
	@echo "  test-frontend Run frontend tests"
	@echo ""
	@echo "Utility Commands:"
	@echo "  clean         Clean up containers and volumes"
	@echo "  restart       Restart all services"
	@echo "  status        Show status of all services"

# Setup Commands
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

# Development Commands
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

shell-backend:
	docker-compose exec backend bash

shell-frontend:
	docker-compose exec frontend sh

# Database Commands
migrate:
	docker-compose exec backend python manage.py migrate

makemigrations:
	docker-compose exec backend python manage.py makemigrations

seed:
	docker-compose exec backend python manage.py loaddata fixtures/initial_data.json

dbshell:
	docker-compose exec postgres psql -U postgres -d nextcrm

# Create superuser
createsuperuser:
	docker-compose exec backend python manage.py createsuperuser

# Collect static files
collectstatic:
	docker-compose exec backend python manage.py collectstatic --noinput

# Testing Commands
test:
	make test-backend
	make test-frontend

test-backend:
	docker-compose exec backend python manage.py test

test-frontend:
	docker-compose exec frontend npm test

# Utility Commands
clean:
	docker-compose down -v
	docker system prune -f

restart:
	docker-compose restart

status:
	docker-compose ps

# Install dependencies
install-backend:
	docker-compose exec backend pip install -r requirements/development.txt

install-frontend:
	docker-compose exec frontend npm install

# Linting and formatting
lint-backend:
	docker-compose exec backend flake8 .
	docker-compose exec backend black --check .

lint-frontend:
	docker-compose exec frontend npm run lint

format-backend:
	docker-compose exec backend black .
	docker-compose exec backend isort .

format-frontend:
	docker-compose exec frontend npm run lint:fix

# Development setup from scratch
dev-setup:
	@echo "Setting up NextCRM development environment..."
	make build
	make up
	sleep 10
	make migrate
	@echo "Development environment ready!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"
	@echo "Admin: http://localhost:8000/admin"

# Production build
prod-build:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans

# Backup and restore
backup-db:
	docker-compose exec postgres pg_dump -U postgres nextcrm > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore-db:
	@read -p "Enter backup file path: " filepath; \
	docker-compose exec -T postgres psql -U postgres nextcrm < $$filepath

# Security scan
security-scan:
	docker-compose exec backend safety check
	docker-compose exec frontend npm audit

# Generate API docs
docs:
	docker-compose exec backend python manage.py spectacular --file schema.yml

# Health check
health:
	@echo "Checking service health..."
	@curl -f http://localhost:3000/api/health || echo "Frontend: ❌"
	@curl -f http://localhost:8000/api/auth/health/ || echo "Backend: ❌"
	@echo "Health check complete"