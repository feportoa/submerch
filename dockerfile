FROM node:20.16.0-slim

# Uncomment this code if you're using a specific host number/name for your psql instance.
# RUN [ "echo", "\"172.20.0.1 windows\"", ">>", "/etc/hosts" ]

WORKDIR /app/

COPY . /app/

RUN npm install -y 

RUN npm install -g nodemon -y

EXPOSE 8080

# Nodemon is running on legacy mode for compatibility
CMD [ "nodemon", "-L", "app.js" ]

# Run docker with volumes: docker run -v "your/project/path":/app -p <host_desired_port>:<docker_exposed_port> <image_name>:<image_tag>
# You can change "your/project/path" with "$(pwd)" if you're in the project folder