#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "WhatsApp AI Platform - Database Migration"
echo "========================================="

usage() {
    echo "Usage: $0 [command]"
    echo "  Commands:"
    echo "    status     - Check migration status"
    echo "    up         - Run pending migrations"
    echo "    down       - Rollback last migration"
    echo "    deploy     - Deploy migrations (production)"
    echo "    create     - Create a new migration"
    echo ""
    echo "  Examples:"
    echo "    $0 status"
    echo "    $0 up"
    echo "    $0 create add_user_preferences"
    exit 1
}

COMMAND="${1:-}"

if [ -z "$COMMAND" ]; then
    usage
fi

cd "$PROJECT_ROOT"

echo ""
echo "Environment:"
echo "  DATABASE_URL: ${DATABASE_URL:-not set}"
echo "  NODE_ENV: ${NODE_ENV:-development}"
echo ""

case "$COMMAND" in
    status)
        echo "Checking migration status..."
        pnpm prisma migrate status
        ;;
    up)
        echo "Running migrations..."
        pnpm prisma migrate dev
        ;;
    down)
        echo "Rolling back last migration..."
        pnpm prisma migrate rollback
        ;;
    deploy)
        echo "Deploying migrations (production mode)..."
        pnpm prisma migrate deploy
        ;;
    create)
        MIGRATION_NAME="${2:-}"
        if [ -z "$MIGRATION_NAME" ]; then
            echo "Error: Migration name required"
            echo "  Usage: $0 create <migration_name>"
            exit 1
        fi
        echo "Creating migration: $MIGRATION_NAME"
        pnpm prisma migrate dev --name "$MIGRATION_NAME"
        ;;
    *)
        echo "Error: Unknown command '$COMMAND'"
        usage
        ;;
esac

echo ""
echo "Migration complete!"
