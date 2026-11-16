import axios from "axios"
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const VIP_KEY = process.env.EXPO_PUBLIC_VIP_KEY || ''

// 環境やプラットフォームに応じてbaseURLを動的に切り替える
const getBaseURL = () => {
	if (Platform.OS === 'web') {
		return 'http://localhost:8080/api/v1'
	} else {
		return process.env.EXPO_PUBLIC_API_URL
	}
}

const apiClient = axios.create({
	baseURL: getBaseURL(),
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
		'X-VIP-Key': VIP_KEY,
	},
})

apiClient.interceptors.request.use(
	async (config) => {
		try {
			let token: string | null = null
			if (Platform.OS === 'web') {
				token = localStorage.getItem('jwt_token')
			} else {
				token = await SecureStore.getItemAsync('jwt_token')
			}

			console.log('【Interceptor Token】:', token ? `${token.substring(0, 10)}...` : 'NULL OR EMPTY');
            console.log('【VIP Key】:', VIP_KEY ? 'Set' : 'EMPTY');

			if (token) {
				config.headers.Authorization = `Bearer ${token}`
			}
		} catch (error) {
			console.error('Failed to load token from storage', error)
		}
		return config
	},
	(error) => Promise.reject(error)
)

export default apiClient
