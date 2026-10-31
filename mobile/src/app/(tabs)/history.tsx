import React, { useEffect, useState} from 'react'
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import axios from 'axios'
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

	// バックエンドからデータ一覧を取得
	useEffect(() => {
		fetchRecords(periodDays)
	}, [periodDays])

	const fetchRecords = async (days: number) => {
		try {
			const endDate = new Date().toISOString().split('T')[0]
			const startDateObj = new Date()
			startDateObj.setDate(startDateObj.getDate() - days)
			const startDate = startDateObj.toISOString().split('T')[0]

			const response = await apiClient.get(`/records?start_date=${startDate}&end_date=${endDate}`)
			// 日付降順にソートしておく
			const sortedData = (response.data.data || []).sort(
				(a: any, b:any) => {
					console.log(`sorting data: a => ${new Date(a.recorded_at).getTime()}, b => ${new Date(b.recorded_at).getTime()}`)
					new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
				}
			)
			setRecords(sortedData || [])

		} catch (error) {
			console.error('Failed to fetch records: ', error)
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size='large' color='#ffd166' />
			</View>
		)
	}

	return (
		<SafeAreaView style={styles.container}>
			<Text style={styles.title}>記録の履歴</Text>

			<FlatList
				data={records}
				keyExtractor={(item) => item.id.toString()}
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
			/>
		</SafeAreaView>
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
    backgroundColor: '#0b132b',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4cc9f0',
    textAlign: 'center',
    marginVertical: 16,
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
})