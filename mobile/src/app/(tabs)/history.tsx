import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import apiClient from '@/src/services/api'

interface RecordItem {
	id: number
	weight: number
	body_fat: number
	steps: number
	created_at: string
}

export default function HistoryScreen() {
	const [records, setRecords] = useState<RecordItem[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [periodDays, setPeriodDays] = useState(7)

	// バックエンドからデータ一覧を取得、期間が変更された際にデータを再取得
	useEffect(() => {
		fetchRecords(periodDays)
	}, [periodDays])

	const fetchRecords = async (days: number) => {
		try {
			setLoading(true)
			const endDate = new Date().toISOString().split('T')[0]
			const startDateObj = new Date()
			startDateObj.setDate(startDateObj.getDate() - days)
			const startDate = startDateObj.toISOString().split('T')[0]

			const response = await apiClient.get(`/records?start_date=${startDate}&end_date=${endDate}`)
			// 日付降順にソートしておく
			const sortedData = (response.data.data || []).sort(
				(a: any, b: any) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
			)
			setRecords(sortedData || [])

		} catch (error) {
			console.error('Failed to fetch records: ', error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<ScrollView contentContainerStyle={styles.container}>
					<Text style={styles.appTitle}>Body Graph</Text>
			<Text style={styles.title}>記録の履歴</Text>

			{/* 履歴ページのデザインに合わせた期間選択タブ */}
			<View style={styles.periodTabsContainer}>
				<View style={styles.periodTabs}>
					{[
						{ days: 7, label: '1週間' },
						{ days: 30, label: '1ヶ月間' },
						{ days: 90, label: '3ヶ月間' },
						{ days: 180, label: '半年間' },
						{ days: 365, label: '1年間' },
					].map((tab) => (
						<TouchableOpacity
							key={tab.days}
							style={[styles.periodBtn, periodDays === tab.days && styles.periodBtnActive]}
							onPress={() => setPeriodDays(tab.days)}
						>
							<Text style={[styles.periodBtnText, periodDays === tab.days && styles.periodBtnTextActive]}>
								{tab.label}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			{loading ? (

				<View style={styles.center}>
					<ActivityIndicator size='large' color='#ffd166' />
				</View>
			
			) : (

				<FlatList
					data={records}
					keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
					renderItem={({ item }) => (
						<View style={styles.card}>
							<View style={styles.dateContainer}>
								<Text style={styles.dateText}>{new Date(item.created_at).toLocaleString()}</Text>
							</View>
							<View style={styles.row}>
								<Text style={styles.label}>体重： <Text style={styles.valueYellow}>{item.weight} kg</Text></Text>
								<Text style={styles.label}>体脂肪率： <Text style={styles.valueWhite}>{item.body_fat} %</Text></Text>
							</View>
							<View style={styles.row}>
								<Text style={styles.label}>歩数： <Text style={styles.valueWhite}>{item.steps} 歩</Text></Text>
							</View>
						</View>
					)}
					contentContainerStyle={styles.listContainer}
					ListEmptyComponent={
						<Text style={styles.emptyText}>該当期間の記録はありません</Text>
					}
				/>
			)}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0b132b',
	},
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	appTitle: { fontSize: 32, fontWeight: '900', color: '#48cae4', textAlign: 'center', marginVertical: 16, letterSpacing: 1 },
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#ffffff',
		textAlign: 'center',
		marginVertical: 16,
	},
	periodTabsContainer: {
		paddingHorizontal: 16,
		maxWidth: 700,
		alignSelf: 'center',
		width: '100%',
		marginBottom: 12,
	},
	periodTabs: {
		flexDirection: 'row',
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		borderRadius: 20,
		padding: 4,
	},
	periodBtn: {
		flex: 1,
		paddingVertical: 6,
		borderRadius: 16,
		alignItems: 'center',
	},
	periodBtnActive: {
		backgroundColor: '#4cc9f0', // 履歴画面のテーマカラー（ネオンブルー）に合わせたアクティブ状態
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 3,
		elevation: 2,
	},
	periodBtnText: {
		color: 'rgba(255, 255, 255, 0.7)',
		fontSize: 12,
		fontWeight: '700',
	},
	periodBtnTextActive: {
		color: '#0b132b',
		fontWeight: '800',
	},
	listContainer: {
		paddingHorizontal: 16,
		paddingBottom: 24,
		maxWidth: 700,
		alignSelf: 'center',
		width: '100%',
	},
	card: {
		backgroundColor: '#1c2541',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
	},
	dateContainer: {
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		paddingBottom: 8,
		marginBottom: 8,
	},
	dateText: {
		color: '#8d99ae',
		fontSize: 12,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginVertical: 4,
	},
	label: {
		color: '#ffffff',
		fontSize: 14,
	},
	valueYellow: {
		color: '#ffd166',
		fontWeight: 'bold',
	},
	valueWhite: {
		color: '#ffffff',
		fontWeight: 'bold',
	},
	emptyText: {
		color: '#8d99ae',
		textAlign: 'center',
		marginTop: 40,
		fontSize: 14,
	},
})