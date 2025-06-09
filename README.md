# NextCRM - Commodity Trading CRM System

A modern, comprehensive commodity trading CRM system built with Django 5.2.1 and Next.js 15.1.

## 🚀 Features

- **Modern Architecture**: Django REST Framework backend with Next.js frontend
- **Authentication**: JWT tokens with HttpOnly cookies for enhanced security
- **Real-time Dashboard**: Interactive charts and KPIs using Recharts and D3
- **Contract Management**: Complete CRUD operations for trading contracts
- **Counterparty CRM**: Comprehensive customer relationship management
- **Commodity Catalog**: Extensive commodity and trading data management
- **Security**: Comprehensive audit logging and security middleware
- **Responsive Design**: Modern UI with shadcn/ui and Tailwind CSS 4.0

## 🛠️ Technology Stack

### Backend
- **Django 5.2.1** - Web framework
- **Django REST Framework 3.15** - API development
- **PostgreSQL 17** - Database
- **Redis 7.4** - Caching and sessions
- **JWT Authentication** - Secure token-based auth

### Frontend
- **Next.js 15.1** - React framework with App Router
- **TypeScript 5.6** - Type safety
- **Tailwind CSS 4.0** - Styling
- **shadcn/ui** - Component library
- **TanStack Query v5** - Server state management
- **Recharts 2.8** - Data visualization

### Development & Deployment
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy
- **Node.js 22 LTS** - Frontend runtime
- **Python 3.13** - Backend runtime

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 22 LTS
- Python 3.13
- PostgreSQL 17
- Redis 7.4

## 🚀 Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CRM_Next
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. **Start the development environment**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin
   - API Documentation: http://localhost:8000/api/docs

## 🔧 Manual Development Setup

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements/development.txt
   ```

4. **Set up database**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

5. **Run development server**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

The API documentation is automatically generated using DRF Spectacular and available at:
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
- OpenAPI Schema: http://localhost:8000/api/schema/

## 🔐 Authentication

The system uses JWT tokens stored in HttpOnly cookies for enhanced security:

- **Login**: POST `/api/auth/login/`
- **Logout**: POST `/api/auth/logout/`
- **Refresh**: POST `/api/auth/token/refresh/`
- **Profile**: GET `/api/auth/me/`

## 📊 Key Features

### Dashboard
- Real-time contract statistics
- Monthly contract value trends
- Contract status distribution
- Top counterparties and commodities

### Contract Management
- Create, read, update, delete contracts
- Contract status workflow (draft → approved → executed → completed)
- Comprehensive filtering and search
- Export capabilities

### Counterparty CRM
- Customer and supplier management
- Facility tracking
- Contact management
- Relationship history

### Security Features
- Audit logging for all operations
- Security event tracking
- Rate limiting
- GDPR compliance features

## 🌍 Environment Configuration

### Development
```env
DEBUG=1
DJANGO_SETTINGS_MODULE=core.settings.development
DB_HOST=localhost
REDIS_URL=redis://localhost:6379/1
```

### Production
```env
DEBUG=0
DJANGO_SETTINGS_MODULE=core.settings.production
DB_HOST=postgres
REDIS_URL=redis://redis:6379/1
ALLOWED_HOSTS=yourdomain.com
```

## 🐳 Docker Services

- **postgres**: PostgreSQL 17 database
- **redis**: Redis 7.4 cache
- **backend**: Django application
- **frontend**: Next.js application
- **nginx**: Reverse proxy (production profile)

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 📁 Project Structure

```
nextcrm/
├── backend/                 # Django backend
│   ├── core/               # Django project configuration
│   ├── apps/               # Django applications
│   │   ├── authentication/ # User management & security
│   │   └── nextcrm/        # Core business logic
│   └── requirements/       # Python dependencies
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   └── public/            # Static assets
├── nginx/                 # Nginx configuration
└── monitoring/            # Observability setup
```

## 🔧 Available Scripts

### Backend
- `python manage.py runserver` - Start development server
- `python manage.py migrate` - Run database migrations
- `python manage.py test` - Run tests
- `python manage.py collectstatic` - Collect static files

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions:
- Email: support@nextcrm.com
- Documentation: https://docs.nextcrm.com

## 🔄 Version History

- **v1.0.0** - Initial release with core CRM functionality
- Modern Django 5.2.1 and Next.js 15.1 architecture
- Comprehensive security and audit features
- Real-time dashboard and analytics

---

**NextCRM** - Powering the future of commodity trading