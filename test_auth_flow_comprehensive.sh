#!/bin/bash

echo "🔐 Comprehensive Authentication Flow Test"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test 1: Verify both services are running
print_test "Verifying services are running"

frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/login)
if [ "$frontend_status" -eq 200 ]; then
    print_pass "Frontend service is running (HTTP $frontend_status)"
else
    print_fail "Frontend service not accessible (HTTP $frontend_status)"
fi

backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/auth/health/)
if [ "$backend_status" -eq 200 ]; then
    print_pass "Backend service is running (HTTP $backend_status)"
else
    print_fail "Backend service not accessible (HTTP $backend_status)"
fi

echo ""

# Test 2: CSRF token functionality
print_test "Testing CSRF token functionality"

csrf_response=$(curl -s -c /tmp/auth_test_cookies.txt http://localhost:8000/api/auth/csrf/)
csrf_token=$(echo "$csrf_response" | python3 -c "import sys, json; print(json.load(sys.stdin)['csrfToken'])" 2>/dev/null)

if [ -n "$csrf_token" ] && [ ${#csrf_token} -eq 64 ]; then
    print_pass "CSRF token obtained successfully (64 chars)"
    print_info "Token: ${csrf_token:0:16}..."
else
    print_fail "Failed to obtain valid CSRF token"
    echo "Response: $csrf_response"
fi

echo ""

# Test 3: Login without CSRF token (should fail)
print_test "Testing login without CSRF token (should fail with 403)"

no_csrf_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}')

if [ "$no_csrf_response" -eq 403 ]; then
    print_pass "Login correctly rejected without CSRF token (HTTP $no_csrf_response)"
else
    print_fail "Login should have been rejected without CSRF token (HTTP $no_csrf_response)"
fi

echo ""

# Test 4: Login with valid CSRF token (should succeed)
print_test "Testing login with valid CSRF token"

login_response=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -H "X-CSRFToken: $csrf_token" \
    -d '{"username": "admin", "password": "admin123"}' \
    -b /tmp/auth_test_cookies.txt \
    -c /tmp/auth_login_cookies.txt)

login_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -H "X-CSRFToken: $csrf_token" \
    -d '{"username": "admin", "password": "admin123"}' \
    -b /tmp/auth_test_cookies.txt \
    -c /tmp/auth_login_cookies.txt)

if [ "$login_status" -eq 200 ]; then
    print_pass "Login successful with CSRF token (HTTP $login_status)"
    
    # Check if response contains expected fields
    if echo "$login_response" | grep -q "Login successful"; then
        print_pass "Login response contains success message"
    else
        print_fail "Login response missing success message"
    fi
    
    if echo "$login_response" | grep -q '"user"'; then
        print_pass "Login response contains user data"
    else
        print_fail "Login response missing user data"
    fi
    
    # Check if cookies were set
    if grep -q "access_token" /tmp/auth_login_cookies.txt; then
        print_pass "Access token cookie was set"
    else
        print_fail "Access token cookie was not set"
    fi
    
    if grep -q "refresh_token" /tmp/auth_login_cookies.txt; then
        print_pass "Refresh token cookie was set"
    else
        print_fail "Refresh token cookie was not set"
    fi
    
else
    print_fail "Login failed with CSRF token (HTTP $login_status)"
    echo "Response: $login_response"
fi

echo ""

# Test 5: Authenticated API access
print_test "Testing authenticated API access"

profile_response=$(curl -s http://localhost:8000/api/auth/me/ -b /tmp/auth_login_cookies.txt)
profile_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/auth/me/ -b /tmp/auth_login_cookies.txt)

if [ "$profile_status" -eq 200 ]; then
    print_pass "Profile endpoint accessible with authentication (HTTP $profile_status)"
    
    if echo "$profile_response" | grep -q '"username":"admin"'; then
        print_pass "Profile response contains correct user data"
    else
        print_fail "Profile response missing or incorrect user data"
    fi
else
    print_fail "Profile endpoint not accessible (HTTP $profile_status)"
fi

echo ""

# Test 6: Frontend CSRF token fetch
print_test "Testing frontend CSRF token integration"

# Simulate frontend behavior
frontend_csrf_response=$(curl -s http://localhost:8000/api/auth/csrf/ \
    -H "Origin: http://localhost:3000" \
    -H "Referer: http://localhost:3000/auth/login" \
    -c /tmp/frontend_csrf_cookies.txt)

frontend_csrf_token=$(echo "$frontend_csrf_response" | python3 -c "import sys, json; print(json.load(sys.stdin)['csrfToken'])" 2>/dev/null)

if [ -n "$frontend_csrf_token" ] && [ ${#frontend_csrf_token} -eq 64 ]; then
    print_pass "Frontend can obtain CSRF token"
    
    # Test frontend-style login
    frontend_login_response=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
        -H "Content-Type: application/json" \
        -H "Origin: http://localhost:3000" \
        -H "Referer: http://localhost:3000/auth/login" \
        -H "X-CSRFToken: $frontend_csrf_token" \
        -d '{"username": "admin", "password": "admin123"}' \
        -b /tmp/frontend_csrf_cookies.txt \
        -c /tmp/frontend_login_cookies.txt)
    
    frontend_login_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/auth/login/ \
        -H "Content-Type: application/json" \
        -H "Origin: http://localhost:3000" \
        -H "Referer: http://localhost:3000/auth/login" \
        -H "X-CSRFToken: $frontend_csrf_token" \
        -d '{"username": "admin", "password": "admin123"}' \
        -b /tmp/frontend_csrf_cookies.txt \
        -c /tmp/frontend_login_cookies.txt)
    
    if [ "$frontend_login_status" -eq 200 ]; then
        print_pass "Frontend-style login successful (HTTP $frontend_login_status)"
    else
        print_fail "Frontend-style login failed (HTTP $frontend_login_status)"
    fi
else
    print_fail "Frontend cannot obtain valid CSRF token"
fi

echo ""

# Test 7: Edge cases
print_test "Testing edge cases"

# Invalid credentials with CSRF
invalid_creds_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -H "X-CSRFToken: $csrf_token" \
    -d '{"username": "invalid", "password": "invalid"}' \
    -b /tmp/auth_test_cookies.txt)

if [ "$invalid_creds_status" -eq 400 ]; then
    print_pass "Invalid credentials correctly rejected (HTTP $invalid_creds_status)"
else
    print_fail "Invalid credentials not handled correctly (HTTP $invalid_creds_status)"
fi

# Invalid CSRF token
invalid_csrf_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -H "X-CSRFToken: invalid_token_123" \
    -d '{"username": "admin", "password": "admin123"}' \
    -b /tmp/auth_test_cookies.txt)

if [ "$invalid_csrf_status" -eq 403 ]; then
    print_pass "Invalid CSRF token correctly rejected (HTTP $invalid_csrf_status)"
else
    print_fail "Invalid CSRF token not handled correctly (HTTP $invalid_csrf_status)"
fi

echo ""

# Cleanup
print_info "Cleaning up test files"
rm -f /tmp/auth_test_cookies.txt /tmp/auth_login_cookies.txt /tmp/frontend_csrf_cookies.txt /tmp/frontend_login_cookies.txt

# Summary
echo "==============================="
echo -e "${BLUE}Authentication Flow Test Summary:${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All authentication tests passed! The flow is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the issues above.${NC}"
    exit 1
fi