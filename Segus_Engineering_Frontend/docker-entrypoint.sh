#!/bin/sh

# Docker entrypoint script for Angular frontend
# Handles environment variable substitution in production builds

set -e

# Function to substitute environment variables in JavaScript files
substitute_env_vars() {
    echo "Substituting environment variables..."
    
    # Find all JavaScript files in the dist directory
    find /usr/share/nginx/html -name "*.js" -exec sed -i \
        -e "s|__API_URL__|${API_URL:-http://localhost:8000/api}|g" \
        -e "s|__AUTH_URL__|${AUTH_URL:-http://localhost:8000/auth}|g" \
        -e "s|__WS_URL__|${WS_URL:-ws://localhost:8000}|g" \
        -e "s|__ENVIRONMENT__|${ENVIRONMENT:-production}|g" \
        {} \;
    
    echo "Environment variables substituted successfully"
}

# Only substitute if we're running nginx (production mode)
if [ "$1" = "nginx" ]; then
    substitute_env_vars
fi

# Execute the main command
exec "$@"
