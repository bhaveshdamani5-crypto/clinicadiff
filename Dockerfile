FROM node:18-alpine

WORKDIR /app

# Copy the backend files first for dependency caching
COPY backend/package*.json ./backend/

# Install dependencies inside the backend folder
RUN cd backend && npm install

# Copy all the rest of the backend files
COPY backend ./backend

# Expose the server port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the express backend server
CMD ["node", "backend/server.js"]
