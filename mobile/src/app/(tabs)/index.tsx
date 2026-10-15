import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { Dimensions } from 'react-native'
import apiClient from '@/src/services/api'

export default function HomeScreen() {
	const [records, setRecords] = useState<any[]>([])
	const [weight, setWeight] = useState('')
	const [bodyFat, setBodyFat] = useState('')
	const [steps, setSteps] = useState('')
	const heightCm = 170 // 仮のユーザー身長（cm）

	// 画面幅に応じたグラフ幅の調整
	const screenWidth = Dimensions.get('window').width
	const chartWitdh = screenWidth > 600 ? 560 : screenWidth - 32

	// 期間指定で記録データを取得する関数
	const fetchRecords = async () => {
		try {
			// 例として直近30日間の範囲を指定
			const endDate = new Date().toISOString().split('T')[0]
			const startDateObj = new Date()
			startDateObj.setDate(startDateObj.getDate() - 30)
			const startDate = startDateObj.toISOString().split('T')[0]

			const response = await apiClient.get(`/records?start_date=${startDate}&end_date=${endDate}`)
			setRecords(response.data.data || [])

		} catch (error) {
			console.error('Failed to fetch records', error)
		}
	}

	useEffect(() => {
		fetchRecords()
	}, [])

	// データを新規に記録・保存する関数
	const handleSaveRecord = async () => {
		if (!weight) {
			Alert.alert('エラー', '体重を入力してください')
			return
		}

		try {
			const payload = {
				recorded_at: new Date().toISOString(),
				weight: parseFloat(weight),
				body_fat: bodyFat ? parseFloat(bodyFat) : 0,
				steps: steps ? parseInt(steps, 10) : 0,
				source: 'manual',
			}

			await apiClient.post('/records', payload)
			Alert.alert('成功', '記録を保存しました')
			setWeight('')
			setBodyFat('')
			setSteps('')
			fetchRecords() // グラフを再読み込み

		} catch (error) {
			console.error('Failed to save record', error)
			Alert.alert('エラー', '保存に失敗しました')
		}
	}

	// グラフ用データの組み立て
	const labels = records.map((r) => {
		const d = new Date(r.recorded_at)
		return `${d.getMonth() + 1}/${d.getDate()}`
	})
	const weights = records.map((r) => r.weight)

	const latestWeight = weights.length > 0 ? weights[weights.length - 1] : 0
	const heightM = heightCm / 100
	const currentBMI = heightM > 0 && latestWeight > 0 ? (latestWeight / (heightM * heightM)).toFixed(1) : '-'

	// react-native-chart-kit用のデータ構造
	const chartData = {
		labels: labels.length > 0 ? labels : ['データなし'],
		datasets: [
			{
				data: weights.length > 0 ? weights : [0],
				color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
				strokeWidth: 2,
			},
		],
	}

	const chartConfig = {
		backgroundGradientFrom: '#ffffff',
		backgroundGradientTo: '#ffffff',
		decimalPlaces: 1,
		color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
		labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
		style: {
			borderRadius: 16,
		},
		propsForDots: {
			r: '4',
			strokeWidth: '2',
			stroke: '#007aff',
		},
	}

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.headerTitle}>ヘルスケアダッシュボード</Text>

			{/* サマリー表示 */}
			<View style={styles.summaryCard}>
				<Text style={styles.summaryText}>最新体重： {latestWeight} kg</Text>
				<Text style={styles.summaryText}>現在のBMI： {currentBMI}</Text>
			</View>

			{/* 折れ線グラフ */}
			{records.length > 0 ? (
				<View style={styles.chartContainer}>
					<Text style={styles.chartTitle}>体重の推移（直近30日間）</Text>
					<LineChart
						data={chartData}
						width={chartWitdh}
						height={220}
						chartConfig={chartConfig}
						bezier
						style={styles.chart}
					/>
				</View>
			) : (
				<Text style={styles.noDataText}>期間内の記録がありません</Text>
			)}

			{/* 入力フォーム */}
			<View style={styles.formContainer}>
				<Text style={styles.formTitle}>本日の記録を入力</Text>
				<TextInput
					style={styles.input}
					placeholder='体重（kg） 例： 65.5'
					keyboardType='numeric'
					value={weight}
					onChangeText={setWeight}
					placeholderTextColor='#999'
				/>
				<TextInput
					style={styles.input}
					placeholder='体脂肪率（%） 例： 18.0'
					keyboardType='numeric'
					value={bodyFat}
					onChangeText={setBodyFat}
					placeholderTextColor='#999'
				/>
				<TextInput
					style={styles.input}
					placeholder='歩数 例： 7500'
					keyboardType='numeric'
					value={steps}
					onChangeText={setSteps}
					placeholderTextColor='#999'
				/>
				<TouchableOpacity style={styles.saveButton} onPress={handleSaveRecord}>
					<Text style={styles.saveButtonText}>記録を保存</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8f9fa', flexGrow: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  summaryCard: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2 },
  summaryText: { fontSize: 16, fontWeight: '600', color: '#333' },
  chartContainer: { backgroundColor: '#fff', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 16, elevation: 2 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, alignSelf: 'flex-start' },
  chart: { marginVertical: 8, borderRadius: 16 },
  noDataText: { textAlign: 'center', color: '#666', marginVertical: 40 },
  formContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 16, elevation: 2 },
  formTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, backgroundColor: '#fff' },
  saveButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})