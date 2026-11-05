import React, { useState } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform, Modal, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as AppleAuthentication from 'expo-apple-authentication'
import { useRouter } from 'expo-router'
import apiClient from '@/services/api'
import { saveToken } from '@/services/auth'

export default function LoginScreen() {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [modalVisible, setModalVisible] = useState(false)
	const [pendingUserData, setPendingUserData] = useState<any>(null)

	// ログイン（存在確認）の実行
	const handleSocialLoginMock = async (provider: 'apple' | 'google') => {
		try {
			setLoading(true)
			// モック用のペイロード（後々本番SDKを導入する際は、ここに取得した情報を渡す）
			const mockPayload = {
				provider,
				provider_id: provider === 'apple' ? 'mock_apple_user_999999' : 'mock_google_user_888888',
				email: provider === 'apple' ? 'apple.user@example.com' : 'google.user@example.com',
				name: provider === 'apple' ? 'Appleユーザー' : 'Googleユーザー',
			}

			// バックエンドの/auth/loginにリクエスト
			const response = await apiClient.post('/auth/login', mockPayload)
			const data = response.data

			if (data.status === 'needs_registration') {
				// 未登録の場合：勝手に作らず、データを保持して確認モーダルを表示
				setPendingUserData(mockPayload)
				setModalVisible(true)
			} else {
				// 既存ユーザーの場合：JWTを保存してホームへ遷移
				await saveToken(data.token)
				router.replace('/(tabs)')
			}
		} catch (error: any) {
			console.error('Login error:', error)
			Alert.alert('ログイン失敗', '認証に失敗しました。時間をおいて再度お試しください。')
		} finally {
			setLoading(false)
		}
	}

	// モーダルで「登録する」が選択された時の新規登録実行
	const handleConfirmRegister = async () => {
		if (!pendingUserData) return

		try {
			setLoading(true)
			const response = await apiClient.post('/auth/register', pendingUserData)
			const data = response.data

			if (data.token) {
				await saveToken(data.token)
				setModalVisible(false)
				router.replace('/(tabs)')
			}
		} catch (error: any) {
			Alert.alert('エラー', '新規登録処理に失敗しました')
		} finally {
			setLoading(false)
		}
	}

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Body Graph</Text>
				<Text style={styles.subtitle}>日々の体重・体脂肪・歩数をシンプルに管理</Text>

				{/* Googleログインボタン（モック） */}
				<TouchableOpacity
					style={styles.googleButton}
					onPress={() => handleSocialLoginMock('google')}
					disabled={loading}
				>
					<Text style={styles.buttonText}>Googleでログイン（モック）</Text>
				</TouchableOpacity>
				
				{/* Appleログインボタン（モック） */}
				<TouchableOpacity
					style={styles.appleButton}
					onPress={() => handleSocialLoginMock('apple')}
					disabled={loading}
				>
					<Text style={styles.appleButtonText}>Appleでサインイン（モック）</Text>
				</TouchableOpacity>

				{loading && (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size='small' color='#4cc9f0' />
					</View>
				)}
			</View>

			{/* 新規登録の意思を確認するカスタムモーダル */}
			<Modal
				visible={modalVisible}
				transparent={true}
				animationType='fade'
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>新規登録の確認</Text>
						<Text style={styles.modalText}>
							登録されているアカウントが見つかりませんでした。{'\n'}
							新しくアカウントを作成して利用を開始しますか？
						</Text>

						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.modalBtn, styles.cancelBtn]}
								onPress={() => setModalVisible(false)}
								disabled={loading}
							>
								<Text style={styles.cancelBtnText}>キャンセル</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.modalBtn, styles.registerBtn]}
								onPress={handleConfirmRegister}
								disabled={loading}
							>
								<Text style={styles.registerBtnText}>登録する</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: { 
		flex: 1, 
		justifyContent: 'center', 
		alignItems: 'center', 
		backgroundColor: '#0b132b', // アプリ共通のディープダーク背景
		padding: 20 
	},
	content: {
		width: '100%',
		maxWidth: 400,
		alignItems: 'center',
	},
	title: { 
		fontSize: 32, 
		fontWeight: '900', 
		color: '#4cc9f0', 
		marginBottom: 8,
		letterSpacing: 1,
	},
	subtitle: { 
		fontSize: 14, 
		color: '#8d99ae', 
		marginBottom: 48,
		textAlign: 'center',
	},
	googleButton: { 
		width: '100%', 
		height: 52, 
		backgroundColor: '#4285F4', 
		justifyContent: 'center', 
		alignItems: 'center', 
		borderRadius: 16, 
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 6,
		elevation: 4,
	},
	appleButton: { 
		width: '100%', 
		height: 52, 
		backgroundColor: '#ffffff', 
		justifyContent: 'center', 
		alignItems: 'center', 
		borderRadius: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 6,
		elevation: 4,
	},
	buttonText: { 
		color: '#fff', 
		fontSize: 16, 
		fontWeight: 'bold', 
	},
	appleButtonText: {
		color: '#000000',
		fontSize: 16,
		fontWeight: 'bold',
	},
	loadingContainer: {
		marginTop: 24,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
	},
	modalCard: {
		backgroundColor: '#1c2541',
		borderRadius: 24,
		padding: 24,
		width: '100%',
		maxWidth: 380,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#4cc9f0',
		marginBottom: 12,
		textAlign: 'center',
	},
	modalText: {
		fontSize: 14,
		color: '#ffffff',
		textAlign: 'center',
		lineHeight: 22,
		marginBottom: 24,
	},
	modalButtons: {
		flexDirection: 'row',
		gap: 12,
	},
	modalBtn: {
		flex: 1,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: 'center',
	},
	cancelBtn: {
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
	},
	cancelBtnText: {
		color: '#8d99ae',
		fontWeight: 'bold',
	},
	registerBtn: {
		backgroundColor: '#ffd166',
	},
	registerBtnText: {
		color: '#0b132b',
		fontWeight: '900',
	},
})