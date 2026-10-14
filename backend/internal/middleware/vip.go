package middleware

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// VIPKeyMiddleware 正規のモバイルアプリからの通信であるかをカスタムヘッダーで検証
func VIPKeyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientVIPKey := c.GetHeader("X-VIP-Key")
		serverVIPKey := os.Getenv("VIP_SECRET_KEY")

		if clientVIPKey == "" || clientVIPKey != serverVIPKey {
			c.JSON(http.StatusForbidden, gin.H{"error": "アクセスが拒否されました"})
			c.Abort()
			return
		}

		c.Next()
	}
}
