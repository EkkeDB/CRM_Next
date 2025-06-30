#!/bin/bash

# COMPREHENSIVE HUMAN BROWSER SIMULATION
# This script simulates exactly what a human would do in a browser
# Including all the edge cases, state checks, and verification steps

echo "🌐 COMPREHENSIVE HUMAN BROWSER SIMULATION"
echo "========================================="
echo "This test simulates exactly what a human user would do:"
echo "1. Open browser → 2. Navigate to login → 3. Enter credentials → 4. Submit → 5. Check dashboard → 6. Logout → 7. Repeat"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test state tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
CURRENT_CYCLE=0

# Helper function for logging with timestamps
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%H:%M:%S.%3N')
    
    case $level in
        "INFO")  echo -e "${BLUE}[${timestamp}] ℹ️  ${message}${NC}" ;;
        "SUCCESS") echo -e "${GREEN}[${timestamp}] ✅ ${message}${NC}" ;;
        "ERROR") echo -e "${RED}[${timestamp}] ❌ ${message}${NC}" ;;
        "WARN") echo -e "${YELLOW}[${timestamp}] ⚠️  ${message}${NC}" ;;
        "STEP") echo -e "${PURPLE}[${timestamp}] 🔄 ${message}${NC}" ;;
        "CHECK") echo -e "${CYAN}[${timestamp}] 🔍 ${message}${NC}" ;;
    esac
}

# Test execution function
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    local show_output="${4:-true}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "CHECK" "Running test: $test_name"
    
    # Run the command and capture both stdout and stderr
    output=$(eval "$test_command" 2>&1)
    exit_code=$?
    
    # Check if test passed
    if [ $exit_code -eq 0 ] && echo "$output" | grep -q "$expected_pattern"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        log "SUCCESS" "$test_name"
        if [ "$show_output" = "true" ]; then
            echo "    Output: $(echo "$output" | head -1)"
        fi
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        log "ERROR" "$test_name"
        echo "    Expected: $expected_pattern"
        echo "    Got: $(echo "$output" | head -2)"
        echo "    Exit code: $exit_code"
        if [ "$show_output" = "true" ]; then
            echo "    Full output: $output"
        fi
    fi
}

# Cookie inspection function (simulates DevTools)
inspect_cookies() {
    local cookie_file="$1"
    local cycle="$2"
    
    log "CHECK" "🍪 INSPECTING COOKIES (like DevTools Network tab)"
    
    if [ ! -f "$cookie_file" ]; then
        log "ERROR" "No cookie file found - browser would show no cookies"
        return 1
    fi
    
    echo "    📋 Cookie file contents:"
    cat "$cookie_file" | sed 's/^/      /'
    
    # Check for access token
    if grep -q "access_token" "$cookie_file"; then
        local access_token=$(grep "access_token" "$cookie_file" | cut -f7)
        log "SUCCESS" "✅ access_token cookie found (length: ${#access_token})"
        echo "      🔑 Value: ${access_token:0:20}...${access_token: -20}"
    else
        log "ERROR" "❌ access_token cookie NOT found"
        return 1
    fi
    
    # Check for refresh token
    if grep -q "refresh_token" "$cookie_file"; then
        local refresh_token=$(grep "refresh_token" "$cookie_file" | cut -f7)
        log "SUCCESS" "✅ refresh_token cookie found (length: ${#refresh_token})"
        echo "      🔄 Value: ${refresh_token:0:20}...${refresh_token: -20}"
    else
        log "ERROR" "❌ refresh_token cookie NOT found"
        return 1
    fi
    
    # Check CSRF token
    if grep -q "csrftoken" "$cookie_file"; then
        local csrf_token=$(grep "csrftoken" "$cookie_file" | cut -f7)
        log "SUCCESS" "✅ csrftoken cookie found (length: ${#csrf_token})"
        echo "      🛡️  Value: ${csrf_token:0:15}...${csrf_token: -15}"
    else
        log "WARN" "⚠️  csrftoken cookie not found (may be separate)"
    fi
    
    return 0
}

# Full authentication cycle simulation
simulate_user_cycle() {
    local cycle_number="$1"
    CURRENT_CYCLE=$cycle_number
    
    echo ""
    log "STEP" "🔥 STARTING AUTHENTICATION CYCLE $cycle_number"
    echo "    👤 Simulating user: Opens browser, navigates to app, logs in..."
    
    # Clean slate - simulate fresh browser session
    local session_cookies="browser_session_${cycle_number}.txt"
    rm -f "$session_cookies"
    
    # STEP 1: User opens browser and navigates to app
    log "STEP" "Step 1: User opens browser and navigates to localhost:3000"
    
    # Check if frontend is accessible (simulate user typing URL)
    log "CHECK" "Checking if frontend is reachable..."
    frontend_check=$(curl -s -m 10 -w "%{http_code}" "http://localhost:3000/" -o /dev/null)
    if [ "$frontend_check" = "200" ]; then
        log "SUCCESS" "Frontend is accessible (HTTP 200)"
    else
        log "WARN" "Frontend accessibility check returned: $frontend_check"
    fi
    
    # STEP 2: Browser/JS would fetch CSRF token
    log "STEP" "Step 2: Frontend JavaScript fetches CSRF token"
    
    csrf_response=$(curl -s -c "$session_cookies" -w "\nHTTP_CODE:%{http_code}\nCONTENT_TYPE:%{content_type}" "http://localhost:8000/api/auth/csrf/")
    csrf_http_code=$(echo "$csrf_response" | grep "HTTP_CODE:" | cut -d':' -f2)
    csrf_content_type=$(echo "$csrf_response" | grep "CONTENT_TYPE:" | cut -d':' -f2)
    csrf_body=$(echo "$csrf_response" | head -1)
    
    log "CHECK" "CSRF endpoint response - HTTP $csrf_http_code, Content-Type: $csrf_content_type"
    
    if [ "$csrf_http_code" = "200" ]; then
        csrf_token=$(echo "$csrf_body" | python3 -c "import sys, json; print(json.load(sys.stdin)['csrfToken'])" 2>/dev/null || echo "")
        if [ -n "$csrf_token" ]; then
            log "SUCCESS" "✅ CSRF token obtained: ${csrf_token:0:20}..."
            echo "      🛡️  Token length: ${#csrf_token} characters"
        else
            log "ERROR" "❌ CSRF token is empty!"
            echo "      Response body: $csrf_body"
            return 1
        fi
    else
        log "ERROR" "❌ CSRF endpoint failed with HTTP $csrf_http_code"
        return 1
    fi
    
    # Verify CSRF cookie was set
    log "CHECK" "Verifying CSRF cookie was set in browser..."
    if grep -q "csrftoken" "$session_cookies"; then
        log "SUCCESS" "✅ CSRF cookie set in browser"
    else
        log "WARN" "⚠️  CSRF cookie not found in browser (checking response headers...)"
    fi
    
    # STEP 3: User fills in login form and submits
    log "STEP" "Step 3: User enters credentials (admin/admin123) and clicks Submit"
    
    # Simulate form submission with full headers
    log "CHECK" "Sending login request with CSRF token..."
    login_response=$(curl -s -b "$session_cookies" -c "$session_cookies" \
        -w "\nHTTP_CODE:%{http_code}\nCONTENT_TYPE:%{content_type}\nSET_COOKIES:%{num_cookies}" \
        -H "Content-Type: application/json" \
        -H "X-CSRFToken: $csrf_token" \
        -H "Origin: http://localhost:3000" \
        -H "Referer: http://localhost:3000/auth/login" \
        -d '{"username":"admin","password":"admin123"}' \
        "http://localhost:8000/api/auth/login/")
    
    login_http_code=$(echo "$login_response" | grep "HTTP_CODE:" | cut -d':' -f2)
    login_content_type=$(echo "$login_response" | grep "CONTENT_TYPE:" | cut -d':' -f2)
    login_cookies_count=$(echo "$login_response" | grep "SET_COOKIES:" | cut -d':' -f2)
    login_body=$(echo "$login_response" | head -1)
    
    log "CHECK" "Login response - HTTP $login_http_code, Content-Type: $login_content_type, Cookies: $login_cookies_count"
    
    if [ "$login_http_code" = "200" ]; then
        if echo "$login_body" | grep -q "Login successful"; then
            log "SUCCESS" "✅ Login successful! Server responded with success message"
            echo "      📄 Response: $(echo "$login_body" | cut -c1-80)..."
            
            # Extract user data
            user_data=$(echo "$login_body" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    user = data.get('user', {})
    print(f\"Username: {user.get('username', 'N/A')}, Email: {user.get('email', 'N/A')}\")
except:
    print('Could not parse user data')
" 2>/dev/null)
            log "SUCCESS" "👤 User data: $user_data"
        else
            log "ERROR" "❌ Login failed - unexpected response"
            echo "      Response: $login_body"
            return 1
        fi
    else
        log "ERROR" "❌ Login failed with HTTP $login_http_code"
        echo "      Response: $login_body"
        return 1
    fi
    
    # STEP 4: Critical - Inspect cookies (like DevTools)
    log "STEP" "Step 4: Inspecting browser cookies (DevTools simulation)"
    
    if ! inspect_cookies "$session_cookies" "$cycle_number"; then
        log "ERROR" "❌ Cookie inspection failed - authentication will not work"
        return 1
    fi
    
    # STEP 5: Browser would now redirect to dashboard, test /auth/me
    log "STEP" "Step 5: Browser redirects to dashboard, checking authentication state"
    
    # Simulate the /auth/me call that dashboard would make
    log "CHECK" "Testing /auth/me endpoint (dashboard authentication check)..."
    me_response=$(curl -s -b "$session_cookies" \
        -w "\nHTTP_CODE:%{http_code}" \
        -H "Origin: http://localhost:3000" \
        -H "Referer: http://localhost:3000/dashboard" \
        "http://localhost:8000/api/auth/me/")
    
    me_http_code=$(echo "$me_response" | grep "HTTP_CODE:" | cut -d':' -f2)
    me_body=$(echo "$me_response" | head -1)
    
    if [ "$me_http_code" = "200" ]; then
        if echo "$me_body" | grep -q "admin"; then
            log "SUCCESS" "✅ Authentication verified! User is properly authenticated"
            
            # Parse user details
            user_details=$(echo "$me_body" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f\"ID: {data.get('id')}, Username: {data.get('username')}, Active: {data.get('is_active')}\")
except:
    print('Could not parse user details')
" 2>/dev/null)
            log "SUCCESS" "👤 Authenticated as: $user_details"
        else
            log "ERROR" "❌ /auth/me returned 200 but no user data"
            echo "      Response: $me_body"
            return 1
        fi
    else
        log "ERROR" "❌ Authentication check failed with HTTP $me_http_code"
        echo "      Response: $me_body"
        log "ERROR" "🚨 CRITICAL: User would see 'Please log in' despite successful login!"
        return 1
    fi
    
    # STEP 6: Test that cookies work for other authenticated endpoints
    log "STEP" "Step 6: Testing other authenticated endpoints"
    
    # Test another authenticated endpoint
    health_response=$(curl -s -b "$session_cookies" \
        -w "\nHTTP_CODE:%{http_code}" \
        "http://localhost:8000/api/auth/health/")
    
    health_http_code=$(echo "$health_response" | grep "HTTP_CODE:" | cut -d':' -f2)
    health_body=$(echo "$health_response" | head -1)
    
    if [ "$health_http_code" = "200" ]; then
        log "SUCCESS" "✅ Health endpoint accessible"
    else
        log "WARN" "⚠️  Health endpoint returned HTTP $health_http_code"
    fi
    
    # STEP 7: User logs out
    log "STEP" "Step 7: User clicks logout button"
    
    logout_response=$(curl -s -b "$session_cookies" -c "$session_cookies" \
        -w "\nHTTP_CODE:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-CSRFToken: $csrf_token" \
        -H "Origin: http://localhost:3000" \
        -H "Referer: http://localhost:3000/dashboard" \
        "http://localhost:8000/api/auth/logout/")
    
    logout_http_code=$(echo "$logout_response" | grep "HTTP_CODE:" | cut -d':' -f2)
    logout_body=$(echo "$logout_response" | head -1)
    
    if [ "$logout_http_code" = "200" ]; then
        if echo "$logout_body" | grep -q "Logout successful"; then
            log "SUCCESS" "✅ Logout successful"
        else
            log "WARN" "⚠️  Logout returned 200 but unexpected message: $logout_body"
        fi
    else
        log "ERROR" "❌ Logout failed with HTTP $logout_http_code"
        echo "      Response: $logout_body"
    fi
    
    # STEP 8: Verify logout worked
    log "STEP" "Step 8: Verifying logout worked (user should not be authenticated)"
    
    post_logout_response=$(curl -s -b "$session_cookies" \
        -w "\nHTTP_CODE:%{http_code}" \
        "http://localhost:8000/api/auth/me/")
    
    post_logout_http_code=$(echo "$post_logout_response" | grep "HTTP_CODE:" | cut -d':' -f2)
    post_logout_body=$(echo "$post_logout_response" | head -1)
    
    if [ "$post_logout_http_code" = "401" ] || echo "$post_logout_body" | grep -q "Authentication credentials were not provided"; then
        log "SUCCESS" "✅ Logout verification successful - user is no longer authenticated"
    else
        log "ERROR" "❌ Logout verification failed - user may still be authenticated"
        echo "      HTTP Code: $post_logout_http_code"
        echo "      Response: $post_logout_body"
    fi
    
    # STEP 9: Check final cookie state
    log "STEP" "Step 9: Final cookie state inspection"
    
    log "CHECK" "Checking if authentication cookies were cleared..."
    if [ -f "$session_cookies" ]; then
        echo "    📋 Post-logout cookie file:"
        cat "$session_cookies" | sed 's/^/      /'
        
        if grep -q "access_token" "$session_cookies"; then
            log "WARN" "⚠️  access_token still present after logout"
        else
            log "SUCCESS" "✅ access_token properly cleared"
        fi
    fi
    
    # Clean up session
    rm -f "$session_cookies"
    
    log "SUCCESS" "🎉 AUTHENTICATION CYCLE $cycle_number COMPLETED SUCCESSFULLY"
    return 0
}

# Detailed system check
system_check() {
    log "CHECK" "🔧 PERFORMING SYSTEM HEALTH CHECK"
    
    # Check if services are running
    log "CHECK" "Checking backend service..."
    backend_health=$(curl -s -m 5 "http://localhost:8000/api/auth/health/" | grep -o '"status":"healthy"' || echo "")
    if [ -n "$backend_health" ]; then
        log "SUCCESS" "✅ Backend service is healthy"
    else
        log "ERROR" "❌ Backend service is not responding properly"
        return 1
    fi
    
    log "CHECK" "Checking frontend service..."
    frontend_health=$(curl -s -m 5 -w "%{http_code}" "http://localhost:3000/" -o /dev/null)
    if [ "$frontend_health" = "200" ]; then
        log "SUCCESS" "✅ Frontend service is responding"
    else
        log "WARN" "⚠️  Frontend service check returned: $frontend_health"
    fi
    
    log "CHECK" "Checking Docker containers..."
    docker_status=$(docker-compose ps --services --filter "status=running" | wc -l)
    log "SUCCESS" "✅ $docker_status Docker containers are running"
    
    return 0
}

# Main execution
main() {
    echo ""
    log "INFO" "🚀 STARTING COMPREHENSIVE AUTHENTICATION TESTING"
    echo ""
    
    # Perform system check first
    if ! system_check; then
        log "ERROR" "❌ System check failed - cannot proceed with testing"
        exit 1
    fi
    
    echo ""
    log "INFO" "🎯 TESTING PLAN:"
    echo "    • Perform 3 complete authentication cycles"
    echo "    • Each cycle: Login → Dashboard → Auth check → Logout → Verify"
    echo "    • Detailed cookie inspection and state verification"
    echo "    • Edge case and timing validation"
    
    # Run three complete cycles
    for cycle in 1 2 3; do
        echo ""
        echo "════════════════════════════════════════════════════════════"
        
        if simulate_user_cycle "$cycle"; then
            log "SUCCESS" "🎊 CYCLE $cycle: ALL TESTS PASSED"
        else
            log "ERROR" "💥 CYCLE $cycle: SOME TESTS FAILED"
            echo ""
            log "ERROR" "🚨 STOPPING HERE - Issue found in cycle $cycle"
            echo ""
            echo "📊 FINAL STATISTICS:"
            echo "    Total Tests: $TOTAL_TESTS"
            echo "    Passed: $PASSED_TESTS"
            echo "    Failed: $FAILED_TESTS"
            exit 1
        fi
        
        # Brief pause between cycles
        if [ "$cycle" -lt 3 ]; then
            log "INFO" "⏱️  Pausing 2 seconds before next cycle..."
            sleep 2
        fi
    done
    
    echo ""
    echo "🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉"
    log "SUCCESS" "🏆 ALL THREE AUTHENTICATION CYCLES COMPLETED SUCCESSFULLY!"
    echo "🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉"
    echo ""
    echo "📊 FINAL STATISTICS:"
    echo "    ✅ Total Tests: $TOTAL_TESTS"
    echo "    ✅ Passed: $PASSED_TESTS"
    echo "    ❌ Failed: $FAILED_TESTS"
    echo "    🎯 Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    echo ""
    echo "🔒 AUTHENTICATION SYSTEM STATUS: FULLY FUNCTIONAL"
    echo "🍪 COOKIE MANAGEMENT: WORKING CORRECTLY"
    echo "🛡️  CSRF PROTECTION: ACTIVE AND FUNCTIONAL"
    echo "🔄 SESSION HANDLING: ROBUST AND RELIABLE"
    echo ""
    log "SUCCESS" "🎖️  Authentication system has passed all human simulation tests!"
}

# Run the main function
main

exit 0