# Set nginx base image
FROM nginx

# File Author / Maintainer
MAINTAINER Anand Mani Sankar

# Copy custom configuration file from the current directory
COPY nginx.conf /etc/nginx/nginx.conf

# Add www certificates
COPY ssl/cert.pem /etc/ssl/certs/
COPY ssl/key.pem /etc/ssl/certs/
