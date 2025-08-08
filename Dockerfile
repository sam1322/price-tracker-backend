# # FROM node:22-alpine

# # # Install Playwright dependencies
# # RUN apk add --no-cache \
# #     chromium \
# #     nss \
# #     freetype \
# #     freetype-dev \
# #     harfbuzz \
# #     ca-certificates \
# #     ttf-freefont

# # # Tell Playwright to use installed Chromium
# # ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true
# # ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# # WORKDIR /app

# # COPY package*.json ./
# # COPY prisma ./prisma/

# # RUN npm install

# # COPY . .

# # RUN npx prisma generate
# # RUN npm run build

# # EXPOSE 3001

# # CMD ["npm", "run", "start:prod"]



# ---- Base Stage ----
# Use a specific version for reproducibility
FROM node:22-alpine AS base

# Install OS dependencies for Playwright
# RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

# Set env vars to use the system browser instead of downloading a new one
# ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true
# ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# ---- Builder Stage ----
# This stage will build the application
FROM base AS builder

# Install all dependencies, including devDependencies
COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install

# Copy source code and prisma schema
COPY . .

# Generate Prisma Client and build the NestJS app
# Mount the secret and run prisma generate
# --- START: Add this for debugging ---
# RUN --mount=type=secret,id=database_url \
#     echo "--- Checking secret value ---" && \
#     cat /run/secrets/database_url && \
#     echo "--- End of secret value ---"
# # --- END: Add this for debugging ---
# # Your original command
# RUN --mount=type=secret,id=database_url \
#     DATABASE_URL=$(cat /run/secrets/database_url) npx prisma generate

COPY prisma ./prisma/

RUN pnpm run prisma:generate
RUN pnpm run build

# ---- Pruner Stage ----
# This stage will remove devDependencies
# FROM base AS pruner

# Only install production dependencies
# COPY --from=builder /app/package*.json ./
# RUN npm ci --omit=dev

# Only copy production dependencies
# COPY --from=builder /app/package*.json ./
# RUN npm install -g pnpm && \
#     pnpm install --prod


# # ---- Final Stage ----
# # This is the final, lean production image
# FROM base AS final

# # Create and use a non-root user for security
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# USER appuser

# # Copy production dependencies from the 'pruner' stage
# COPY --from=pruner /app/node_modules ./node_modules

# # Copy the built application and prisma schema from the 'builder' stage
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/prisma ./prisma

# Expose the application port
EXPOSE 3001

# The command to run the application
CMD ["node", "dist/main"]


# FROM node:22-alpine AS base

# # Install OS dependencies for Playwright
# RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

# # Set env vars to use the system browser instead of downloading a new one
# ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true
# ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# WORKDIR /app

# # ---- Builder Stage ----
# # This stage will build the application
# FROM base AS builder

# # Install all dependencies, including devDependencies
# COPY package*.json ./
# RUN npm install

# # Copy source code INCLUDING prisma schema FIRST
# COPY . .

# # Generate Prisma Client AFTER copying the schema
# RUN --mount=type=secret,id=database_url \
#     DATABASE_URL=$(cat /run/secrets/database_url) npx prisma generate

# # Build the NestJS app
# RUN npm run build

# # ---- Pruner Stage ----
# # This stage will remove devDependencies
# FROM base AS pruner

# COPY --from=builder /app/package*.json ./
# # Only install production dependencies
# RUN npm ci --omit=dev

# # ---- Final Stage ----
# # This is the final, lean production image
# FROM base AS final

# # Create and use a non-root user for security
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# USER appuser

# # Copy production dependencies from the 'pruner' stage
# COPY --from=pruner /app/node_modules ./node_modules

# # Copy the built application and prisma schema from the 'builder' stage
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/prisma ./prisma
# # IMPORTANT: Also copy the generated Prisma Client
# COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# # Expose the application port
# EXPOSE 3001

# # The command to run the application
# CMD ["node", "dist/main.js"]

# # FROM node:22-alpine

# # # Install Playwright dependencies
# # RUN apk add --no-cache \
# #     chromium \
# #     nss \
# #     freetype \
# #     freetype-dev \
# #     harfbuzz \
# #     ca-certificates \
# #     ttf-freefont

# # # Tell Playwright to use installed Chromium
# # ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true
# # ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# # WORKDIR /app

# # COPY package*.json ./
# # COPY prisma ./prisma/

# # RUN npm install

# # COPY . .

# # RUN npx prisma generate
# # RUN npm run build

# # EXPOSE 3001

# # CMD ["npm", "run", "start:prod"]



# # ---- Base Stage ----
# # Use a specific version for reproducibility
# FROM node:22-alpine AS base

# # Install OS dependencies for Playwright
# RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

# # Set env vars to use the system browser instead of downloading a new one
# ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true
# ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# WORKDIR /app

# # ---- Builder Stage ----
# # This stage will build the application
# FROM base AS builder

# # Install all dependencies, including devDependencies
# COPY package*.json ./
# RUN npm install -g pnpm
# RUN pnpm install

# # Copy source code and prisma schema
# COPY . .

# COPY prisma ./prisma/

# RUN pnpm run prisma:generate
# RUN pnpm run build


# # Expose the application port
# EXPOSE 3001

# # The command to run the application
# CMD ["node", "dist/main"]

