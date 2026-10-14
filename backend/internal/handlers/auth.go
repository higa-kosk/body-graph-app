package handlers

import (
	"context"
	"net/http"
	"os"

	"body-graph/backend/internal/database"
	"body-graph/backend/internal/middleware"
	"body-graph/backend/internal/models"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gin-gonic/gin"
)

type LoginInput struct {
	Provider string `json:"provider" binding:"required"` // "apple"または"googole"
	IDToken  string `json:"id_token" binding:"required"`
}

func SocialLogin(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var providerID, email string
	var err error

	ctx := context.Background()

	// プロバイダ毎のIDトークン検証
	switch input.Provider {
	case "google":
		providerID, email, err = verifyGoogleToken(ctx, input.IDToken)
	case "apple":
		providerID, email, err = verifyAppleToken(ctx, input.IDToken)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported provider"})
		return
	}

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "failed to verify token: " + err.Error()})
		return
	}

	// ユーザーの検索、または新規作成（Upsert）
	var user models.User
	result := database.DB.Where("provider = ? AND provider_id = ?", input.Provider, providerID).First(&user)
	if result.Error != nil {
		// 新規登録
		user = models.User{
			Provider:   input.Provider,
			ProviderID: providerID,
			Email:      email,
		}
		if err := database.DB.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
			return
		}
	}

	// ミドルウェア側で定義したGenerateTokenを利用してセッション用JWTを発行
	tokenString, err := middleware.GenerateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":     user.ID,
			"email":  user.Email,
			"height": user.Height,
		},
	})
}

// Google IDトークンの検証補助関数
func verifyGoogleToken(ctx context.Context, idToken string) (string, string, error) {
	provider, err := oidc.NewProvider(ctx, "https://accounts.google.com")
	if err != nil {
		return "", "", err
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: os.Getenv("GOOGLE_CLIENT_ID")})
	rawToken, err := verifier.Verify(ctx, idToken)
	if err != nil {
		return "", "", err
	}

	var claims struct {
		Sub   string `json:"sub"`
		Email string `json:"email"`
	}
	if err := rawToken.Claims(&claims); err != nil {
		return "", "", err
	}

	return claims.Sub, claims.Email, nil
}

// Apple IDトークンの検証補助関数
func verifyAppleToken(ctx context.Context, idToken string) (string, string, error) {
	provider, err := oidc.NewProvider(ctx, "https://appleid.apple.com")
	if err != nil {
		return "", "", err
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: os.Getenv("APPLE_CLIENT_ID")})
	rawToken, err := verifier.Verify(ctx, idToken)
	if err != nil {
		return "", "", err
	}

	var claims struct {
		Sub   string `json:"sub"`
		Email string `json:"email"`
	}
	if err := rawToken.Claims(&claims); err != nil {
		return "", "", err
	}

	return claims.Sub, claims.Email, nil
}
