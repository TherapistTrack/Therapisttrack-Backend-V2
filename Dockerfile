FROM golang:1.23

# Set working directory inside the container
WORKDIR /backend

# Downloading dependencies
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copying source code
COPY . .

# Build executables
RUN go build -v -o target/main main.go

# Set environment variables
ENV DB_HOST=${DB_HOST}
ENV DB_NAME=${DB_NAME}
ENV DB_USER=${DB_USER}
ENV DB_USER_PASSWORD=${DB_USER_PASSWORD}
ENV DB_PORT=${DB_PORT}
ENV JWT_SECRET=${JWT_SECRET}
ENV API_PORT=${API_PORT}
ENV LOGGING_METHOD=${LOGGING_METHOD}

# Expose the port the app runs on
EXPOSE 3001

CMD [ "/backend/target/main"]