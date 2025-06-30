#!/bin/bash

echo "🌐 Frontend Functionality Test"
echo "=============================="

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

# Test 1: Frontend pages load correctly
print_test "Testing frontend page loading"

pages=(
    "/auth/login"
    "/dashboard"
    "/dashboard/contracts"
    "/dashboard/commodities"
    "/dashboard/counterparties"
)

for page in "${pages[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$page")
    if [ "$response" -eq 200 ]; then
        print_pass "Page $page loads correctly (HTTP $response)"
    else
        print_fail "Page $page failed (HTTP $response)"
    fi
done

echo ""

# Test 2: Static assets for login page
print_test "Testing static assets for login page"

# Get login page content
login_content=$(curl -s "http://localhost:3000/auth/login")

# Check if page contains expected elements
if echo "$login_content" | grep -q "Sign In"; then
    print_pass "Login page contains Sign In button"
else
    print_fail "Login page missing Sign In button"
fi

if echo "$login_content" | grep -q "NextCRM"; then
    print_pass "Login page contains NextCRM branding"
else
    print_fail "Login page missing NextCRM branding"
fi

if echo "$login_content" | grep -q "username"; then
    print_pass "Login page contains username field"
else
    print_fail "Login page missing username field"
fi

if echo "$login_content" | grep -q "password"; then
    print_pass "Login page contains password field"
else
    print_fail "Login page missing password field"
fi

# Check if CSS is loaded
if echo "$login_content" | grep -q "_next/static/css"; then
    print_pass "Login page includes CSS files"
else
    print_fail "Login page missing CSS files"
fi

# Check if JavaScript is loaded
if echo "$login_content" | grep -q "_next/static/chunks"; then
    print_pass "Login page includes JavaScript files"
else
    print_fail "Login page missing JavaScript files"
fi

echo ""

# Test 3: Test actual login process
print_test "Testing login process functionality"

# Create a cookie jar for this test
cookie_jar="/tmp/frontend_test_$(date +%s).txt"

# Get CSRF token
csrf_response=$(curl -s http://localhost:8000/api/auth/csrf/ -c "$cookie_jar")
csrf_token=$(echo "$csrf_response" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$csrf_token" ]; then
    print_pass "CSRF token obtained successfully"
    
    # Attempt login
    login_response=$(curl -X POST http://localhost:8000/api/auth/login/ \
      -H "Content-Type: application/json" \
      -H "X-CSRFToken: $csrf_token" \
      -d '{"username": "admin", "password": "admin123"}' \
      -b "$cookie_jar" \
      -c "$cookie_jar" \
      -s)
    
    if echo "$login_response" | grep -q "Login successful"; then
        print_pass "Login API works correctly"
        
        # Test authenticated access to dashboard API
        me_response=$(curl -s http://localhost:8000/api/auth/me/ -b "$cookie_jar")
        if echo "$me_response" | grep -q "admin"; then
            print_pass "Authentication verification works"
            
            # Test access to protected API endpoints
            contracts_response=$(curl -s http://localhost:8000/api/contracts/ -b "$cookie_jar")
            if echo "$contracts_response" | grep -q '"count"'; then
                print_pass "Protected API endpoints accessible"
            else
                print_fail "Protected API endpoints not accessible"
            fi
        else
            print_fail "Authentication verification failed"
        fi
    else
        print_fail "Login API failed"
    fi
else
    print_fail "Failed to obtain CSRF token"
fi

# Cleanup
rm -f "$cookie_jar"

echo ""

# Test 4: Check for any 404 errors on static assets
print_test "Checking for 404 errors on static assets"

# Get the login page and extract all asset URLs
login_page=$(curl -s "http://localhost:3000/auth/login")
asset_urls=$(echo "$login_page" | grep -oE '/_next/static/[^"]*' | sort | uniq)

error_count=0
total_assets=0

for url in $asset_urls; do
    if [ -n "$url" ]; then
        total_assets=$((total_assets + 1))
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$url")
        if [ "$response" -ne 200 ]; then
            print_fail "Asset failed: $url (HTTP $response)"
            error_count=$((error_count + 1))
        fi
    fi
done

if [ $error_count -eq 0 ]; then
    print_pass "All $total_assets static assets load successfully"
else
    print_fail "$error_count out of $total_assets static assets failed"
fi

echo ""

# Test 5: Performance check
print_test "Performance check"

start_time=$(date +%s%N)
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/auth/login")
end_time=$(date +%s%N)
duration_ms=$(( (end_time - start_time) / 1000000 ))

if [ "$response" -eq 200 ] && [ $duration_ms -lt 2000 ]; then
    print_pass "Login page loads in ${duration_ms}ms (under 2 seconds)"
elif [ "$response" -eq 200 ]; then
    print_info "Login page loads in ${duration_ms}ms (over 2 seconds but working)"
    print_pass "Page loads successfully but could be faster"
else
    print_fail "Login page failed to load (HTTP $response)"
fi

echo ""

# Summary
echo "==============================="
echo -e "${BLUE}Frontend Functionality Test Summary:${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All frontend functionality tests passed! The application is fully working.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the issues above.${NC}"
    exit 1
fi