import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import apiClient from '@/src/services/api'
import DualAxisChart, { BodyCompositionPieChart } from '@/src/components/DualAxisChart'

export default function HomeScreen() {
	const [records, setRecords] = useState<any[]>([])
	const [weight, setWeight] = useState('')
	const [bodyFat, setBodyFat] = useState('')
	const [steps, setSteps] = useState('')

	// 表示する期間の状態保持
	const [periodDays, setPeriodDays] = useState(7)
	const [periodLabel, setPeriodLabel] = useState('Weekly')

	// 期間指定で記録データを取得する関数
	const fetchRecords = async (days: number) => {
		try {
			const endDate = new Date().toISOString().split('T')[0]
			const startDateObj = new Date()
			startDateObj.setDate(startDateObj.getDate() - days)
			const startDate = startDateObj.toISOString().split('T')[0]

			const response = await apiClient.get(`/records?start_date=${startDate}&end_date=${endDate}`)
			// 日付昇順にソートしておく
			const sortedData = (response.data.data || []).sort(
				(a: any, b:any) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
			)
			setRecords(sortedData)

		} catch (error) {
			console.error('Failed to fetch records', error)
		}
	}

	useEffect(() => {
		fetchRecords(periodDays)
	}, [periodDays])

	const handlePeriodChange = (days: number, label: string) => {
		setPeriodDays(days)
		setPeriodLabel(label)
	}

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
			fetchRecords(periodDays) // グラフを再読み込み

		} catch (error) {
			console.error('Failed to save record', error)
			Alert.alert('エラー', '保存に失敗しました')
		}
	}

	// グラフ用データの組み立て
	const weights = records.map((r) => r.weight)
	const avgWeight = weights.length > 0 ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : '-'
	const latestRecord =records.length > 0 ? records[records.length - 1] : { weight: 0, body_fat: 0 }

	return (

		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.appTitle}>Body Graph</Text>

			{/* --- 1. グラフカード（Weekly / Monthly etc.） --- */}
			<View style={[styles.card, styles.dashboardContainer]}>

				<View style={styles.cardHeader}>
					<Text style={styles.cardTitle}>{periodLabel} ▾</Text>
					<Text style={styles.subText}>Average: <Text style={{ color: '#ffd166' }}>{avgWeight}kg</Text></Text>
				</View>

				{/* ピルシェイプの期間タブ */}
				<View style={styles.periodTabs}>
					{[
						{ days: 7, label: '1週間'},
						{ days: 30, label: '1ヶ月間'},
						{ days: 90, label: '3ヶ月間'},
						{ days: 180, label: '半年間'},
						{ days: 365, label: '1年間'},
					].map((tab) => (
						<TouchableOpacity
							key={tab.days}
							style={[styles.periodBtn, periodDays === tab.days && styles.periodBtnActive]}
							onPress={() => handlePeriodChange(tab.days, tab.label)}
						>
							<Text style={[styles.periodBtnText, periodDays === tab.days && styles.periodBtnTextActive]}>
								{tab.label}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				<DualAxisChart records={records} showWeight={true} showBodyFat={true} showSteps={true} />

			</View>

			{/* --- 2. 体組成カード（Current body composition） --- */}
			<View style={[styles.card, styles.dashboardContainer]}>

				<View style={styles.cardHeader}>
					<Text style={styles.cardTitle}>Body Composition</Text>
					<Text style={styles.subText}>Today ▾</Text>
				</View>
				
				<BodyCompositionPieChart weight={latestRecord.weight} bodyFatPercentage={latestRecord.body_fat} />

			</View>

			{/* --- 3. データ入力フォーム */}
			<View style={[styles.formCard, styles.dashboardContainer]}>

				<Text style={styles.formTitle}>✨ 本日の記録を追加</Text>
				<TextInput
					style={styles.input}
					placeholder='体重（kg） 例： 54.2'
					keyboardType='numeric'
					value={weight}
					onChangeText={setWeight}
					placeholderTextColor='#a0a0a0'
				/>
				<TextInput
					style={styles.input}
					placeholder='体脂肪率（%） 例： 18.0'
					keyboardType='numeric'
					value={bodyFat}
					onChangeText={setBodyFat}
					placeholderTextColor='#a0a0a0'
				/>
				<TextInput
					style={styles.input}
					placeholder='歩数 例： 7500'
					keyboardType='numeric'
					value={steps}
					onChangeText={setSteps}
					placeholderTextColor='#a0a0a0'
				/>

				<TouchableOpacity style={styles.saveButton} onPress={handleSaveRecord}>
					<Text style={styles.saveButtonText}>記録を保存する</Text>
				</TouchableOpacity>

			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: { padding: 16, backgroundColor: '#121214', flexGrow: 1 }, // モダンなディープダーク背景
	appTitle: { fontSize: 32, fontWeight: '900', color: '#48cae4', textAlign: 'center', marginVertical: 16, letterSpacing: 1 },
	dashboardContainer: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 16 },
	card: {
		backgroundColor: '#0096c7', // ポップで鮮やかなネオンブルー
		borderRadius: 28,
		padding: 20,
		marginBottom: 18,
		shadowColor: '#00b4d8',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.35,
		shadowRadius: 10,
		elevation: 8,
	},
	cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
	cardTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },
	subText: { fontSize: 14, color: '#ffffff', fontWeight: '700' },
	periodTabs: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 20, padding: 4, marginBottom: 14 },
	periodBtn: { flex: 1, paddingVertical: 6, borderRadius: 16, alignItems: 'center' },
	periodBtnActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 },
	periodBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },
	periodBtnTextActive: { color: '#03045e' },
	formCard: { 
		backgroundColor: '#ffffff', 
		borderRadius: 28, 
		padding: 22, 
		marginBottom: 30,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 5,
	},
	formTitle: { fontSize: 17, fontWeight: '800', color: '#121214', marginBottom: 14 },
	input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 14, padding: 12, marginBottom: 12, fontSize: 15, backgroundColor: '#fcfcfc', color: '#333' },
	saveButton: { backgroundColor: '#48cae4', padding: 14, borderRadius: 14, alignItems: 'center', shadowColor: '#48cae4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
	saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
})