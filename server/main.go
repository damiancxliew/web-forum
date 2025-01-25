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
	"github.com/gin-gonic/gin"
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
func (r *Repository) CreateThread(c *gin.Context) {
	thread := models.Thread{}

	// Parse the JSON body into the thread object
	if err := c.ShouldBindJSON(&thread); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"message": "request failed"})
		return
	}

	// Create the thread in the database
	if err := r.DB.Create(&thread).Error; err != nil {
		log.Println("DB Create Error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "could not create thread"})
		return
	}

	// Respond with the created thread
	c.JSON(http.StatusOK, thread)
}


func (r *Repository) DeleteThread(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "id cannot be empty",
		})
		return
	}

	err := r.DB.Delete(&models.Thread{}, id).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "could not delete thread",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "thread deleted successfully",
	})
}


func (r *Repository) GetThreads(c *gin.Context) {
	threads := &[]models.Thread{}

	err := r.DB.Find(threads).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "could not get threads",
		})
		return
	}

	c.JSON(http.StatusOK, threads)
}

func (r *Repository) GetThreadByID(c *gin.Context) {
	id := c.Param("id")
	thread := &models.Thread{}
	if id == "" {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "id cannot be empty",
		})
		return
	}

	err := r.DB.Where("thread_id = ?", id).First(thread).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "could not get the thread",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "thread fetched successfully",
		"data":    thread,
	})
}


// Users
// JWT secret key
var jwtSecret = []byte("your_secret_key")

// SignUp handles user registration
func (r *Repository) SignUp(c *gin.Context) {
    user := models.User{}

    // Parse user input
    if err := c.ShouldBindJSON(&user); err != nil {
        fmt.Printf("BodyParser Error: %v\n", err)
        c.JSON(http.StatusUnprocessableEntity, gin.H{
            "message": "Invalid request",
        })
        return
    }
    fmt.Printf("Parsed User: %+v\n", user)

    // Check for missing fields
    if user.Username == "" || user.Email == "" || user.Password == "" {
        c.JSON(http.StatusBadRequest, gin.H{
            "message": "All fields are required",
        })
        return
    }

    // Validate email format
    if !isValidEmail(user.Email) {
        c.JSON(http.StatusBadRequest, gin.H{
            "message": "Invalid email format",
        })
        return
    }

    // Validate password length (e.g., minimum 8 characters)
    if len(user.Password) < 8 {
        c.JSON(http.StatusBadRequest, gin.H{
            "message": "Password must be at least 8 characters long",
        })
        return
    }

    // Check if the email or username already exists
    var existingUser models.User
    if err := r.DB.Where("email = ?", user.Email).First(&existingUser).Error; err == nil {
        c.JSON(http.StatusConflict, gin.H{
            "message": "Email already in use",
        })
        return
    }

    if err := r.DB.Where("username = ?", user.Username).First(&existingUser).Error; err == nil {
        c.JSON(http.StatusConflict, gin.H{
            "message": "Username already taken",
        })
        return
    }

    // Hash the password
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "message": "Failed to hash password",
        })
        return
    }
    user.Password = string(hashedPassword)

    // Save user to database
    if err := r.DB.Create(&user).Error; err != nil {
        fmt.Printf("Database Error: %v\n", err)
        c.JSON(http.StatusBadRequest, gin.H{
            "message": "Could not create user",
        })
        return
    }

    fmt.Printf("Created User: %+v\n", user)

    // Respond with created user details (excluding the password)
    c.JSON(http.StatusOK, gin.H{
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
func (r *Repository) Login(c *gin.Context) {
    var loginRequest struct {
        Email    string `json:"email"`
        Password string `json:"password"`
    }

    // Parse login credentials
    if err := c.ShouldBindJSON(&loginRequest); err != nil {
        c.JSON(http.StatusUnprocessableEntity, gin.H{
            "message": "Invalid request",
        })
        return
    }

    // Check for missing fields
    if loginRequest.Email == "" || loginRequest.Password == "" {
        c.JSON(http.StatusBadRequest, gin.H{
            "message": "Email and password are required",
        })
        return
    }

    // Find user by email
    var user models.User
    if err := r.DB.Where("email = ?", loginRequest.Email).First(&user).Error; err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{
            "message": "Invalid email or password",
        })
        return
    }

    // Check password
    if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginRequest.Password)); err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{
            "message": "Invalid email or password",
        })
        return
    }

    // Generate JWT token
    token, err := generateJWT(user)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "message": "Failed to generate token",
        })
        return
    }

    // Respond with the token
    c.JSON(http.StatusOK, gin.H{
        "message": "Login successful",
        "token":   token,
    })
}
 
// UpdateUser handles updating user data
func (r *Repository) UpdateUser(c *gin.Context) {
    // Parse user ID from URL params
    id := c.Param("id")

    type UpdateUserRequest struct {
        Username string `json:"username"`
        Email    string `json:"email"`
        Password string `json:"password"`
    }

    var updateRequest UpdateUserRequest
    if err := c.ShouldBindJSON(&updateRequest); err != nil {
        fmt.Println("Error parsing body:", err)
        c.JSON(http.StatusUnprocessableEntity, gin.H{
            "message": "Invalid request",
        })
        return
    }
    fmt.Printf("Parsed Body: %+v\n", updateRequest)

    // Validate user ID
    if id == "" {
        c.JSON(http.StatusBadRequest, gin.H{
            "message": "User ID is required",
        })
        return
    }

    // Find the user by ID
    var user models.User
    if err := r.DB.First(&user, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "message": "User not found",
        })
        return
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
        c.JSON(http.StatusInternalServerError, gin.H{
            "message": "Failed to update user",
        })
        return
    }

    // Respond with the updated user
    c.JSON(http.StatusOK, user)
}

func (r *Repository) GetUserByID(c *gin.Context) {
    id := c.Param("id") // Get the user ID from URL parameters
    user := &models.User{}
    
    // Check if ID is empty
    if id == "" {
        c.JSON(http.StatusBadRequest, gin.H{
            "message": "ID cannot be empty",
        })
        return
    }

    // Query the database for the user by ID
    err := r.DB.Where("id = ?", id).First(user).Error
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "message": "Could not retrieve the user",
        })
        return
    }

    // Respond with the fetched user details
    c.JSON(http.StatusOK, user)
}


func (r *Repository) GetUsers(c *gin.Context) {
    users := &[]models.User{}

    // Query the database for all users
    if err := r.DB.Find(users).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "message": "Could not retrieve users",
        })
        return
    }

    // Return the list of users
    c.JSON(http.StatusOK, users)
}


func (r *Repository) DeleteUser(c *gin.Context) {
    id := c.Param("id") // Get the user ID from URL parameters
    if id == "" {
        c.JSON(http.StatusBadRequest, gin.H{
            "message": "ID cannot be empty",
        })
        return
    }

    // Start a transaction
    tx := r.DB.Begin()

    // Delete comments by user
    if err := tx.Where("user_id = ?", id).Delete(&models.Comment{}).Error; err != nil {
        tx.Rollback()
        c.JSON(http.StatusBadRequest, gin.H{
            "message": "Could not delete comments",
        })
        return
    }

    // Delete threads by user
    if err := tx.Where("user_id = ?", id).Delete(&models.Thread{}).Error; err != nil {
        tx.Rollback()
        c.JSON(http.StatusBadRequest, gin.H{
            "message": "Could not delete threads",
        })
        return
    }

    // Delete the user
    if err := tx.Delete(&models.User{}, id).Error; err != nil {
        tx.Rollback()
        c.JSON(http.StatusBadRequest, gin.H{
            "message": "Could not delete user",
        })
        return
    }

    // Commit the transaction
    tx.Commit()

    // Respond with success
    c.JSON(http.StatusOK, gin.H{
        "message": "User, threads, and comments deleted successfully",
    })
}



// JWTMiddleware validates the JWT token
func JWTMiddleware(c *gin.Context) {
    // Get the token from the Authorization header
    authHeader := c.GetHeader("Authorization")
    if !strings.HasPrefix(authHeader, "Bearer ") {
        c.JSON(http.StatusUnauthorized, gin.H{
            "message": "Missing or invalid token",
        })
        c.Abort() // Ensure that the next handlers are not executed
        return
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
        c.JSON(http.StatusUnauthorized, gin.H{
            "message": "Invalid token",
        })
        c.Abort() // Ensure that the next handlers are not executed
        return
    }

    // Token is valid; proceed to the next handler
    c.Next()
}




// Comments
func (r *Repository) CreateComment(c *gin.Context) {
	comment := models.Comment{}

	err := c.BindJSON(&comment)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"message": "Request failed"})
		return
	}

	if err := r.DB.Create(&comment).Error; err != nil {
		log.Println("DB Create Error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "Could not create comment"})
		return
	}

	c.JSON(http.StatusOK, comment)
}

func (r *Repository) GetComments(c *gin.Context) {
	comments := &[]models.Comment{}

	err := r.DB.Find(comments).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Could not get comments"})
		return
	}

	c.JSON(http.StatusOK, comments)
}

func (r *Repository) GetCommentsByThreadID(c *gin.Context) {
	threadID := c.Param("thread_id")
	comments := &[]models.Comment{}

	err := r.DB.Where("thread_id = ?", threadID).Find(comments).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Could not get comments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Comments fetched successfully",
		"data":    comments,
	})
}

func (r *Repository) DeleteComment(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "ID cannot be empty"})
		return
	}

	if err := r.DB.Delete(&models.Comment{}, id).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Could not delete comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted successfully"})
}


// Categories
func (r *Repository) CreateCategory(c *gin.Context) {
	category := models.Category{}

	err := c.BindJSON(&category)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"message": "Request failed"})
		return
	}

	if err := r.DB.Create(&category).Error; err != nil {
		log.Println("DB Create Error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "Could not create category"})
		return
	}

	c.JSON(http.StatusOK, category)
}


func (r *Repository) GetCategories(c *gin.Context) {
	categories := &[]models.Category{}

	err := r.DB.Find(categories).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Could not get categories"})
		return
	}

	c.JSON(http.StatusOK, categories)
}

func (r *Repository) SetupRoutes(router *gin.Engine) {
	api := router.Group("/api")
	// Thread routes
	api.POST("/create_thread", r.CreateThread)
	api.DELETE("/delete_thread/:id", r.DeleteThread)
	api.GET("/get_threads", r.GetThreads)
	api.GET("/get_thread/:id", r.GetThreadByID)
	// User routes
	api.POST("/signup", r.SignUp)
	api.POST("/login", r.Login)    // Add a route for `Login`
	api.GET("/get_users", r.GetUsers) // Protect `GetUsers` with JWTMiddleware
	api.GET("/get_user/:id", r.GetUserByID)
	api.PUT("/users/:id", r.UpdateUser)
	api.DELETE("/delete_user/:id", r.DeleteUser)


	// Comment routes
	api.POST("/create_comment", r.CreateComment)
	api.GET("/get_comments", r.GetComments)
	api.GET("/get_comments/:thread_id", r.GetCommentsByThreadID)
	api.DELETE("/delete_comment/:id", r.DeleteComment)

	// Category routes
	api.POST("/create_category", r.CreateCategory)
	api.GET("/get_categories", r.GetCategories)

	// Middleware
	api.GET("/protected/", JWTMiddleware, func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "You have access to this protected route!",
		})
	})
}

// CORS middleware function definition
func corsMiddleware() gin.HandlerFunc {
	// Define allowed origins as a comma-separated string
	originsString := "http://localhost:3000"
	var allowedOrigins []string
	if originsString != "" {
	 // Split the originsString into individual origins and store them in allowedOrigins slice
	 allowedOrigins = strings.Split(originsString, ",")
	}
   
	// Return the actual middleware handler function
	return func(c *gin.Context) {
	 // Function to check if a given origin is allowed
	 isOriginAllowed := func(origin string, allowedOrigins []string) bool {
	  for _, allowedOrigin := range allowedOrigins {
	   if origin == allowedOrigin {
		return true
	   }
	  }
	  return false
	 }
   
	 // Get the Origin header from the request
	 origin := c.Request.Header.Get("Origin")
   
	 // Check if the origin is allowed
	 if isOriginAllowed(origin, allowedOrigins) {
	  // If the origin is allowed, set CORS headers in the response
	  c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
	  c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	  c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
	  c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
	 }
   
	 // Handle preflight OPTIONS requests by aborting with status 204
	 if c.Request.Method == "OPTIONS" {
	  c.AbortWithStatus(204)
	  return
	 }
   
	 // Call the next handler
	 c.Next()
	}}

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

	// Create a new Gin app
	router := gin.Default()

	// Enable CORS
    router.Use(corsMiddleware())
	
	// Set up routes
	r.SetupRoutes(router)

	// Start the server on the dynamically assigned PORT or fallback to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default to 8080 if PORT is not set
	}

	// Start the server
	err = router.Run(":" + port)
	if err != nil {
		log.Fatal("Error starting the server:", err)
	}
}

