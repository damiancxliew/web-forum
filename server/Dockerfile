# Use the official Golang image from the DockerHub
FROM golang:1.19-alpine AS build

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy the go.mod and go.sum files to the container
COPY go.mod go.sum ./

# Download all the dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod tidy

# Copy the entire project to the working directory inside the container
COPY . .

# Build the Go app
RUN go build -o main .

# Start a new stage from the smaller alpine image to run the Go application
FROM alpine:latest  

# Install necessary dependencies for your Go application to run
RUN apk --no-cache add ca-certificates

# Set the Current Working Directory inside the container
WORKDIR /root/

# Copy the pre-built binary from the build stage
COPY --from=build /app/main .

# Expose port 8080 to the outside world
EXPOSE 8080

# Command to run the executable
CMD ["./main"]
