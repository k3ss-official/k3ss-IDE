FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY ./electron/package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY ./electron .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
