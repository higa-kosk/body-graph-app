import React, { useState } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import apiClient from '../services/api'
import { saveToken } from '../services/auth'
import { useRouter } from 'expo-router'

GoogleSignin.configure({
	webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
})

export default function LoginScreen() {
	const router = useRouter()
	const [loading, setLoading] = useState(false)

	const handleBackendLogin = async (provider: 'apple' | 'google', idToken: string) => {
		try {
			setLoading(true)
			const response = await apiClient.post('/auth/login', {
				provider,
				id_token: idToken,
			})

			const { token } = response.data
			await saveToken(token)
			router.replace('/(tabs)')

		} catch (error: any) {
			console.error('Login error:', error)
			Alert.alert('ログイン失敗', '認証に失敗しました。時間をおいて再度お試しください。')

		} finally {
			setLoading(false)
		}
	}

	const handleGoogleSignIn = async () => {
		try {
			await GoogleSignin.hasPlayServices()
			const userInfo = await GoogleSignin.signIn()
			const idToken = userInfo.data?.idToken
			if (idToken) {
				await handleBackendLogin('google', idToken)
			}
		} catch (error: any) {
			if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
				Alert.alert('エラー', 'Googleログインに失敗しました')
			}
		}
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>ヘルスケア記録アプリ</Text>
			<Text style={styles.subtitle}>日々の体重と体脂肪・歩数をシンプルに管理</Text>

			<TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} disabled={loading}>
				<Text style={styles.buttonText}>Googleでログイン</Text>
			</TouchableOpacity>

			{Platform.OS === 'ios' && (
				<AppleAuthentication.AppleAuthenticationButton
					buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
					buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
					cornerRadius={8}
					style={styles.appleButton}
					onPress={async () => {
						try {
							const credential = await AppleAuthentication.signInAsync({
								requestedScopes: [
									AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
									AppleAuthentication.AppleAuthenticationScope.EMAIL,
								],
							})

							if (credential.identityToken) {
								await handleBackendLogin('apple', credential.identityToken)
							}

						} catch (e: any) {
							if (e.code !== 'ERR_REQUEST_CANCELED') {
								Alert.alert('エラー', 'Appleログインに失敗しました')
							}
						}
					}}
				/>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
	title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
	subtitle: { fontSize: 14, color: '#666', marginBottom: 40 },
	googleButton: { width: '100%', height: 48, backgroundColor: '#4285F4', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginBottom: 16 },
	appleButton: { width: '100%', height: 48 },
	buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})