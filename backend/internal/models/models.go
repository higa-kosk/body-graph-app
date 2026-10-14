package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Email      string  `gorm:"uniqueIndex;not null"`
	Provider   string  `gorm:"not null"` // "apple" or "google"
	ProviderID string  `gorm:"uniqueIndex;not null"`
	Height     float64 // 身長（cm）
	Records    []Record
}

type Record struct {
	gorm.Model
	UserID     uint      `gorm:"index;not null"`
	RecordedAt time.Time `gorm:"index;not null"` // 記録日時（入力したその瞬間のスナップショット）
	Weight     float64   `gorm:"not null"`       // 体重（kg）
	BodyFat    float64   // 体脂肪率（%）
	Steps      int       // その時までの歩数
	Source     string    // "manual", "apple_health", "google_health"
}
