# WhatsApp AI Platform - Deployment Runbook

**Document Version**: 1.0  
**Last Updated**: March 29, 2026  
**Environment**: Production

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Procedures](#deployment-procedures)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Rollback Procedures](#rollback-procedures)
6. [Emergency Contacts](#emergency-contacts)

---

## Prerequisites

### System Requirements
- kubectl v1.28+
- helm v3.12+
- Docker v24+
- pnpm v9+
- Access to container registry
- Access to cloud provider CLI

### Access Requirements
- [ ] Kubernetes cluster access
- [ ] Container registry push/pull access
- [ ] Cloud provider credentials
- [ ] Secrets management access
- [ ] Monitoring dashboard access

### Environment Setup
```bash
# Install kubectl
brew install kubectl

# Install helm
brew install helm

# Configure kubectl
kubectl config use-context production

# Verify cluster access
kubectl cluster-info
```

---

## Pre-Deployment Checklist

### 48 Hours Before Deployment

- [ ] **Code Freeze**
  - All features merged to main
  - No pending critical PRs
  
- [ ] **Testing Complete**
  - [ ] Unit tests passing (>80% coverage)
  - [ ] Integration tests passing
  - [ ] E2E tests passing
  - [ ] Load tests completed
  
- [ ] **Security Review**
  - [ ] Dependency audit complete
  - [ ] No critical vulnerabilities
  - [ ] Security scan passed
  
- [ ] **Documentation Updated**
  - [ ] CHANGELOG updated
  - [ ] API documentation current
  - [ ] Runbook reviewed

### 24 Hours Before Deployment

- [ ] **Notify Stakeholders**
  - [ ] Engineering team
  - [ ] Customer support
  - [ ] DevOps on-call
  
- [ ] **Backup Verification**
  - [ ] Database backups tested
  - [ ] Configuration backups current
  - [ ] Rollback plan tested
  
- [ ] **Monitoring Prepared**
  - [ ] Dashboards configured
  - [ ] Alerts set
  - [ ] Runbooks accessible

### 1 Hour Before Deployment

- [ ] **Final Checks**
  - [ ] Slack notifications configured
  - [ ] Rollback commands ready
  - [ ] Communication plan in place

---

## Deployment Procedures

### 1. Build Images

```bash
# Set variables
export REGISTRY=ghcr.io/whatsapp-ai
export VERSION=$(git describe --tags --always)

# Build all services
make build-prod

# Tag images
docker tag whatsappai-api-gateway:latest $REGISTRY/api-gateway:$VERSION
docker tag whatsappai-agent-service:latest $REGISTRY/agent-service:$VERSION
docker tag whatsappai-rag-service:latest $REGISTRY/rag-service:$VERSION
docker tag whatsappai-messaging-service:latest $REGISTRY/messaging-service:$VERSION
docker tag whatsappai-workflow-orchestrator:latest $REGISTRY/workflow-orchestrator:$VERSION
docker tag whatsappai-dashboard:latest $REGISTRY/dashboard:$VERSION

# Push to registry
docker push $REGISTRY/api-gateway:$VERSION
docker push $REGISTRY/agent-service:$VERSION
docker push $REGISTRY/rag-service:$VERSION
docker push $REGISTRY/messaging-service:$VERSION
docker push $REGISTRY/workflow-orchestrator:$VERSION
docker push $REGISTRY/dashboard:$VERSION
```

### 2. Update Kubernetes Manifests

```bash
# Update image tags in kustomization.yaml
cd infrastructure/k8s/overlays/production
sed -i "s|whatsappai/api-gateway:.*|$REGISTRY/api-gateway:$VERSION|g" kustomization.yaml
sed -i "s|whatsappai/agent-service:.*|$REGISTRY/agent-service:$VERSION|g" kustomization.yaml
# ... repeat for other services
```

### 3. Apply Kubernetes Changes

```bash
# Set namespace
kubectl config set-context --current --namespace=whatsapp-ai

# Apply changes with kubectl
kubectl apply -k infrastructure/k8s/overlays/production

# Verify deployment
kubectl rollout status deployment/api-gateway --timeout=300s
kubectl rollout status deployment/agent-service --timeout=300s
kubectl rollout status deployment/rag-service --timeout=300s
kubectl rollout status deployment/messaging-service --timeout=300s
kubectl rollout status deployment/workflow-orchestrator --timeout=300s
kubectl rollout status deployment/dashboard --timeout=300s
```

### 4. Verify Services

```bash
# Check pod status
kubectl get pods -l app=api-gateway
kubectl get pods -l app=agent-service
kubectl get pods -l app=rag-service

# Check logs
kubectl logs -l app=api-gateway --tail=100

# Check health endpoints
curl https://api.whatsapp-ai.example.com/health
curl https://api.whatsapp-ai.example.com/health/ready
```

### 5. CDN Cache Invalidation

```bash
# Invalidate CDN cache
export CDN_INVALIDATE_ON_DEPLOY=true
# This happens automatically if configured
```

---

## Post-Deployment Verification

### Immediate Checks (0-15 minutes)

```bash
# 1. Verify pods are running
kubectl get pods

# 2. Check for crash loops
kubectl get events --sort-by='.lastTimestamp' | grep -i error

# 3. Verify health endpoints
for endpoint in api-gateway agent-service rag-service messaging-service workflow-orchestrator dashboard; do
  echo "Checking $endpoint..."
  curl -s https://$endpoint.whatsapp-ai.example.com/health || echo "FAILED"
done

# 4. Check error rates
# View Grafana dashboard: https://grafana.whatsapp-ai.example.com
```

### Functional Verification (15-60 minutes)

- [ ] **Smoke Tests**
  ```bash
  # Run smoke tests
  make test-smoke
  
  # Test message processing
  curl -X POST https://api.whatsapp-ai.example.com/api/test/message
  
  # Test AI response
  curl -X POST https://api.whatsapp-ai.example.com/api/test/ai
  ```

- [ ] **User Flow Tests**
  - [ ] Login works
  - [ ] Message sending works
  - [ ] AI responses received
  - [ ] Reminders created
  - [ ] Calendar sync works

### Monitoring (60+ minutes)

- [ ] **Metrics Normal**
  - CPU usage < 70%
  - Memory usage < 80%
  - Response time < 500ms p95
  - Error rate < 1%
  
- [ ] **No Alert Fatigue**
  - Check PagerDuty for alerts
  - Verify no new critical alerts

---

## Rollback Procedures

### Quick Rollback (Recommended)

```bash
# Get previous version
export PREVIOUS_VERSION=$(git describe --tags --abbrev=0^1)

# Update to previous version
sed -i "s|$REGISTRY/api-gateway:.*|$REGISTRY/api-gateway:$PREVIOUS_VERSION|g" kustomization.yaml
# ... repeat for other services

# Apply rollback
kubectl apply -k infrastructure/k8s/overlays/production

# Verify
kubectl rollout status deployment/api-gateway --timeout=300s
```

### Emergency Rollback

```bash
# Immediate rollback to previous revision
kubectl rollout undo deployment/api-gateway
kubectl rollout undo deployment/agent-service
kubectl rollout undo deployment/rag-service
kubectl rollout undo deployment/messaging-service
kubectl rollout undo deployment/workflow-orchestrator
kubectl rollout undo deployment/dashboard

# Verify
kubectl get pods
```

### Database Rollback

```bash
# Only if database changes were made
# This is a last resort

# Restore from backup
kubectl exec -it postgres-0 -- pg_restore -U postgres -d whatsapp_ai /backups/pre-deploy-backup.sql

# Verify data
kubectl exec -it postgres-0 -- psql -U postgres -d whatsapp_ai -c "SELECT COUNT(*) FROM users;"
```

---

## Monitoring & Alerts

### Key Dashboards

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| Grafana | https://grafana.whatsapp-ai.example.com | Metrics & Logs |
| Kibana | https://kibana.whatsapp-ai.example.com | Log Analysis |
| Sentry | https://sentry.whatsapp-ai.example.com | Error Tracking |
| Prometheus | https://prometheus.whatsapp-ai.example.com | Metrics |

### Critical Alerts

| Alert | Threshold | Action |
|-------|-----------|--------|
| High Error Rate | > 5% | Investigate immediately |
| Service Down | Any | Page on-call |
| High Latency | > 1s p99 | Investigate |
| Memory Usage | > 90% | Scale or investigate |

---

## Emergency Contacts

### On-Call Schedule
- **Primary**: PagerDuty rotation
- **Secondary**: Engineering lead

### Escalation Path
1. On-call engineer
2. Engineering manager
3. VP of Engineering
4. CTO

### External Contacts
- **AWS Support**: Support Console
- **Kubernetes**: Slack #production
- **PagerDuty**: 1-800-PD-ALERT

---

## Post-Incident

### If Issues Occurred

1. **Document Timeline**
   ```bash
   kubectl get events --sort-by='.lastTimestamp' > incident-timeline.txt
   ```

2. **Collect Logs**
   ```bash
   kubectl logs -l app=api-gateway --since=1h > api-gateway-logs.txt
   ```

3. **Create Incident Report**
   - What happened?
   - Impact?
   - Root cause?
   - Resolution?
   - Prevention?

4. **Review & Improve**
   - Update monitoring
   - Add alerts if missing
   - Update runbook

---

## Appendix

### Useful Commands

```bash
# Get all resources
kubectl get all -n whatsapp-ai

# Describe pod
kubectl describe pod <pod-name>

# Tail logs
kubectl logs -f <pod-name>

# Execute into pod
kubectl exec -it <pod-name> -- /bin/sh

# Port forward
kubectl port-forward svc/api-gateway 3000:3000

# Check resource usage
kubectl top pods
kubectl top nodes

# View events
kubectl get events --sort-by='.lastTimestamp'

# Check secret exists
kubectl get secret api-keys -o yaml
```

### Version Information

```bash
# Current versions
export API_VERSION=$(kubectl get deployment api-gateway -o jsonpath='{.spec.template.spec.containers[0].image}')
export AGENT_VERSION=$(kubectl get deployment agent-service -o jsonpath='{.spec.template.spec.containers[0].image}')
```

---

*Document Maintainer: DevOps Team*  
*Review Schedule: Quarterly*
