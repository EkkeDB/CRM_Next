# NextCRM CORS/Network Error Debug Guide

## Quick Fix Summary

The main issues were:
1. **Docker network configuration mismatch** - Frontend needed to use `backend:8000` for Docker communication
2. **CORS settings conflict** - Development settings were overriding base settings incorrectly
3. **Missing connectivity testing** - No ping endpoint for basic connectivity verification

## Debugging Steps

### 1. Test Basic Connectivity

#### From Host Machine
```bash
# Test backend directly
curl http://localhost:8000/ping/

# Test with CORS headers
curl -H "Origin: http://localhost:3000" http://localhost:8000/ping/
```

#### From Frontend Container
```bash
# Get into frontend container
docker exec -it nextcrm_frontend sh

# Test backend service name
curl http://backend:8000/ping/

# Test API endpoint
curl http://backend:8000/api/auth/health/
```

#### From Backend Container
```bash
# Get into backend container  
docker exec -it nextcrm_backend sh

# Check if backend is running
curl http://localhost:8000/ping/

# Check logs
python manage.py check
```

### 2. Browser DevTools Inspection

#### Network Tab
- Look for failed requests to `/api/crm/traders/`
- Check if requests are going to correct URL (`http://localhost:8000/api/crm/traders/`)
- Verify request headers include `Origin: http://localhost:3000`
- Check response headers for CORS headers:
  - `Access-Control-Allow-Origin`
  - `Access-Control-Allow-Credentials`

#### Console Tab
- Look for CORS error messages
- Check for network errors vs application errors
- Verify axios configuration is correct

#### Application Tab (Cookies)
- Check if JWT cookies are being set:
  - `access_token` (HttpOnly, Lax SameSite)
  - `refresh_token` (HttpOnly, Lax SameSite)
- Verify cookie domain and path settings

### 3. Docker Network Verification

```bash
# Check if containers are in same network
docker network ls
docker network inspect nextcrm_network

# Check container connectivity
docker exec -it nextcrm_frontend ping backend
docker exec -it nextcrm_backend ping frontend
```

### 4. Django Settings Verification

#### Check CORS Settings
```python
# In Django shell
python manage.py shell

from django.conf import settings
print("CORS_ALLOWED_ORIGINS:", settings.CORS_ALLOWED_ORIGINS)
print("CORS_ALLOW_ALL_ORIGINS:", settings.CORS_ALLOW_ALL_ORIGINS)
print("CORS_ALLOW_CREDENTIALS:", settings.CORS_ALLOW_CREDENTIALS)
print("CSRF_TRUSTED_ORIGINS:", settings.CSRF_TRUSTED_ORIGINS)
```

#### Check Middleware Order
```python
print("MIDDLEWARE:", settings.MIDDLEWARE)
# CorsMiddleware should be at the top
```

### 5. Environment Variables Check

#### Frontend
```bash
# Check environment variables in frontend container
docker exec -it nextcrm_frontend env | grep NEXT_PUBLIC
```

#### Backend
```bash
# Check Django settings module
docker exec -it nextcrm_backend env | grep DJANGO_SETTINGS_MODULE
```

## Test Endpoints

### Basic Connectivity
- `GET /ping/` - Basic connectivity test (no auth required)
- `GET /api/auth/health/` - API health check (no auth required)

### Authentication
- `GET /api/auth/csrf/` - Get CSRF token
- `POST /api/auth/login/` - Login with credentials
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Get current user (auth required)

### CRUD Operations
- `GET /api/crm/traders/` - List traders (auth required)
- `POST /api/crm/traders/` - Create trader (auth required)
- `GET /api/crm/traders/{id}/` - Get trader by ID (auth required)
- `PUT /api/crm/traders/{id}/` - Update trader (auth required)
- `DELETE /api/crm/traders/{id}/` - Delete trader (auth required)

## Test Page

Access the test page at `/api-test` to verify:
- Backend connectivity
- CORS configuration
- Full CRUD operations
- Authentication flow
- Error handling

## Common Issues & Solutions

### Issue: "AxiosError: Network Error"
**Cause**: Usually CORS or network connectivity
**Solution**:
1. Check if backend is running on correct port
2. Verify CORS settings include frontend origin
3. Ensure Docker networking is configured properly

### Issue: "Access-Control-Allow-Origin" header missing
**Cause**: CORS not properly configured
**Solution**:
1. Add frontend origin to `CORS_ALLOWED_ORIGINS`
2. Set `CORS_ALLOW_CREDENTIALS = True`
3. Ensure `corsheaders.middleware.CorsMiddleware` is first in middleware

### Issue: Authentication errors
**Cause**: JWT cookies not being sent/received
**Solution**:
1. Verify `withCredentials: true` in axios
2. Check cookie settings (HttpOnly, SameSite, Domain)
3. Ensure CSRF token is included in requests

### Issue: Docker container communication
**Cause**: Containers not in same network or wrong service names
**Solution**:
1. Use service names (`backend:8000` not `localhost:8000`)
2. Verify all containers are in `nextcrm_network`
3. Check Docker Compose configuration

## Final Verification Checklist

- [ ] Backend responds to `/ping/`
- [ ] Frontend can reach backend via Docker service name
- [ ] CORS headers are present in responses
- [ ] JWT cookies are set on login
- [ ] API requests include credentials
- [ ] All CRUD operations work via test page
- [ ] No network errors in browser console
- [ ] Authentication flow works end-to-end

## Production Considerations

When deploying to production:

1. **Update CORS origins** - Replace localhost with actual domain
2. **Enable HTTPS** - Set cookie `secure=True`
3. **Update cookie settings** - Adjust SameSite policy as needed
4. **Environment variables** - Use production API URLs
5. **Remove debug endpoints** - Disable `/ping/` if not needed