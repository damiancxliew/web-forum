package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"

	"strings"
	"time"

	"github.com/damiancxliew/web-forum/models"
	"github.com/damiancxliew/web-forum/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)
type User struct {
	Username  string `gorm:"unique" json:"username"`
	Email     string `gorm:"unique" json:"email"`
	Password  string `json:"-"` // Omit from JSON responses for security
}
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

	context.Status(http.StatusOK).JSON(thread)
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

	// context.Status(http.StatusOK).JSON(&fiber.Map{
	// 	"message": "threads fetched successfully",
	// 	"data":    threads,
	// })
	context.Status(http.StatusOK).JSON(threads)
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
        fmt.Printf("BodyParser Error: %v\n", err)
        return context.Status(http.StatusUnprocessableEntity).JSON(&fiber.Map{
            "message": "Invalid request",
        })
    }
    fmt.Printf("Parsed User: %+v\n", user)

    // Check for missing fields
    if user.Username == "" || user.Email == "" || user.Password == "" {
        return context.Status(http.StatusBadRequest).JSON(&fiber.Map{
            "message": "All fields are required",
        })
    }

    // Validate email format
    if !isValidEmail(user.Email) {
        return context.Status(http.StatusBadRequest).JSON(&fiber.Map{
            "message": "Invalid email format",
        })
    }

    // Validate password length (e.g., minimum 8 characters)
    if len(user.Password) < 8 {
        return context.Status(http.StatusBadRequest).JSON(&fiber.Map{
            "message": "Password must be at least 8 characters long",
        })
    }

    // Check if the email or username already exists
    var existingUser models.User
    if err := r.DB.Where("email = ?", user.Email).First(&existingUser).Error; err == nil {
        return context.Status(http.StatusConflict).JSON(&fiber.Map{
            "message": "Email already in use",
        })
    }

    if err := r.DB.Where("username = ?", user.Username).First(&existingUser).Error; err == nil {
        return context.Status(http.StatusConflict).JSON(&fiber.Map{
            "message": "Username already taken",
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
        fmt.Printf("Database Error: %v\n", err)
        return context.Status(http.StatusBadRequest).JSON(&fiber.Map{
            "message": "Could not create user",
        })
    }

    fmt.Printf("Created User: %+v\n", user)

    // Respond with created user details (excluding the password)
    return context.Status(http.StatusOK).JSON(&fiber.Map{
        "message": "User created successfully",
        "user": map[string]interface{}{
            "id":       user.ID,
            "username": user.Username,
            "email":    user.Email,
        },
    })
}

// Helper function to validate email format using regex
func isValidEmail(email string) bool {
    // Regular expression for validating email
    emailRegex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
    re := regexp.MustCompile(emailRegex)
    return re.MatchString(email)
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
// UpdateUser handles updating user data
func (r *Repository) UpdateUser(context *fiber.Ctx) error {
	// Parse user ID from URL params
	id := context.Params("id")

	type UpdateUserRequest struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	
	var updateRequest UpdateUserRequest
	if err := context.BodyParser(&updateRequest); err != nil {
		fmt.Println("Error parsing body:", err)
		return context.Status(http.StatusUnprocessableEntity).JSON(&fiber.Map{
			"message": "Invalid request",
		})
	}
	fmt.Printf("Parsed Body: %+v\n", updateRequest)
	
	// Validate user ID
	if id == "" {
		return context.Status(http.StatusBadRequest).JSON(&fiber.Map{
			"message": "User ID is required",
		})
	}

	// Find the user by ID
	var user models.User
	if err := r.DB.First(&user, id).Error; err != nil {
		return context.Status(http.StatusNotFound).JSON(&fiber.Map{
			"message": "User not found",
		})
	}

	// Update user fields only if they are provided
	if updateRequest.Username != "" {
		user.Username = updateRequest.Username
	}
	if updateRequest.Email != "" {
		user.Email = updateRequest.Email
	}

	// Save the updated user
	if err := r.DB.Save(&user).Error; err != nil {
		return context.Status(http.StatusInternalServerError).JSON(&fiber.Map{
			"message": "Failed to update user",
		})
	}

	// Respond with the updated user
	return context.Status(http.StatusOK).JSON(user)
}

func (r *Repository) GetUserByID(context *fiber.Ctx) error {
	id := context.Params("id")
	user := &models.User{}
	if id == "" {
		context.Status(http.StatusInternalServerError).JSON(&fiber.Map{
			"message": "id cannot be empty",
		})
		return nil
	}

	err := r.DB.Where("id = ?", id).First(user).Error
	if err != nil {
		context.Status(http.StatusBadRequest).JSON(
			&fiber.Map{"message": "could not get the thread"})
		return err
	}
	context.Status(http.StatusOK).JSON(user)
	// context.Status(http.StatusOK).JSON(&fiber.Map{
	// 	"message": "User fetched successfully",
	// 	"data":    user,
	// })
	return nil
}

func (r *Repository) GetUsers(context *fiber.Ctx) error {
    users := &[]models.User{}

    // Query the database for all users
    if err := r.DB.Find(users).Error; err != nil {
        return context.Status(http.StatusInternalServerError).JSON(&fiber.Map{
            "message": "Could not retrieve users",
        })
    }

    // Return the list of users
    return context.Status(http.StatusOK).JSON(users)
}

func (r *Repository) DeleteUser(context *fiber.Ctx) error {
	id := context.Params("id")
	if id == "" {
		return context.Status(http.StatusInternalServerError).JSON(&fiber.Map{
			"message": "id cannot be empty",
		})
	}

	// Start a transaction
	tx := r.DB.Begin()

	// Delete comments by user
	if err := tx.Where("user_id = ?", id).Delete(&models.Comment{}).Error; err != nil {
		tx.Rollback()
		return context.Status(http.StatusBadRequest).JSON(&fiber.Map{
			"message": "could not delete comments",
		})
	}

	// Delete threads by user
	if err := tx.Where("user_id = ?", id).Delete(&models.Thread{}).Error; err != nil {
		tx.Rollback()
		return context.Status(http.StatusBadRequest).JSON(&fiber.Map{
			"message": "could not delete threads",
		})
	}

	// Delete the user
	if err := tx.Delete(&models.User{}, id).Error; err != nil {
		tx.Rollback()
		return context.Status(http.StatusBadRequest).JSON(&fiber.Map{
			"message": "could not delete user",
		})
	}

	// Commit the transaction
	tx.Commit()

	return context.Status(http.StatusOK).JSON(&fiber.Map{
		"message": "user, threads, and comments deleted successfully",
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

	context.Status(http.StatusOK).JSON(comment)
	return nil
}
func (r *Repository) GetComments(context *fiber.Ctx) error {
	comments := &[]models.Comment{}

	err := r.DB.Find(comments).Error
	if err != nil {
		context.Status(http.StatusBadRequest).JSON(
			&fiber.Map{"message": "could not get comments"})
		return err
	}

	// context.Status(http.StatusOK).JSON(&fiber.Map{
	// 	"message": "threads fetched successfully",
	// 	"data":    threads,
	// })
	context.Status(http.StatusOK).JSON(comments)
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

func (r *Repository) DeleteComment(context *fiber.Ctx) error {
	id := context.Params("id")
	if id == "" {
		context.Status(http.StatusInternalServerError).JSON(&fiber.Map{
			"message": "id cannot be empty",
		})
		return nil
	}

	err := r.DB.Delete(&models.Comment{}, id)
	if err.Error != nil {
		context.Status(http.StatusBadRequest).JSON(&fiber.Map{
			"message": "could not delete comment",
		})
		return err.Error
	}
	context.Status(http.StatusOK).JSON(&fiber.Map{
		"message": "comment deleted successfully",
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

	// context.Status(http.StatusOK).JSON(&fiber.Map{
	// 	"message": "categories fetched successfully",
	// 	"data":    categories,
	// })
	context.Status(http.StatusOK).JSON(categories)
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
	api.Get("/get_users", r.GetUsers) // Protect `GetUsers` with JWTMiddleware
	api.Get("/get_user/:id", r.GetUserByID)
	api.Put("/users/:id", r.UpdateUser)
	api.Delete("/delete_user/:id", r.DeleteUser)


	// Comment routes
	api.Post("/create_comment", r.CreateComment)
	api.Get("/get_comments", r.GetComments)
	api.Get("/get_comments/:thread_id", r.GetCommentsByThreadID)
	api.Delete("/delete_comment/:id", r.DeleteComment)

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
	// Load environment variables from .env file
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal(err)
	}
	
	// Declare db variable here so it is in the scope of the entire main function
	var db *gorm.DB
	
	// Check the environment and set up the database config accordingly
	if os.Getenv("ENV") == "PROD" {
		// Parse the production DATABASE_URL
		config, err := storage.ParseURL(os.Getenv("DATABASE_URL"))
		if err != nil {
			log.Fatal("Error parsing DATABASE_URL:", err)
		}
	
		// Perform type assertion to *storage.Config (if it's necessary)
		if config == nil {
			log.Fatal("Parsed config is nil")
		}
		
		// Pass the *storage.Config to NewConnection
		db, err = storage.NewConnection(config)
		if err != nil {
			log.Fatal("could not load the database:", err)
		}
	
	} else {
		// Development or other environment configuration
		config := &storage.Config{
			Host:     os.Getenv("DB_HOST"),
			Port:     os.Getenv("DB_PORT"),
			Password: os.Getenv("DB_PASS"),
			User:     os.Getenv("DB_USER"),
			SSLMode:  os.Getenv("DB_SSLMODE"),
			DBName:   os.Getenv("DB_NAME"),
		}
		
		// Pass the *storage.Config to NewConnection
		db, err = storage.NewConnection(config)
		if err != nil {
			log.Fatal("could not load the database:", err)
		}
	}
	
	// Migrate database schema
	err = models.Migrate(db)
	if err != nil {
		log.Fatal("could not migrate db")
	}

	// Set up the repository
	r := Repository{
		DB: db,
	}

	// Create a new Fiber app and configure routes
	app := fiber.New()
	app.Use(cors.New())
	r.SetupRoutes(app)

	// Start the server on the dynamically assigned PORT or fallback to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default to 8080 if PORT is not set
	}

	// Start the server
	app.Listen(":" + port)
}

