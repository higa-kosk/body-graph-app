package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Email      string `gorm:"uniqueIndex;not null"`
	Name       string
	Provider   string  `gorm:"not null"` // "apple" or "google"
	ProviderID string  `gorm:"uniqueIndex;not null"`
	Height     float64 // 身長（cm）
	Records    []Record
}

type Record struct {
	gorm.Model
	UserID     uint      `gorm:"index;not null" json:"user_id"`
	RecordedAt time.Time `gorm:"index;not null" json:"recorded_at"` // 記録日時（入力したその瞬間のスナップショット）
	Weight     float64   `gorm:"not null" json:"weight"`            // 体重（kg）
	BodyFat    float64   `json:"body_fat"`                          // 体脂肪率（%）
	Steps      int       `json:"steps"`                             // その時までの歩数
	Source     string    `json:"source"`                            // "manual", "apple_health", "google_health"
}
