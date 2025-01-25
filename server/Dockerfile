# Use the official Golang image from DockerHub
FROM golang:1.19-alpine AS build

# Set the current working directory inside the container
WORKDIR /app

# Copy the go.mod and go.sum files to the container
COPY go.mod go.sum ./

# Download all the dependencies
RUN go mod tidy

# Copy the entire project to the working directory
COPY . .

# Build the Go app
RUN go build -o main .

# Start a new stage from the smaller Alpine image
FROM alpine:latest  

# Install necessary dependencies for your Go application to run
RUN apk --no-cache add ca-certificates

# Set the current working directory inside the container
WORKDIR /root/

# Copy the pre-built binary from the build stage
COPY --from=build /app/main .

# Copy the .env file to the container
COPY .env .

# Expose port 8080 to the outside world
EXPOSE 8080

# Command to run the executable
CMD ["./main"]
