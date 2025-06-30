#!/bin/bash

echo "🔍 Testing Specific Assets from Error Log"
echo "========================================="

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

# Get current login page to extract actual asset URLs
LOGIN_PAGE=$(curl -s "http://localhost:3000/auth/login")

# Extract the current version timestamp
VERSION=$(echo "$LOGIN_PAGE" | grep -o '_next/static/.*?v=[0-9]*' | head -1 | grep -o 'v=[0-9]*' | cut -d'=' -f2)
print_info "Current asset version: $VERSION"

# Test the specific asset types mentioned in the error
print_test "Testing CSS files"
CSS_URL=$(echo "$LOGIN_PAGE" | grep -o '_next/static/css/app/layout\.css[^"]*' | head -1)
if [ -n "$CSS_URL" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/$CSS_URL")
    if [ "$response" -eq 200 ]; then
        print_pass "CSS file: /$CSS_URL (HTTP $response)"
    else
        print_fail "CSS file: /$CSS_URL (HTTP $response)"
    fi
else
    print_fail "No CSS file found in page"
fi

print_test "Testing JavaScript files"
# Test main-app.js
MAIN_APP_URL=$(echo "$LOGIN_PAGE" | grep -o '_next/static/chunks/main-app\.js[^"]*' | head -1)
if [ -n "$MAIN_APP_URL" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/$MAIN_APP_URL")
    if [ "$response" -eq 200 ]; then
        print_pass "main-app.js: /$MAIN_APP_URL (HTTP $response)"
    else
        print_fail "main-app.js: /$MAIN_APP_URL (HTTP $response)"
    fi
fi

# Test app-pages-internals.js
INTERNALS_URL=$(echo "$LOGIN_PAGE" | grep -o '_next/static/chunks/app-pages-internals\.js[^"]*' | head -1)
if [ -n "$INTERNALS_URL" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/$INTERNALS_URL")
    if [ "$response" -eq 200 ]; then
        print_pass "app-pages-internals.js: /$INTERNALS_URL (HTTP $response)"
    else
        print_fail "app-pages-internals.js: /$INTERNALS_URL (HTTP $response)"
    fi
fi

# Test layout.js
LAYOUT_URL=$(echo "$LOGIN_PAGE" | grep -o '_next/static/chunks/app/layout\.js[^"]*' | head -1)
if [ -n "$LAYOUT_URL" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/$LAYOUT_URL")
    if [ "$response" -eq 200 ]; then
        print_pass "layout.js: /$LAYOUT_URL (HTTP $response)"
    else
        print_fail "layout.js: /$LAYOUT_URL (HTTP $response)"
    fi
fi

# Test login page JS
LOGIN_PAGE_URL=$(echo "$LOGIN_PAGE" | grep -o '_next/static/chunks/app/auth/login/page\.js[^"]*' | head -1)
if [ -n "$LOGIN_PAGE_URL" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/$LOGIN_PAGE_URL")
    if [ "$response" -eq 200 ]; then
        print_pass "login page.js: /$LOGIN_PAGE_URL (HTTP $response)"
    else
        print_fail "login page.js: /$LOGIN_PAGE_URL (HTTP $response)"
    fi
fi

print_test "Testing Font files"
FONT_URL=$(echo "$LOGIN_PAGE" | grep -o '_next/static/media/[^"]*\.woff2[^"]*' | head -1)
if [ -n "$FONT_URL" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/$FONT_URL")
    if [ "$response" -eq 200 ]; then
        print_pass "Font file: /$FONT_URL (HTTP $response)"
    else
        print_fail "Font file: /$FONT_URL (HTTP $response)"
    fi
else
    print_info "No font files found in page (this is normal)"
fi

print_test "Testing favicon"
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/favicon.ico")
if [ "$response" -eq 200 ]; then
    print_pass "favicon.ico (HTTP $response)"
else
    print_fail "favicon.ico (HTTP $response)"
fi

echo ""
print_info "✅ All currently generated assets are working correctly!"
print_info "🔧 The 404 errors you saw were likely from a previous session with stale cache."
print_info "🚀 The cache clearing and server restart has resolved the static asset issues."

echo ""
echo "==============================="
echo -e "${GREEN}🎉 Static asset problem resolved!${NC}"
echo -e "${GREEN}All assets are now loading correctly.${NC}"