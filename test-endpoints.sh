#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Testing User Service Endpoints..."
echo ""

# Wait for service to be ready
echo "⏳ Waiting for service to start..."
sleep 5

# Base URL
BASE_URL="http://localhost:3000/api/v1"

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
HEALTH=$(curl -s -w "\n%{http_code}" $BASE_URL/health)
HTTP_CODE=$(echo "$HEALTH" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 2: API Root
echo -e "${YELLOW}2. Testing API Root...${NC}"
ROOT=$(curl -s -w "\n%{http_code}" $BASE_URL/)
HTTP_CODE=$(echo "$ROOT" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ API root accessible${NC}"
else
    echo -e "${RED}✗ API root failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 3: OpenAPI Documentation
echo -e "${YELLOW}3. Testing OpenAPI Documentation...${NC}"
DOC=$(curl -s -w "\n%{http_code}" $BASE_URL/doc)
HTTP_CODE=$(echo "$DOC" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ OpenAPI docs available${NC}"
else
    echo -e "${RED}✗ OpenAPI docs failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 4: Swagger UI
echo -e "${YELLOW}4. Testing Swagger UI...${NC}"
UI=$(curl -s -w "\n%{http_code}" $BASE_URL/ui)
HTTP_CODE=$(echo "$UI" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Swagger UI accessible${NC}"
else
    echo -e "${RED}✗ Swagger UI failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 5: User Signup
echo -e "${YELLOW}5. Testing User Signup...${NC}"
SIGNUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "preferences": {
      "email_enabled": true,
      "push_enabled": true,
      "language": "en",
      "email_frequency": 1440,
      "push_frequency": 1440
    }
  }')
HTTP_CODE=$(echo "$SIGNUP_RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "409" ]; then
    echo -e "${GREEN}✓ Signup endpoint working (HTTP $HTTP_CODE)${NC}"
    if [ "$HTTP_CODE" = "409" ]; then
        echo -e "${YELLOW}  (User already exists - this is expected on subsequent runs)${NC}"
    fi
else
    echo -e "${RED}✗ Signup failed (HTTP $HTTP_CODE)${NC}"
    echo "$SIGNUP_RESPONSE" | head -n -1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "🌐 Service URLs:"
echo "   API:         $BASE_URL"
echo "   Swagger UI:  $BASE_URL/ui"
echo "   Health:      $BASE_URL/health"
echo ""
echo "🐰 RabbitMQ Management:"
echo "   URL:         http://localhost:15672"
echo "   Username:    admin"
echo "   Password:    admin"
