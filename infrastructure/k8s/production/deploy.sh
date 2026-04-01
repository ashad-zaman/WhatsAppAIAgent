#!/bin/bash
# Production Kubernetes Deployment Script

set -e

NAMESPACE="whatsapp-ai"
DATA_NAMESPACE="whatsapp-ai-data"
MONITORING_NAMESPACE="monitoring"

echo "=========================================="
echo "WhatsApp AI Platform - Production Deploy"
echo "=========================================="

# Check prerequisites
check_prerequisites() {
    echo "[1/10] Checking prerequisites..."
    
    command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required but not installed."; exit 1; }
    command -v helm >/dev/null 2>&1 || { echo "helm is required but not installed."; exit 1; }
    command -v aws >/dev/null 2>&1 || { echo "AWS CLI is required but not installed."; exit 1; }
    
    echo "  ✓ kubectl, helm, and AWS CLI found"
}

# Create namespaces
create_namespaces() {
    echo "[2/10] Creating namespaces..."
    
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace "$DATA_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace "$MONITORING_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl label namespace "$NAMESPACE" environment=production --overwrite
    kubectl label namespace "$DATA_NAMESPACE" environment=production --overwrite
    
    echo "  ✓ Namespaces created"
}

# Apply core infrastructure
apply_core() {
    echo "[3/10] Applying core infrastructure..."
    
    kubectl apply -f ../production/core.yaml
    
    echo "  ✓ Core infrastructure applied"
}

# Apply resources and autoscaling
apply_resources() {
    echo "[4/10] Applying resources and autoscaling..."
    
    kubectl apply -f ../resources.yaml
    kubectl apply -f ../autoscaling.yaml
    
    echo "  ✓ Resources and autoscaling applied"
}

# Apply backup configuration
apply_backup() {
    echo "[5/10] Applying backup configuration..."
    
    kubectl apply -f ../production/backup.yaml
    
    echo "  ✓ Backup configuration applied"
}

# Apply service mesh (optional)
apply_service_mesh() {
    if [ "${ENABLE_ISTIO:-false}" = "true" ]; then
        echo "[6/10] Applying service mesh configuration..."
        
        kubectl apply -f ../production/service-mesh.yaml
        
        echo "  ✓ Service mesh applied"
    else
        echo "[6/10] Skipping service mesh (not enabled)"
    fi
}

# Deploy API Gateway
deploy_api_gateway() {
    echo "[7/10] Deploying API Gateway..."
    
    kubectl set image deployment/api-gateway \
        api-gateway=whatsapp-ai/api-gateway:${VERSION:-latest} \
        -n "$NAMESPACE"
    
    kubectl rollout status deployment/api-gateway -n "$NAMESPACE" --timeout=300s
    
    echo "  ✓ API Gateway deployed"
}

# Deploy Agent Service
deploy_agent_service() {
    echo "[8/10] Deploying Agent Service..."
    
    kubectl set image deployment/agent-service \
        agent-service=whatsapp-ai/agent-service:${VERSION:-latest} \
        -n "$NAMESPACE"
    
    kubectl rollout status deployment/agent-service -n "$NAMESPACE" --timeout=300s
    
    echo "  ✓ Agent Service deployed"
}

# Deploy RAG Service
deploy_rag_service() {
    echo "[9/10] Deploying RAG Service..."
    
    kubectl set image deployment/rag-service \
        rag-service=whatsapp-ai/rag-service:${VERSION:-latest} \
        -n "$NAMESPACE"
    
    kubectl rollout status deployment/rag-service -n "$NAMESPACE" --timeout=300s
    
    echo "  ✓ RAG Service deployed"
}

# Deploy Messaging Service
deploy_messaging_service() {
    echo "[10/10] Deploying Messaging Service..."
    
    kubectl set image deployment/messaging-service \
        messaging-service=whatsapp-ai/messaging-service:${VERSION:-latest} \
        -n "$NAMESPACE"
    
    kubectl rollout status deployment/messaging-service -n "$NAMESPACE" --timeout=300s
    
    echo "  ✓ Messaging Service deployed"
}

# Verify deployment
verify_deployment() {
    echo ""
    echo "=========================================="
    echo "Deployment Verification"
    echo "=========================================="
    
    echo ""
    echo "Pods:"
    kubectl get pods -n "$NAMESPACE"
    
    echo ""
    echo "Services:"
    kubectl get svc -n "$NAMESPACE"
    
    echo ""
    echo "HPA Status:"
    kubectl get hpa -n "$NAMESPACE"
    
    echo ""
    echo "Ingress:"
    kubectl get ingress -n "$NAMESPACE"
}

# Health check
health_check() {
    echo ""
    echo "Running health checks..."
    
    # Wait for services to be ready
    sleep 10
    
    API_GW_URL=$(kubectl get svc api-gateway -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    
    if [ -n "$API_GW_URL" ]; then
        echo "Testing API Gateway health..."
        curl -f "https://${API_GW_URL}/health" || echo "  ⚠ Health check failed"
    fi
    
    echo "  ✓ Health checks completed"
}

# Main deployment
main() {
    check_prerequisites
    create_namespaces
    apply_core
    apply_resources
    apply_backup
    
    if [ "${SKIP_SERVICES:-false}" != "true" ]; then
        apply_service_mesh
        deploy_api_gateway
        deploy_agent_service
        deploy_rag_service
        deploy_messaging_service
    fi
    
    verify_deployment
    health_check
    
    echo ""
    echo "=========================================="
    echo "Deployment completed successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "  1. Update DNS records for the LoadBalancer endpoints"
    echo "  2. Configure certificate manager for TLS"
    echo "  3. Set up external secrets (Vault, AWS Secrets Manager)"
    echo "  4. Configure monitoring dashboards"
    echo ""
}

# Rollback function
rollback() {
    echo "Rolling back deployment..."
    kubectl rollout undo deployment -n "$NAMESPACE"
}

# Show usage
usage() {
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  deploy     Deploy all components (default)"
    echo "  rollback   Rollback to previous version"
    echo "  verify     Verify deployment status"
    echo "  clean      Delete all resources"
    echo ""
    echo "Options:"
    echo "  --version VERSION    Set container image version"
    echo "  --skip-services      Skip deploying services"
    echo "  --enable-istio       Enable Istio service mesh"
    echo "  --help               Show this help"
}

case "${1:-deploy}" in
    deploy)
        VERSION="${VERSION:-latest}"
        while [[ $# -gt 0 ]]; do
            case $1 in
                --version)
                    VERSION="$2"
                    shift 2
                    ;;
                --skip-services)
                    SKIP_SERVICES=true
                    shift
                    ;;
                --enable-istio)
                    ENABLE_ISTIO=true
                    shift
                    ;;
                --help)
                    usage
                    exit 0
                    ;;
                *)
                    shift
                    ;;
            esac
        done
        main
        ;;
    rollback)
        rollback
        ;;
    verify)
        verify_deployment
        ;;
    clean)
        echo "Deleting all resources..."
        kubectl delete namespace "$NAMESPACE" "$DATA_NAMESPACE" "$MONITORING_NAMESPACE"
        ;;
    *)
        usage
        exit 1
        ;;
esac
