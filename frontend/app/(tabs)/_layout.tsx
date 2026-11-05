import { Tabs } from 'expo-router'

export default function TabLayout() {
	return (
		<Tabs screenOptions={{ headerShown: false }}>
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