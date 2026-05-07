# Neural Lab — Paperclip on Railway

FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Paperclip globally
RUN npm install -g paperclipai

# Install Claude Code CLI (Anthropic agent adapter)
RUN npm install -g @anthropic-ai/claude-code

# Install OpenAI Codex CLI (OpenAI agent adapter)
RUN npm install -g @openai/codex

# Install OpenAI SDK (DALL-E 3 image generation)
RUN npm install -g openai

# Set working directory
WORKDIR /app

# Copy Neural Lab agent company configuration
COPY . /app/neural-lab-agents/

# Copy and enable entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Paperclip environment
ENV PAPERCLIP_HOME=/paperclip
ENV PAPERCLIP_INSTANCE_ID=neural-lab
ENV PAPERCLIP_DEPLOYMENT_MODE=authenticated
ENV PAPERCLIP_DEPLOYMENT_EXPOSURE=public

# Create base data directory
RUN mkdir -p /paperclip

# Expose default port (Railway overrides with $PORT)
EXPOSE 3100

ENTRYPOINT ["/entrypoint.sh"]
