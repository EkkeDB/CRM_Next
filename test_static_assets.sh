#!/bin/bash

echo "🔧 Static Assets Test"
echo "===================="

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

# Test 1: Get login page and extract static asset URLs
print_test "Extracting static asset URLs from login page"
LOGIN_PAGE=$(curl -s http://localhost:3000/auth/login)
if echo "$LOGIN_PAGE" | grep -q "Sign In"; then
    print_pass "Login page loads successfully"
    
    # Extract CSS URLs
    CSS_URLS=$(echo "$LOGIN_PAGE" | grep -o '/_next/static/css/[^"]*' | head -5)
    print_info "Found CSS URLs:"
    echo "$CSS_URLS" | while read url; do
        if [ -n "$url" ]; then
            print_info "  $url"
        fi
    done
    
    # Extract JS URLs
    JS_URLS=$(echo "$LOGIN_PAGE" | grep -o '/_next/static/chunks/[^"]*' | head -10)
    print_info "Found JS URLs:"
    echo "$JS_URLS" | while read url; do
        if [ -n "$url" ]; then
            print_info "  $url"
        fi
    done
    
    # Extract font URLs
    FONT_URLS=$(echo "$LOGIN_PAGE" | grep -o '/_next/static/media/[^"]*' | head -5)
    print_info "Found Font URLs:"
    echo "$FONT_URLS" | while read url; do
        if [ -n "$url" ]; then
            print_info "  $url"
        fi
    done
else
    print_fail "Login page failed to load"
fi

echo ""

# Test 2: Test individual static assets
print_test "Testing individual static assets"

# Test CSS files
for url in $CSS_URLS; do
    if [ -n "$url" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$url")
        if [ "$response" -eq 200 ]; then
            print_pass "CSS file accessible: $url (HTTP $response)"
        else
            print_fail "CSS file failed: $url (HTTP $response)"
        fi
    fi
done

# Test JS files
for url in $JS_URLS; do
    if [ -n "$url" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$url")
        if [ "$response" -eq 200 ]; then
            print_pass "JS file accessible: $url (HTTP $response)"
        else
            print_fail "JS file failed: $url (HTTP $response)"
        fi
    fi
done

# Test font files
for url in $FONT_URLS; do
    if [ -n "$url" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$url")
        if [ "$response" -eq 200 ]; then
            print_pass "Font file accessible: $url (HTTP $response)"
        else
            print_fail "Font file failed: $url (HTTP $response)"
        fi
    fi
done

echo ""

# Test 3: Test browser-like requests with proper headers
print_test "Testing static assets with browser-like headers"

# Test main CSS with browser headers
MAIN_CSS=$(echo "$CSS_URLS" | head -1)
if [ -n "$MAIN_CSS" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Accept: text/css,*/*;q=0.1" \
        -H "Accept-Language: en-GB,en;q=0.9" \
        -H "Sec-Fetch-Dest: style" \
        -H "Sec-Fetch-Mode: no-cors" \
        -H "Sec-Fetch-Site: same-origin" \
        -H "Referer: http://localhost:3000/auth/login" \
        "http://localhost:3000$MAIN_CSS")
    
    if [ "$response" -eq 200 ]; then
        print_pass "CSS with browser headers: HTTP $response"
    else
        print_fail "CSS with browser headers: HTTP $response"
    fi
fi

# Test main JS with browser headers
MAIN_JS=$(echo "$JS_URLS" | head -1)
if [ -n "$MAIN_JS" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Accept: */*" \
        -H "Accept-Language: en-GB,en;q=0.9" \
        -H "Sec-Fetch-Dest: script" \
        -H "Sec-Fetch-Mode: no-cors" \
        -H "Sec-Fetch-Site: same-origin" \
        -H "Referer: http://localhost:3000/auth/login" \
        "http://localhost:3000$MAIN_JS")
    
    if [ "$response" -eq 200 ]; then
        print_pass "JS with browser headers: HTTP $response"
    else
        print_fail "JS with browser headers: HTTP $response"
    fi
fi

echo ""

# Test 4: Test favicon and public assets
print_test "Testing public assets"

response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/favicon.ico")
if [ "$response" -eq 200 ]; then
    print_pass "Favicon accessible (HTTP $response)"
else
    print_fail "Favicon failed (HTTP $response)"
fi

echo ""

# Summary
echo "==============================="
echo -e "${BLUE}Static Assets Test Summary:${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All static assets are working correctly!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some static assets failed. Please check the issues above.${NC}"
    exit 1
fi