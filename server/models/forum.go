package models

import "gorm.io/gorm"

// Users
type User struct {
	ID        uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Username  string `gorm:"unique" json:"username"`
	Email     string `gorm:"unique" json:"email"`
	Password  string `json:"password"`
}

func MigrateUsers(db *gorm.DB) error {
	return db.AutoMigrate(&User{})
}

// Categories
type Category struct {
	ID        uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string `gorm:"unique" json:"name"`
	CreatedAt string `json:"created_at"`
}

func MigrateCategories(db *gorm.DB) error {
	return db.AutoMigrate(&Category{})
}

// Threads
type Thread struct {
	ID         uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Title      string `json:"title"`
	Content	   string `json:"content"`
	UserID     uint   `json:"user_id"`
	CategoryID uint   `json:"category_id"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

func MigrateThreads(db *gorm.DB) error {
	return db.AutoMigrate(&Thread{})
}

// Tags
type Tag struct {
	ID   uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"unique" json:"name"`
}

func MigrateTags(db *gorm.DB) error {
	return db.AutoMigrate(&Tag{})
}

// ThreadTags
type ThreadTag struct {
	ThreadID uint `gorm:"primaryKey" json:"thread_id"`
	TagID    uint `gorm:"primaryKey" json:"tag_id"`
}

func MigrateThreadTags(db *gorm.DB) error {
	return db.AutoMigrate(&ThreadTag{})
}

// Comments
type Comment struct {
	ID        uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	ThreadID  uint   `json:"thread_id"`
	UserID    uint   `json:"user_id"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func MigrateComments(db *gorm.DB) error {
	return db.AutoMigrate(&Comment{})
}

// Consolidated migration function
func Migrate(db *gorm.DB) error {
	if err := MigrateUsers(db); err != nil {
		return err
	}
	if err := MigrateCategories(db); err != nil {
		return err
	}
	if err := MigrateThreads(db); err != nil {
		return err
	}
	if err := MigrateTags(db); err != nil {
		return err
	}
	if err := MigrateThreadTags(db); err != nil {
		return err
	}
	if err := MigrateComments(db); err != nil {
		return err
	}
	return nil
}
