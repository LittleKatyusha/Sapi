FROM node:lts

# Set working directory
WORKDIR /app

# Add /app/node_modules/.bin to PATH
ENV PATH /app/node_modules/.bin:$PATH

# Copy package files first (for better caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . ./

# Expose port 3000
EXPOSE 3000

# Start development server
CMD ["npm", "start"]
