#!/bin/bash

echo "🧪 Comprehensive Login Flow Test"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
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

# Test 1: Frontend accessibility
print_test "Testing frontend accessibility"
if curl -s http://localhost:3000/auth/login | grep -q -i "sign in"; then
    print_pass "Frontend login page is accessible"
else
    print_fail "Frontend login page is not accessible"
fi

# Test 2: Backend health
print_test "Testing backend health"
if curl -s http://localhost:8000/api/auth/health/ | grep -q "healthy"; then
    print_pass "Backend health check passed"
else
    print_fail "Backend health check failed"
fi

# Test 3: Backend login API
print_test "Testing backend login API"
COOKIE_JAR="/tmp/test_cookies_$(date +%s).txt"
LOGIN_RESPONSE=$(curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  -c "$COOKIE_JAR" \
  -s)

if echo "$LOGIN_RESPONSE" | grep -q "Login successful"; then
    print_pass "Backend login API works correctly"
    print_info "Login response: $(echo $LOGIN_RESPONSE | jq -r .message 2>/dev/null || echo $LOGIN_RESPONSE)"
else
    print_fail "Backend login API failed"
    print_info "Response: $LOGIN_RESPONSE"
fi

# Test 4: Authentication verification
print_test "Testing authentication verification"
ME_RESPONSE=$(curl -s http://localhost:8000/api/auth/me/ -b "$COOKIE_JAR")
if echo "$ME_RESPONSE" | grep -q "admin"; then
    print_pass "Authentication verification works"
    USERNAME=$(echo "$ME_RESPONSE" | jq -r .username 2>/dev/null || echo "Unknown")
    print_info "Authenticated as: $USERNAME"
else
    print_fail "Authentication verification failed"
    print_info "Response: $ME_RESPONSE"
fi

# Test 5: Contracts API accessibility
print_test "Testing contracts API accessibility"
CONTRACTS_RESPONSE=$(curl -s http://localhost:8000/api/contracts/ -b "$COOKIE_JAR")
if echo "$CONTRACTS_RESPONSE" | grep -q '"count"'; then
    print_pass "Contracts API is accessible"
    COUNT=$(echo "$CONTRACTS_RESPONSE" | jq -r .count 2>/dev/null || echo "Unknown")
    print_info "Contracts count: $COUNT"
else
    print_fail "Contracts API is not accessible"
    print_info "Response: $CONTRACTS_RESPONSE"
fi

# Test 6: Dashboard page accessibility (check for redirect or content)
print_test "Testing dashboard page accessibility"
DASHBOARD_RESPONSE=$(curl -s -L -b "$COOKIE_JAR" http://localhost:3000/dashboard)
if echo "$DASHBOARD_RESPONSE" | grep -q -i "dashboard\|loading\|welcome"; then
    print_pass "Dashboard page is accessible"
else
    print_fail "Dashboard page is not accessible or redirecting unexpectedly"
fi

# Test 7: Contracts page accessibility
print_test "Testing contracts page accessibility"
CONTRACTS_PAGE_RESPONSE=$(curl -s -L -b "$COOKIE_JAR" http://localhost:3000/dashboard/contracts)
if echo "$CONTRACTS_PAGE_RESPONSE" | grep -q -i "contract\|loading"; then
    print_pass "Contracts page is accessible"
else
    print_fail "Contracts page is not accessible"
fi

# Test 8: Logout functionality
print_test "Testing logout functionality"
LOGOUT_RESPONSE=$(curl -X POST http://localhost:8000/api/auth/logout/ \
  -b "$COOKIE_JAR" \
  -c "$COOKIE_JAR" \
  -s)

if echo "$LOGOUT_RESPONSE" | grep -q "Logout successful"; then
    print_pass "Logout API works correctly"
else
    print_fail "Logout API failed"
    print_info "Response: $LOGOUT_RESPONSE"
fi

# Test 9: Verify logout (should fail to access protected endpoint)
print_test "Testing post-logout authentication"
POST_LOGOUT_RESPONSE=$(curl -s http://localhost:8000/api/auth/me/ -b "$COOKIE_JAR")
if echo "$POST_LOGOUT_RESPONSE" | grep -q -i "unauthorized\|not authenticated\|error\|credentials were not provided"; then
    print_pass "Post-logout authentication properly denied"
else
    print_fail "Post-logout authentication not properly denied"
    print_info "Response: $POST_LOGOUT_RESPONSE"
fi

# Cleanup
rm -f "$COOKIE_JAR"

# Summary
echo ""
echo "==============================="
echo -e "${BLUE}Test Summary:${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! The login flow is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the issues above.${NC}"
    exit 1
fi