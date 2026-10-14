package main

import (
	"body-graph/backend/internal/database"
	"body-graph/backend/internal/handlers"
	"body-graph/backend/internal/middleware"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 環境変数の切り替えと.envの読み込み
	loadEnv()

	// DB接続
	database.ConnectDB()

	r := gin.Default()

	api := r.Group("/api/v1")
	{
		// パブリックグループ
		publicGroup := api.Group("/")
		publicGroup.Use(middleware.VIPKeyMiddleware())
		{
			publicGroup.POST("/auth/login", handlers.SocialLogin)
		}

		// セキュアグループ
		secureGroup := api.Group("/")
		secureGroup.Use(middleware.VIPKeyMiddleware())
		secureGroup.Use(middleware.AuthMiddleware())
		{
			secureGroup.POST("/records", handlers.CreateRecord)
			secureGroup.GET("/records", handlers.GetRecords)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}

// 環境に応じて適切な.envファイルを読み込み関数
func loadEnv() {
	// APP_ENVが指定されていなければデフォルトで"development"にする
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	var filename string
	if env == "production" {
		filename = ".env.production"
	} else {
		filename = ".env.development"
	}

	// 指定したファイルを読み込む（ファイルが存在しない場合は警告をお出すかフォールバック）
	err := godotenv.Load(filename)
	if err != nil {
		log.Printf("Warning: Could not load %s file: %v. Falling back to system environment variables.", filename, err)
	} else {
		log.Printf("Loaded environment from %s", filename)
	}
}
