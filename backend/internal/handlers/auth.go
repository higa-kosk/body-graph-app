package handlers

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"body-graph/backend/internal/database"
	"body-graph/backend/internal/models"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gin-gonic/gin"
)

// モック用の簡易JWT生成関数
func generateMockToken(userID uint) string {
	return "mock-jwt-token-for-user-id-"
}

// ソーシャルログインの存在確認・ログイン処理
func SocialLogin(c *gin.Context) {
	var input struct {
		Provider   string `json:"provider" binding:"required"`    // "apple" or "google"
		ProviderID string `json:"provider_id" binding:"required"` // プロバイダ固有のID
		Email      string `json:"email"`
		Name       string `json:"name"`
		IDToken    string `json:"id_token"` // フロントからid_tokenを受け取るフィールドを追加
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Googleログインの場合、バックエンドでIDトークンを検証する
	if input.Provider == "google" && input.IDToken != "" {
		sub, verifiedEmail, err := verifyGoogleToken(c.Request.Context(), input.IDToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid google id token"})
			return
		}
		// 改ざんを防ぐ為、検証済みのsub（Googleのユーザー一意ID）とメールアドレスを使用
		input.ProviderID = sub
		if verifiedEmail != "" {
			input.Email = verifiedEmail
		}
	}

	var user models.User
	// ProviderIDでユーザーを検索（モデル側でuniqueIndexになっている前提）
	result := database.DB.Where("provider_id = ?", input.ProviderID).First(&user)

	if result.Error != nil {
		// 【未登録の場合】：勝手に作らず、「確認が必要」であることをフロントに伝える
		c.JSON(http.StatusOK, gin.H{
			"status":  "needs_registration",
			"message": "User not found. Please confirm registration.",
		})
		return
	}

	// 【既存ユーザーの場合】：ログイン成功（JWTを返却）
	token := generateMockToken(user.ID)
	c.JSON(http.StatusOK, gin.H{
		"status": "logged_in",
		"token":  token,
	})
}

// 新規登録確認画面で「登録する」が押された時の処理
func RegisterUser(c *gin.Context) {
	var input struct {
		Provider   string `json:"provider" binding:"required"`
		ProviderID string `json:"provider_id" binding:"required"`
		Email      string `json:"email" binding:"required"`
		Name       string `json:"name"`
		IDToken    string `json:"id_token"` // フロントからid_tokenを受け取るフィールドを追加
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		fmt.Printf("❌ Bind error details: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 念の為重複チェック
	var existingUser models.User
	if database.DB.Where("provider_id = ?", input.ProviderID).First(&existingUser).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user already exists"})
		return
	}

	// 新規ユーザー作成（Userモデルの構造に準拠）
	newUser := models.User{
		Email:      input.Email,
		Name:       input.Name,
		Provider:   input.Provider,
		ProviderID: input.ProviderID,
	}

	if err := database.DB.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	// 登録完了後にJWTを発行してログイン状態にする
	token := generateMockToken(newUser.ID)
	c.JSON(http.StatusCreated, gin.H{
		"status": "registered_and_logged_in",
		"token":  token,
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
