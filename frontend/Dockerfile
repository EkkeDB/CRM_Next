# Development Dockerfile for Next.js
FROM node:22-alpine

# Install dependencies for alpine
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_APP_NAME=NextCRM
ENV NEXT_PUBLIC_APP_VERSION=1.0.0
ENV NEXT_PUBLIC_ENV=development

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]