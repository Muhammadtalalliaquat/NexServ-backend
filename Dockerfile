# Node base image
FROM node:18-alpine

# App directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the app
COPY . .

# Expose backend port
EXPOSE 4000

# Start server
CMD ["npm", "start"]
