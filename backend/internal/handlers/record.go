package handlers

import (
	"net/http"
	"time"

	"body-graph/backend/internal/database"
	"body-graph/backend/internal/models"

	"github.com/gin-gonic/gin"
)

type RecordInput struct {
	RecordedAt time.Time `json:"recorded_at" binding:"required"`
	Weight     float64   `json:"weight" binding:"required"`
	BodyFat    float64   `json:"body_fat"`
	Steps      int       `json:"steps"`
	Source     string    `json:"source"`
}

// 記録の新規追加（履歴として蓄積）
func CreateRecord(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var input RecordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	record := models.Record{
		UserID:     userID.(uint),
		RecordedAt: input.RecordedAt,
		Weight:     input.Weight,
		BodyFat:    input.BodyFat,
		Steps:      input.Steps,
		Source:     input.Source,
	}

	if err := database.DB.Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save record"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "record created successfully", "data": record})
}

func GetRecords(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	startDateStr := c.Query("start_date") // "YYYY-MM-DD"
	endDateStr := c.Query("end_date")     // "YYYY-MM-DD"

	startDate, err1 := time.Parse("2006-01-02", startDateStr)
	endDate, err2 := time.Parse("2006-01-02", endDateStr)

	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
		return
	}
	// 終了日の23:59:59までを含める
	endDate = endDate.Add(24 * time.Hour)

	var records []models.Record
	err := database.DB.Where("user_id = ? AND recorded_at >= ? AND recorded_at < ?", userID, startDate, endDate).
		Order("recorded_at asc").
		Find(&records).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch records"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": records})
}
