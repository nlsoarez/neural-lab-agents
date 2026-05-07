# Neural Lab — Paperclip on Railway
# Based on official Paperclip Dockerfile

FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@9

# Install Paperclip globally
RUN npm install -g paperclipai

# Install Claude Code CLI (agent adapter)
RUN npm install -g @anthropic-ai/claude-code

# Install OpenAI SDK (DALL-E 3 image generation)
RUN npm install -g openai

# Set working directory
WORKDIR /app

# Copy Neural Lab agent company configuration
COPY . /app/neural-lab-agents/

# Set Paperclip home
ENV PAPERCLIP_HOME=/paperclip
ENV PAPERCLIP_INSTANCE_ID=neural-lab
ENV PAPERCLIP_DEPLOYMENT_MODE=authenticated
ENV PAPERCLIP_DEPLOYMENT_EXPOSURE=public

# Create data directory
RUN mkdir -p /paperclip

# Expose port
EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3100/api/health || exit 1

# Start Paperclip
CMD ["npx", "paperclipai", "run", "--port", "3100", "--host", "0.0.0.0"]
