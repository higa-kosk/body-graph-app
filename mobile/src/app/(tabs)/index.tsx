import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import apiClient from '@/src/services/api'
import DualAxisChart from '@/src/components/DualAxisChart'

export default function HomeScreen() {
	const [records, setRecords] = useState<any[]>([])
	const [weight, setWeight] = useState('')
	const [bodyFat, setBodyFat] = useState('')
	const [steps, setSteps] = useState('')
	const heightCm = 170 // 仮のユーザー身長（cm）

	// 表示する指標の選択状態（複数選択可能）
	const [showWeight, setShowWeight] = useState(true)
	const [showBodyFat, setShowBodyFat] = useState(false)
	//const [showSteps, setShowSteps] = useState(false)

	// 期間指定で記録データを取得する関数
	const fetchRecords = async () => {
		try {
			// 例として直近30日間の範囲を指定
			const endDate = new Date().toISOString().split('T')[0]
			const startDateObj = new Date()
			startDateObj.setDate(startDateObj.getDate() - 30)
			const startDate = startDateObj.toISOString().split('T')[0]

			const response = await apiClient.get(`/records?start_date=${startDate}&end_date=${endDate}`)
			// 日付昇順にソートしておく
			const sortedData = (response.data.data || []).sort((a: any, b:any) =>
				new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
		)
			setRecords(sortedData)

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
	const weights = records.map((r) => r.weight)
	const latestWeight = weights.length > 0 ? weights[weights.length - 1] : 0
	const heightM = heightCm / 100
	const currentBMI = heightM > 0 && latestWeight > 0 ? (latestWeight / (heightM * heightM)).toFixed(1) : '-'

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.headerTitle}>ヘルスケアダッシュボード</Text>

			{/* サマリー表示 */}
			<View style={styles.summaryCard}>
				<Text style={styles.summaryText}>最新体重： {latestWeight} kg</Text>
				<Text style={styles.summaryText}>現在のBMI： {currentBMI}</Text>
			</View>

			{/* グラフ表示切替トグル */}
			<View style={styles.toggleContainer}>
				<TouchableOpacity
					style={[styles.toggleButton, showWeight && styles.toggleActiveBlue]}
					onPress={() => setShowWeight(!showWeight)}
				>
					<Text style={[styles.toggleText, showWeight && styles.toggleTextActive]}>● 体重</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.toggleButton, showBodyFat && styles.toggleActiveOrange]}
					onPress={() => setShowBodyFat(!showBodyFat)}
				>
					<Text style={[styles.toggleText, showBodyFat && styles.toggleTextActive]}>● 体脂肪率</Text>
				</TouchableOpacity>
			</View>

			{/* カスタム2軸グラフ */}
			<View style={styles.chartContainer}>
				<Text style={styles.chartTitle}>健康データの推移（直近30日間）</Text>
				<DualAxisChart records={records} showWeight={showWeight} showBodyFat={showBodyFat} />
			</View>

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
  toggleContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16, gap: 12 },
  toggleButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#e9ecef', borderWidth: 1, borderColor: '#ced4da' },
  toggleActiveBlue: { backgroundColor: '#e7f1ff', borderColor: '#007AFF' },
  toggleActiveOrange: { backgroundColor: '#fff3cd', borderColor: '#fd7e14' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#495057' },
  toggleTextActive: { color: '#000' },
  chartContainer: { backgroundColor: '#fff', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 16, elevation: 2 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, alignSelf: 'flex-start' },
  formContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 16, elevation: 2 },
  formTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, backgroundColor: '#fff' },
  saveButton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})