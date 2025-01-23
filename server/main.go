package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"strings"
	"time"

	"github.com/damiancxliew/web-forum/models"
	"github.com/damiancxliew/web-forum/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type Repository struct {
	DB *gorm.DB
}

// Threads
func (r *Repository) CreateThread(context *fiber.Ctx) error {
	thread := models.Thread{}

	err := context.BodyParser(&thread)
	if err != nil {
		context.Status(http.StatusUnprocessableEntity).JSON(
			&fiber.Map{"message": "request failed"})
		return err
	}

	if err := r.DB.Create(&thread).Error; err != nil {
		log.Println("DB Create Error:", err)
		context.Status(http.StatusBadRequest).JSON(&fiber.Map{"message": "could not create thread"})
		return err
	}

	context.Status(http.StatusOK).JSON(&fiber.Map{
		"message": "thread has been created"})
	return nil
}

func (r *Repository) DeleteThread(context *fiber.Ctx) error {
	id := context.Params("id")
	if id == "" {
		context.Status(http.StatusInternalServerError).JSON(&fiber.Map{
			"message": "id cannot be empty",
		})
		return nil
	}

	err := r.DB.Delete(&models.Thread{}, id)
	if err.Error != nil {
		context.Status(http.StatusBadRequest).JSON(&fiber.Map{
			"message": "could not delete thread",
		})
		return err.Error
	}
	context.Status(http.StatusOK).JSON(&fiber.Map{
		"message": "thread deleted successfully",
	})
	return nil
}

func (r *Repository) GetThreads(context *fiber.Ctx) error {
	threads := &[]models.Thread{}

	err := r.DB.Find(threads).Error
	if err != nil {
		context.Status(http.StatusBadRequest).JSON(
			&fiber.Map{"message": "could not get threads"})
		return err
	}

	context.Status(http.StatusOK).JSON(&fiber.Map{
		"message": "threads fetched successfully",
		"data":    threads,
	})
	return nil
}

func (r *Repository) GetThreadByID(context *fiber.Ctx) error {
	id := context.Params("id")
	thread := &models.Thread{}
	if id == "" {
		context.Status(http.StatusInternalServerError).JSON(&fiber.Map{
			"message": "id cannot be empty",
		})
		return nil
	}

	err := r.DB.Where("thread_id = ?", id).First(thread).Error
	if err != nil {
		context.Status(http.StatusBadRequest).JSON(
			&fiber.Map{"message": "could not get the thread"})
		return err
	}
	context.Status(http.StatusOK).JSON(&fiber.Map{
		"message": "thread fetched successfully",
		"data":    thread,
	})
	return nil
}

// Users
// JWT secret key
var jwtSecret = []byte("your_secret_key")

// SignUp handles user registration
func (r *Repository) SignUp(context *fiber.Ctx) error {
	user := models.User{}

	// Parse user input
	if err := context.BodyParser(&user); err != nil {
		return context.Status(http.StatusUnprocessableEntity).JSON(&fiber.Map{
			"message": "Invalid request",
		})
	}

	// Check for missing fields
	if user.Username == "" || user.Email == "" || user.Password == "" {
		return context.Status(http.StatusBadRequest).JSON(&fiber.Map{
			"message": "All fields are required",
		})
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return context.Status(http.StatusInternalServerError).JSON(&fiber.Map{
			"message": "Failed to hash password",
		})
	}
	user.Password = string(hashedPassword)

	// Save user to database
	if err := r.DB.Create(&user).Error; err != nil {
		return context.Status(http.StatusBadRequest).JSON(&fiber.Map{
			"message": "Could not create user",
		})
	}

	// Generate JWT token
	token, err := generateJWT(user)
	if err != nil {
		return context.Status(http.StatusInternalServerError).JSON(&fiber.Map{
			"message": "Failed to generate token",
		})
	}

	// Respond with the token
	return context.Status(http.StatusOK).JSON(&fiber.Map{
		"message": "User created successfully",
		"token":   token,
	})
}

// GenerateJWT creates a token for a user
func generateJWT(user models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"email":    user.Email,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // Token valid for 24 hours
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// Login handles user authentication
func (r *Repository) Login(context *fiber.Ctx) error {
	var loginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	// Parse login credentials
	if err := context.BodyParser(&loginRequest); err != nil {
		return context.Status(http.StatusUnprocessableEntity).JSON(&fiber.Map{
			"message": "Invalid request",
		})
	}

	// Check for missing fields
	if loginRequest.Email == "" || loginRequest.Password == "" {
		return context.Status(http.StatusBadRequest).JSON(&fiber.Map{
			"message": "Email and password are required",
		})
	}

	// Find user by email
	var user models.User
	if err := r.DB.Where("email = ?", loginRequest.Email).First(&user).Error; err != nil {
		return context.Status(http.StatusUnauthorized).JSON(&fiber.Map{
			"message": "Invalid email or password",
		})
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginRequest.Password)); err != nil {
		return context.Status(http.StatusUnauthorized).JSON(&fiber.Map{
			"message": "Invalid email or password",
		})
	}

	// Generate JWT token
	token, err := generateJWT(user)
	if err != nil {
		return context.Status(http.StatusInternalServerError).JSON(&fiber.Map{
			"message": "Failed to generate token",
		})
	}

	// Respond with the token
	return context.Status(http.StatusOK).JSON(&fiber.Map{
		"message": "Login successful",
		"token":   token,
	})
}

// JWTMiddleware validates the JWT token
func JWTMiddleware(c *fiber.Ctx) error {
	// Get the token from the Authorization header
	authHeader := c.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return c.Status(http.StatusUnauthorized).JSON(&fiber.Map{
			"message": "Missing or invalid token",
		})
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	// Parse and validate the token
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return c.Status(http.StatusUnauthorized).JSON(&fiber.Map{
			"message": "Invalid token",
		})
	}

	// Token is valid; proceed to the next handler
	return c.Next()
}





// Comments
func (r *Repository) CreateComment(context *fiber.Ctx) error {
	comment := models.Comment{}

	err := context.BodyParser(&comment)
	if err != nil {
		context.Status(http.StatusUnprocessableEntity).JSON(
			&fiber.Map{"message": "request failed"})
		return err
	}

	if err := r.DB.Create(&comment).Error; err != nil {
		log.Println("DB Create Error:", err)
		context.Status(http.StatusBadRequest).JSON(&fiber.Map{"message": "could not create comment"})
		return err
	}

	context.Status(http.StatusOK).JSON(&fiber.Map{
		"message": "comment has been created"})
	return nil
}

func (r *Repository) GetCommentsByThreadID(context *fiber.Ctx) error {
	threadID := context.Params("thread_id")
	comments := &[]models.Comment{}

	err := r.DB.Where("thread_id = ?", threadID).Find(comments).Error
	if err != nil {
		context.Status(http.StatusBadRequest).JSON(
			&fiber.Map{"message": "could not get comments"})
		return err
	}

	context.Status(http.StatusOK).JSON(&fiber.Map{
		"message": "comments fetched successfully",
		"data":    comments,
	})
	return nil
}

// Categories
func (r *Repository) CreateCategory(context *fiber.Ctx) error {
	category := models.Category{}

	err := context.BodyParser(&category)
	if err != nil {
		context.Status(http.StatusUnprocessableEntity).JSON(
			&fiber.Map{"message": "request failed"})
		return err
	}

	if err := r.DB.Create(&category).Error; err != nil {
		log.Println("DB Create Error:", err)
		context.Status(http.StatusBadRequest).JSON(&fiber.Map{"message": "could not create category"})
		return err
	}

	context.Status(http.StatusOK).JSON(&fiber.Map{
		"message": "category has been created"})
	return nil
}

func (r *Repository) GetCategories(context *fiber.Ctx) error {
	categories := &[]models.Category{}

	err := r.DB.Find(categories).Error
	if err != nil {
		context.Status(http.StatusBadRequest).JSON(
			&fiber.Map{"message": "could not get categories"})
		return err
	}

	context.Status(http.StatusOK).JSON(&fiber.Map{
		"message": "categories fetched successfully",
		"data":    categories,
	})
	return nil
}

// Tags
func (r *Repository) CreateTag(context *fiber.Ctx) error {
	tag := models.Tag{}

	err := context.BodyParser(&tag)
	if err != nil {
		context.Status(http.StatusUnprocessableEntity).JSON(
			&fiber.Map{"message": "request failed"})
		return err
	}

	if err := r.DB.Create(&tag).Error; err != nil {
		log.Println("DB Create Error:", err)
		context.Status(http.StatusBadRequest).JSON(&fiber.Map{"message": "could not create tag"})
		return err
	}

	context.Status(http.StatusOK).JSON(&fiber.Map{
		"message": "tag has been created"})
	return nil
}

func (r *Repository) GetTags(context *fiber.Ctx) error {
	tags := &[]models.Tag{}

	err := r.DB.Find(tags).Error
	if err != nil {
		context.Status(http.StatusBadRequest).JSON(
			&fiber.Map{"message": "could not get tags"})
		return err
	}

	context.Status(http.StatusOK).JSON(&fiber.Map{
		"message": "tags fetched successfully",
		"data":    tags,
	})
	return nil
}

func (r *Repository) SetupRoutes(app *fiber.App) {
	api := app.Group("/api")
	// Thread routes
	api.Post("/create_thread", r.CreateThread)
	api.Delete("/delete_thread/:id", r.DeleteThread)
	api.Get("/get_threads", r.GetThreads)
	api.Get("/get_thread/:id", r.GetThreadByID)
	// User routes
	api.Post("/signup", r.SignUp)  // Replace `CreateUser` with `SignUp`
	api.Post("/login", r.Login)    // Add a route for `Login`
	// api.Get("/get_users", JWTMiddleware, r.GetUsers) // Protect `GetUsers` with JWTMiddleware

	// Comment routes
	api.Post("/create_comment", r.CreateComment)
	api.Get("/get_comments/:thread_id", r.GetCommentsByThreadID)
	// Category routes
	api.Post("/create_category", r.CreateCategory)
	api.Get("/get_categories", r.GetCategories)
	// Tag routes
	api.Post("/create_tag", r.CreateTag)
	api.Get("/get_tags", r.GetTags)
	// Middleware
	app.Get("/protected", JWTMiddleware, func(c *fiber.Ctx) error {
		return c.Status(http.StatusOK).JSON(&fiber.Map{
			"message": "You have access to this protected route!",
		})
	})
	
}

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal(err)
	}
	config := &storage.Config{
		Host:     os.Getenv("DB_HOST"),
		Port:     os.Getenv("DB_PORT"),
		Password: os.Getenv("DB_PASS"),
		User:     os.Getenv("DB_USER"),
		SSLMode:  os.Getenv("DB_SSLMODE"),
		DBName:   os.Getenv("DB_NAME"),
	}

	db, err := storage.NewConnection(config)
	if err != nil {
		log.Fatal("could not load the database")
	}

	err = models.Migrate(db)
	if err != nil {
		log.Fatal("could not migrate db")
	}

	r := Repository{
		DB: db,
	}
	app := fiber.New()
	r.SetupRoutes(app)
	app.Listen(":8080")
}
