#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "WhatsApp AI Platform - Health Check"
echo "========================================="

API_GATEWAY_URL="${API_GATEWAY_URL:-http://localhost:3000}"
TIMEOUT=5

check_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "Checking $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_code" ]; then
        echo "✓ OK (HTTP $response)"
        return 0
    else
        echo "✗ FAILED (HTTP $response, expected $expected_code)"
        return 1
    fi
}

echo ""
echo "Service Health Checks"
echo "-----------------------------------"

FAILED=0

check_endpoint "API Gateway Health" "$API_GATEWAY_URL/health" || ((FAILED++))
check_endpoint "API Gateway Ready" "$API_GATEWAY_URL/ready" || ((FAILED++))
check_endpoint "Dashboard" "http://localhost:3001" || ((FAILED++))

echo ""
echo "External Dependencies"
echo "-----------------------------------"

check_endpoint "PostgreSQL" "$API_GATEWAY_URL/health/db" || ((FAILED++))
check_endpoint "Redis" "$API_GATEWAY_URL/health/redis" || ((FAILED++))
check_endpoint "MongoDB" "$API_GATEWAY_URL/health/mongodb" || ((FAILED++))

echo ""
echo "AI Services"
echo "-----------------------------------"

check_endpoint "Agent Service" "$API_GATEWAY_URL/health/agent" || ((FAILED++))
check_endpoint "RAG Service" "$API_GATEWAY_URL/health/rag" || ((FAILED++))
check_endpoint "WhatsApp API" "$API_GATEWAY_URL/health/whatsapp" || ((FAILED++))

echo ""
echo "========================================="
if [ $FAILED -eq 0 ]; then
    echo "All health checks passed!"
    echo "========================================="
    exit 0
else
    echo "$FAILED health check(s) failed"
    echo "========================================="
    exit 1
fi
