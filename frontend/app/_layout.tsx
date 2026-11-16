import { Slot } from 'expo-router'
import { Platform } from 'react-native'
import * as WebBrowser from 'expo-web-browser'

// WebBrowserセッションの完了をハンドリング
if (Platform.OS === 'web') {
	WebBrowser.maybeCompleteAuthSession()
}

export default function RootLayout() {
	return <Slot />
}