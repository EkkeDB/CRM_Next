#!/bin/bash

echo "🌐 Frontend End-to-End Flow Test"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test frontend pages accessibility with session
print_test "Testing unauthenticated dashboard access (should redirect)"
UNAUTH_DASHBOARD=$(curl -s -L http://localhost:3000/dashboard)
if echo "$UNAUTH_DASHBOARD" | grep -q -i "sign in\|login"; then
    print_pass "Unauthenticated users are properly redirected to login"
else
    print_fail "Dashboard is accessible without authentication"
fi

print_test "Testing unauthenticated contracts page access (should redirect)"
UNAUTH_CONTRACTS=$(curl -s -L http://localhost:3000/dashboard/contracts)
if echo "$UNAUTH_CONTRACTS" | grep -q -i "sign in\|login"; then
    print_pass "Unauthenticated users are properly redirected from contracts page"
else
    print_fail "Contracts page is accessible without authentication"
fi

# Test with authentication
print_test "Testing login flow and authenticated access"
COOKIE_JAR="/tmp/browser_test_cookies_$(date +%s).txt"

# First, get CSRF token
CSRF_RESPONSE=$(curl -s http://localhost:8000/api/auth/csrf/ -c "$COOKIE_JAR")
CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)

print_info "CSRF Token obtained: ${CSRF_TOKEN:0:20}..."

# Login with CSRF token
LOGIN_RESPONSE=$(curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF_TOKEN" \
  -d '{"username": "admin", "password": "admin123"}' \
  -b "$COOKIE_JAR" \
  -c "$COOKIE_JAR" \
  -s)

if echo "$LOGIN_RESPONSE" | grep -q "Login successful"; then
    print_pass "Login successful"
    
    # Test authenticated dashboard access
    print_test "Testing authenticated dashboard access"
    AUTH_DASHBOARD=$(curl -s -b "$COOKIE_JAR" http://localhost:3000/dashboard)
    if echo "$AUTH_DASHBOARD" | grep -q -i "dashboard\|welcome\|loading\|commodity"; then
        print_pass "Dashboard is accessible with authentication"
    else
        print_fail "Dashboard is not accessible with authentication"
        print_info "Response contains: $(echo "$AUTH_DASHBOARD" | head -c 200)..."
    fi
    
    # Test authenticated contracts page access
    print_test "Testing authenticated contracts page access"
    AUTH_CONTRACTS=$(curl -s -b "$COOKIE_JAR" http://localhost:3000/dashboard/contracts)
    if echo "$AUTH_CONTRACTS" | grep -q -i "contract\|loading\|commodity"; then
        print_pass "Contracts page is accessible with authentication"
    else
        print_fail "Contracts page is not accessible with authentication"
        print_info "Response contains: $(echo "$AUTH_CONTRACTS" | head -c 200)..."
    fi
    
    # Test API endpoints with authentication
    print_test "Testing authenticated API access"
    API_RESPONSE=$(curl -s -b "$COOKIE_JAR" http://localhost:8000/api/contracts/)
    if echo "$API_RESPONSE" | grep -q '"count"'; then
        print_pass "Contracts API is accessible with authentication"
        COUNT=$(echo "$API_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
        print_info "Current contracts count: $COUNT"
    else
        print_fail "Contracts API is not accessible with authentication"
    fi
    
else
    print_fail "Login failed"
    print_info "Login response: $LOGIN_RESPONSE"
fi

# Test session persistence
print_test "Testing session persistence"
PROFILE_RESPONSE=$(curl -s -b "$COOKIE_JAR" http://localhost:8000/api/auth/me/)
if echo "$PROFILE_RESPONSE" | grep -q "admin"; then
    print_pass "Session is persistent"
else
    print_fail "Session is not persistent"
fi

# Cleanup
rm -f "$COOKIE_JAR"

echo ""
echo "==============================="
echo -e "${GREEN}✅ End-to-end flow test completed!${NC}"