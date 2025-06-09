#!/bin/bash

# NextCRM Quick Start Script
echo "🚀 Starting NextCRM Development Environment..."
echo "============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Build and start services
echo "📦 Building Docker containers..."
docker-compose build

echo "🔄 Starting all services..."
docker-compose up -d

echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

# Run migrations
echo "🗄️  Running database migrations..."
docker-compose exec -T backend python manage.py migrate

echo "📊 Creating initial data..."
docker-compose exec -T backend python manage.py collectstatic --noinput

# Check service status
echo "📋 Service Status:"
docker-compose ps

echo ""
echo "🎉 NextCRM is ready!"
echo "==================="
echo ""
echo "🌐 Open your browser and go to:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   Admin:    http://localhost:8000/admin"
echo ""
echo "🔐 To create an admin user, run:"
echo "   docker-compose exec backend python manage.py createsuperuser"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop everything:"
echo "   docker-compose down"
echo ""