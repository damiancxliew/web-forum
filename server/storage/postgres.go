package storage

import (
	"fmt"
	"net/url"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Config struct {
	Host     string
	Port     string
	Password string
	User     string
	DBName   string
	SSLMode  string
}

// ParseURL parses the DATABASE_URL for use in gorm
func ParseURL(databaseURL string) (*Config, error) {
	// Parse the DATABASE_URL
	parsedURL, err := url.Parse(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("invalid database URL: %v", err)
	}

	// Extract user info (username and password)
	userInfo := parsedURL.User
	if userInfo == nil {
		return nil, fmt.Errorf("missing user info in DATABASE_URL")
	}

	// Parse the user info
	username := userInfo.Username()
	password, _ := userInfo.Password()

	// Split the path for the database name (after the last slash)
	dbName := strings.TrimPrefix(parsedURL.Path, "/")

	// Create and return the config
	return &Config{
		Host:     parsedURL.Hostname(),
		Port:     parsedURL.Port(),
		User:     username,
		Password: password,
		DBName:   dbName,
		SSLMode:  parsedURL.Query().Get("sslmode"), // Add this if you use `sslmode` in the URL
	}, nil
}

func NewConnection(config *Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		config.Host, config.Port, config.User, config.Password, config.DBName, config.SSLMode,
	)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return db, err
	}
	return db, nil
}
