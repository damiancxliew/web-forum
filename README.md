# Golang Server and React Client Setup for Innersphere Forum

Innersphere Forum is a full-stack web-forum application, consisting of a Golang backend server and a React frontend client. The application provides users with a seamless platform to interact and share ideas through threads and comments.

## Features

- **Thread Management:** Users can add and delete threads, categorized for better organization.
- **Comment System:** Users can add and delete comments under each thread to foster discussions.
- **User Profiles:** Users can edit their profiles and update their usernames for personalization.
- **User Authentication:** Secure user-based authentication is implemented using JSON Web Tokens (JWT), ensuring data privacy and secure access.
- **Scalability and Performance:** Built with Go and React, the application is optimized for speed and reliability.

---

## Prerequisites

Ensure the following tools are installed on your system:

- [Go](https://golang.org/dl/) (v1.20+ recommended)
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [PostgreSQL](https://www.postgresql.org/) (v14+ recommended)
- [Git](https://git-scm.com/)

---

## Backend Setup (Golang Server)

1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd project/server

2. **Install Dependencies:**
   ```bash
   go mod tidy

3. **Set Up Environment Variables: Create a .env file in the server/ directory and add the following:**
   ```bash
    DB_HOST=127.0.0.1
    DB_PORT=5432
    DB_USER=your_database_user
    DB_PASS=your_database_password
    DB_NAME=your_database_name
    DB_SSLMODE=disable
    PORT=8080
    ENV=DEV

4. **Start PostgreSQL: Ensure PostgreSQL is running, and the database (DB_NAME) is created:**
   ```bash
   createdb -U your_database_user your_database_name

5. **Start the server:**
   ```bash
   go run main.go

---

## Frontend Setup (React Client)
1. **Navigate to the Client Directory:**
   ```bash
   cd project/client

2. **Install Dependencies**
   ```bash
   npm install

3. **Set Up Environment Variables: Create a .env file in the client/ directory and add the following:**
   REACT_APP_API_URL=http://localhost:8080

4. **Start the client**
   ```bash
   npm start

---

## Accessing the Application
### Locally:
Once both the backend server and the frontend client are running:

Open your browser and navigate to http://localhost:3000.

### Deployed Version:
Visit the deployed version of the application at:
[Innersphere Forum](https://innersphereforum.netlify.app/)
