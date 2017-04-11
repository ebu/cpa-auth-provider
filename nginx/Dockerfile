# Set nginx base image
FROM nginx

# File Author / Maintainer
MAINTAINER Anand Mani Sankar

# Copy custom configuration file from the current directory
COPY conf/nginx.conf /etc/nginx/nginx.conf

# Add www certificates
COPY ssl/* /etc/ssl/certs/