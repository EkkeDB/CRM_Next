# Development Dockerfile for Next.js
FROM node:22-alpine

# Install dependencies for alpine
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=development
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server with host binding
CMD ["npm", "run", "dev"]
