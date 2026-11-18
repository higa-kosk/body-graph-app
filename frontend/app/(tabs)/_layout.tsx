import { Tabs, useRouter } from 'expo-router'
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { removeToken } from '@/services/auth'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

export default function TabLayout() {
	const router = useRouter()
	const [isLoggedIn, setIsLoggedIn] = useState(false)

	// マウント時やフォーカス時にログイン状態（トークンの有無）をチェック
	useEffect(() => {
		const checkLoginStatus = async () => {
			let token = null
			if (Platform.OS === 'web') {
				token = localStorage.getItem('jwt_token')
			} else {
				token = await SecureStore.getItemAsync('jwt_toekn')
			}
			setIsLoggedIn(!!token)
		}
		checkLoginStatus()
	}, [])

	// アイコンが押された時のアクション
	const handleIconPress = async () => {
		if (isLoggedIn) {
			// ログイン中の場合：ログアウト処理を実行してログイン画面へ
			await removeToken()
			setIsLoggedIn(false)
			router.replace('/login')
		} else {
			// 未ログインの場合：ログイン画面へ誘導
			router.replace('/login')
		}
	}

	// ログアウトアクション
	const handleLogout = async () => {
		// トークンを削除
		await removeToken()
		router.replace('/login')
	}

	return (
		<Tabs 
			screenOptions={{ 
				headerShown: true,
				headerStyle: {
					backgroundColor: '#0b132b',
				},
				headerTintColor: '#ffffff',
				headerTitleStyle: {
					fontWeight: 'bold',
				},
				// 状態に応じてアイコンを動的に切り替える
				headerRight: () => (
					<View style={styles.buttonsWrapper}>
						<FontAwesome
							style={styles.iconButton}
							name={isLoggedIn ? 'user' : 'lock'}
							size={20}
							color={isLoggedIn ? '#4cc9f0' : '#ffd166'}
						/>
					<TouchableOpacity style={styles.logoutButtonContainer} onPress={handleLogout}>
						{isLoggedIn 
							? <Text style={styles.logoutButtonText}>ログアウト</Text>
							: <Text style={styles.loginButtonText}>ログイン</Text>
						}
					</TouchableOpacity>
					</View>
				),
			}}
		>
			<Tabs.Screen
				name='index'
				options={{
					title: 'ホーム',
				}}
			/>
			<Tabs.Screen
				name='history'
				options={{
					title: '履歴一覧',
				}}
			/>
		</Tabs>
	)
}

const styles = StyleSheet.create({
	buttonsWrapper: {
		display: 'flex',
		alignItems: 'center',
		marginRight: 16,
		gap: 0,
	},
	iconButton: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	logoutButtonContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 4,
		paddingHorizontal: 8,
	},
	logoutButtonText: {
		textAlign: 'center',
		color: '#4cc9f0',
		fontSize: 12,
		fontWeight: 'bold',
	},
	loginButtonText: {
		textAlign: 'center',
		color: '#ffd166',
		fontSize: 12,
		fontWeight: 'bold',
	}
})