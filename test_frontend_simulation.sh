#!/bin/bash

# Frontend Browser Simulation Test
# This simulates the exact browser behavior with JavaScript API calls

echo "🌐 TESTING FRONTEND BROWSER SIMULATION"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test frontend accessibility
echo -e "\n${BLUE}Testing Frontend Accessibility${NC}"
frontend_response=$(curl -s -m 5 "http://localhost:3000/" | head -10)
if echo "$frontend_response" | grep -qi "nextcrm\|login\|react"; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend may not be accessible${NC}"
    echo "Response: $frontend_response"
fi

# Test API calls as the frontend would make them
echo -e "\n${BLUE}Testing API Call Sequence${NC}"

# Clean up any existing cookies
rm -f browser_cookies.txt

# 1. Frontend would first fetch CSRF token
echo "1. Fetching CSRF token..."
csrf_response=$(curl -s -c browser_cookies.txt "http://localhost:8000/api/auth/csrf/")
csrf_token=$(echo "$csrf_response" | python3 -c "import sys, json; print(json.load(sys.stdin)['csrfToken'])" 2>/dev/null || echo "")

if [ -n "$csrf_token" ]; then
    echo -e "${GREEN}✅ CSRF token obtained: ${csrf_token:0:20}...${NC}"
else
    echo -e "${RED}❌ Failed to get CSRF token${NC}"
    exit 1
fi

# 2. Frontend would send login request
echo "2. Sending login request..."
login_response=$(curl -s -b browser_cookies.txt -c browser_cookies.txt \
    -H "Content-Type: application/json" \
    -H "X-CSRFToken: $csrf_token" \
    -d '{"username":"admin","password":"admin123"}' \
    "http://localhost:8000/api/auth/login/")

if echo "$login_response" | grep -q "Login successful"; then
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "Response: $(echo $login_response | cut -c1-100)..."
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "Response: $login_response"
    exit 1
fi

# 3. Check cookies were set
echo "3. Checking cookies..."
if grep -q "access_token" browser_cookies.txt && grep -q "refresh_token" browser_cookies.txt; then
    echo -e "${GREEN}✅ Both access_token and refresh_token cookies are set${NC}"
    echo "Cookies:"
    grep -E "(access_token|refresh_token)" browser_cookies.txt | sed 's/^/  /'
else
    echo -e "${RED}❌ Authentication cookies not properly set${NC}"
    echo "Cookie file contents:"
    cat browser_cookies.txt
    exit 1
fi

# 4. Test authenticated API call
echo "4. Testing authenticated API call (/auth/me/)..."
me_response=$(curl -s -b browser_cookies.txt "http://localhost:8000/api/auth/me/")

if echo "$me_response" | grep -q "admin"; then
    echo -e "${GREEN}✅ Authenticated API call successful${NC}"
    user_data=$(echo "$me_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"User: {data['username']} ({data['email']})\")" 2>/dev/null || echo "")
    echo "User data: $user_data"
else
    echo -e "${RED}❌ Authenticated API call failed${NC}"
    echo "Response: $me_response"
    exit 1
fi

# 5. Test logout
echo "5. Testing logout..."
logout_response=$(curl -s -b browser_cookies.txt -c browser_cookies.txt \
    -H "Content-Type: application/json" \
    -H "X-CSRFToken: $csrf_token" \
    -X POST \
    "http://localhost:8000/api/auth/logout/")

if echo "$logout_response" | grep -q "Logout successful"; then
    echo -e "${GREEN}✅ Logout successful${NC}"
else
    echo -e "${RED}❌ Logout failed${NC}"
    echo "Response: $logout_response"
    exit 1
fi

# 6. Verify logout worked
echo "6. Verifying logout..."
post_logout_response=$(curl -s -b browser_cookies.txt "http://localhost:8000/api/auth/me/")

if echo "$post_logout_response" | grep -q "Authentication credentials were not provided"; then
    echo -e "${GREEN}✅ Logout verification successful - user is no longer authenticated${NC}"
else
    echo -e "${RED}❌ Logout verification failed - user may still be authenticated${NC}"
    echo "Response: $post_logout_response"
    exit 1
fi

# Clean up
rm -f browser_cookies.txt

echo -e "\n${GREEN}🎉 ALL FRONTEND SIMULATION TESTS PASSED!${NC}"
echo -e "${GREEN}The authentication flow works exactly as a browser would handle it.${NC}"