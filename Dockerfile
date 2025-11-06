# Use a slim Node.js base image for smaller size
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml to install dependencies
COPY package.json pnpm-lock.yaml ./

# Install application dependencies
RUN pnpm install --prod

# Copy built application
COPY dist ./dist

# The default port the application listens on
ENV PORT 3000
EXPOSE 3000

# Command to run the application using the compiled JavaScript
CMD [ "node", "dist/src/app.js" ]

