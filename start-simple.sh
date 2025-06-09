#!/bin/bash

echo "🚀 Starting NextCRM Simple Development Setup..."
echo "=============================================="

# Start only database services
echo "📦 Starting PostgreSQL and Redis..."
docker-compose -f docker-compose.dev.yml up -d

echo "⏳ Waiting for databases to start..."
sleep 15

# Check if services are running
echo "📋 Database Status:"
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "🎉 Database services are ready!"
echo "==============================="
echo ""
echo "📝 Next steps:"
echo "1. Set up backend manually:"
echo "   cd backend"
echo "   python -m venv venv"
echo "   source venv/bin/activate"
echo "   pip install -r requirements/development.txt"
echo "   python manage.py migrate"
echo "   python manage.py createsuperuser"
echo "   python manage.py runserver 0.0.0.0:8000"
echo ""
echo "2. Set up frontend manually (in another terminal):"
echo "   cd frontend"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "🌐 Then access:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   Admin:    http://localhost:8000/admin"
echo ""
echo "🛑 To stop databases:"
echo "   docker-compose -f docker-compose.dev.yml down"
echo ""