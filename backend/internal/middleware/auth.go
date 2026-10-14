package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Claims JWTのペイロード（型安全に管理）
type Claims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

func jwtSecret() []byte {
	return []byte(os.Getenv("JWT_SECRET"))
}

// AuthMiddleware Bearer トークン認証ミドルウェア
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "無効な認証形式です"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims := &Claims{}

		// トークンの検証と、アルゴリズムの厳格なチェック（HMACの強制）
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return jwtSecret(), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "無効または期限切れのトークンです"})
			c.Abort()
			return
		}

		// userIDをコンテキストにセット
		c.Set("userID", claims.UserID)
		c.Next()
	}
}

// GenerateToken JWTトークンを生成するヘルパー関数
func GenerateToken(userID uint) (string, error) {
	claims := &Claims{
		UserID:           userID,
		RegisteredClaims: jwt.RegisteredClaims{},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret())
}
