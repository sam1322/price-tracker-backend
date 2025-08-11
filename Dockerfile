# # Use a specific version for reproducibility
# FROM node:22-alpine AS base

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

# ---- Base Stage ----
# Use a specific, lightweight base image.
# FROM node:22-alpine AS base
# WORKDIR /app
# # Install pnpm globally once in the base so it's available in other stages.
# RUN npm install -g pnpm

# # ---- Builder Stage ----
# # This stage builds the application and has all dev dependencies.
# FROM base AS builder

# # Copy only package files first to leverage Docker layer caching.
# COPY package*.json ./
# COPY pnpm-lock.yaml ./

# # Install ALL dependencies (including devDependencies) needed for building.
# RUN pnpm install --frozen-lockfile

# # Copy the rest of the source code.
# COPY . .

# # Generate Prisma client and build the application.
# RUN pnpm run prisma:generate
# RUN pnpm run build


# # ---- Production Stage ----
# # This is the final, small image that will be shipped.
# FROM base AS production

# # Copy package files again.
# COPY package*.json ./
# COPY pnpm-lock.yaml ./

# # Install ONLY production dependencies. This is the biggest size saver.
# RUN pnpm install --prod --frozen-lockfile

# # Copy the essential built files from the 'builder' stage.
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/prisma ./prisma
# COPY --from=builder /app/node_modules ./node_modules

# # CRITICAL: Copy the generated Prisma client so your app can find it.
# COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# # Expose the application port.
# EXPOSE 3001

# # The command to run the lightweight application.
# CMD ["node", "dist/main"]


# ######### First Stage #############
# FROM node:22-alpine3.21 AS base

# ENV PNPM_HOME="/pnpm"
# ENV PATH="$PNPM_HOME:$PATH"

# RUN corepack enable&& corepack install -g pnpm@latest-10

# FROM base AS build

# WORKDIR /app

# COPY . .

# RUN pnpm install --frozen-lockfile
# RUN pnpm run build

# ######### Second Stage #############
# FROM base AS prod
# WORKDIR /app
# COPY . .
# RUN pnpm install --frozen-lockfile --prod
# RUN pnpm add -D prisma
# RUN pnpx prisma generate

# ######### Third Stage #############
# FROM base AS final

# ENV PNPM_HOME="/pnpm"
# ENV PATH="$PNPM_HOME:$PATH"

# RUN corepack enable&& corepack install -g pnpm@latest-10

# WORKDIR /var/www/app

# # Create the necessary directories & files
# COPY --from=prod /app/node_modules ./node_modules
# COPY --from=prod /app/prisma ./prisma
# COPY --from=build /app/package.json ./
# COPY --from=build /app/dist ./dist

# CMD ["pnpm", "run", "start:migrate:prod"]


# ---- Base Stage ---- THIS WORKSSSSSSSSSSSSSSSSSSSSSSSS
# Use a specific, lightweight base image.
# FROM node:22-alpine AS base
# WORKDIR /app
# # Install pnpm globally once in the base so it's available in other stages.
# RUN npm install -g pnpm


# # ---- Builder Stage ----
# # Installs all dependencies, builds the app, then prunes dev dependencies.
# FROM base AS builder

# # This environment variable is a good safety measure to prevent automatic runs.
# ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

# # Copy only package files first to leverage Docker layer caching.
# COPY package*.json ./
# COPY pnpm-lock.yaml ./

# # Install ALL dependencies (including devDependencies) needed for building.
# RUN pnpm install --frozen-lockfile

# # Copy the rest of the source code.
# COPY . .

# # Run your build script, which includes prisma generate.
# RUN pnpm run build

# # THE KEY STEP: After building, remove all dev dependencies from node_modules.
# # This leaves a lean, production-only node_modules folder.
# RUN pnpm prune --prod


# # ---- Production Stage ----
# # This is the final, lean image. It copies only what's needed.
# FROM base AS production

# # Set the working directory again.
# WORKDIR /app

# # Copy the pruned node_modules, the built code, and the prisma schema.
# # This is much simpler and more reliable.
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/prisma ./prisma

# # Expose the application port.
# EXPOSE 3001

# # The command to run the lightweight application.
# CMD ["node", "dist/main"]


# Stage 1: Build the application
FROM node:lts-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run the application
FROM node:lts-alpine 

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/dist ./dist

# Install only production dependencies
RUN npm install --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/*
# Install only production dependencies
# RUN npm install --only=production

# Copy built files from builder

# Expose the port your app runs on
EXPOSE 3001

# Command to run the application
# CMD ["npm", "run", "start:prod"]
CMD ["node","dist/main"]