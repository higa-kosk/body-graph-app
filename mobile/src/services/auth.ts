import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

export const saveToken = async (token:string) => {
	if (Platform.OS === 'web') {
		localStorage.setItem('jwt_token', token)
	} else {
		await SecureStore.setItemAsync('jwt_token', token)
	}
}

export const removeToken = async () => {
	if (Platform.OS === 'web') {
		localStorage.removeItem('jwt_token')
	} else {
		await SecureStore.deleteItemAsync('jwt_token')
	}
}