#!/bin/bash

# Test Complete Authentication Flow
# This script tests the entire authentication flow including login, token persistence, and /me endpoint

echo "🔥 TESTING COMPLETE AUTHENTICATION FLOW"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASS=0
FAIL=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    echo -e "\n${BLUE}Testing: ${test_name}${NC}"
    echo "Command: $test_command"
    
    # Run the command and capture output
    output=$(eval "$test_command" 2>&1)
    exit_code=$?
    
    # Check if command succeeded and output matches expected pattern
    if [ $exit_code -eq 0 ] && echo "$output" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASS++))
        echo "Output: $output"
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAIL++))
        echo "Exit code: $exit_code"
        echo "Output: $output"
        echo "Expected pattern: $expected_pattern"
    fi
}

# Function to test authentication flow
test_auth_flow() {
    local test_number="$1"
    echo -e "\n${YELLOW}========== AUTHENTICATION FLOW TEST ${test_number} ==========${NC}"
    
    # Clean up any existing cookies
    rm -f test_cookies_${test_number}.txt
    
    # Step 1: Get CSRF token
    run_test "Get CSRF Token" \
        "curl -s -c test_cookies_${test_number}.txt 'http://localhost:8000/api/auth/csrf/'" \
        "csrfToken"
    
    # Extract CSRF token from response
    csrf_response=$(curl -s -c test_cookies_${test_number}.txt 'http://localhost:8000/api/auth/csrf/')
    csrf_token=$(echo "$csrf_response" | python3 -c "import sys, json; print(json.load(sys.stdin)['csrfToken'])" 2>/dev/null || echo "")
    echo "CSRF Response: $csrf_response"
    echo "CSRF Token: $csrf_token"
    
    # Step 2: Login with credentials
    run_test "Login with Credentials" \
        "curl -s -b test_cookies_${test_number}.txt -c test_cookies_${test_number}.txt -H 'Content-Type: application/json' -H 'X-CSRFToken: $csrf_token' -d '{\"username\":\"admin\",\"password\":\"admin123\"}' 'http://localhost:8000/api/auth/login/'" \
        "Login successful"
    
    # Step 3: Check that cookies were set
    run_test "Check Cookies are Set" \
        "grep -E '(access_token|refresh_token)' test_cookies_${test_number}.txt" \
        "token"
    
    # Step 4: Test /auth/me/ endpoint
    run_test "Test /auth/me/ Endpoint" \
        "curl -s -b test_cookies_${test_number}.txt 'http://localhost:8000/api/auth/me/'" \
        "admin"
    
    # Step 5: Test logout
    run_test "Test Logout" \
        "curl -s -b test_cookies_${test_number}.txt -c test_cookies_${test_number}.txt -H 'Content-Type: application/json' -H 'X-CSRFToken: $csrf_token' -X POST 'http://localhost:8000/api/auth/logout/'" \
        "Logout successful"
    
    # Step 6: Verify /auth/me/ returns 401 after logout
    run_test "Verify Logout (Authentication credentials not provided)" \
        "curl -s -b test_cookies_${test_number}.txt 'http://localhost:8000/api/auth/me/'" \
        "Authentication credentials were not provided"
    
    # Clean up
    rm -f test_cookies_${test_number}.txt
}

# Run three complete authentication flow tests
echo -e "${YELLOW}Starting 3 complete authentication flow tests...${NC}"

test_auth_flow "1"
test_auth_flow "2" 
test_auth_flow "3"

# Final summary
echo -e "\n${YELLOW}========== FINAL SUMMARY ==========${NC}"
echo -e "Total Tests: $((PASS + FAIL))"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"

if [ $FAIL -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Authentication flow is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the output above.${NC}"
    exit 1
fi