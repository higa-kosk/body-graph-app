import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import Svg, { Path, Circle, Line, Text as SvgText, Rect, G } from 'react-native-svg'

interface RecordItem {
	recorded_at: string
	weight: number
	body_fat: number
	steps: number
}

interface DualAxisChartProps {
	records: RecordItem[]
	showWeight: boolean
	showBodyFat: boolean
	showSteps?: boolean
}

export default function DualAxisChart({ records, showWeight, showBodyFat, showSteps = true }: DualAxisChartProps) {

	const screenWidth = Dimensions.get('window').width
	const svgWidth = screenWidth > 600 ? 520 : screenWidth - 64
	const svgHeight = 210

	// 余白の定義（左：体重用軸、右：体脂肪率用軸、上下：ラベル用）
	const paddingLeft = 40
	const paddingRight = 40
	const paddingTop = 20
	const paddingBottom = 35

	const chartWidth = svgWidth - paddingLeft - paddingRight
	const chartHeight = svgHeight - paddingTop - paddingBottom

	if (!records || records.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<Text style={styles.emptyText}>データがまだありません</Text>
			</View>
		)
	}

	// データの抽出
	const weights = records.map((r) => r.weight)
	const bodyFats = records.map((r) => r.body_fat)
	const stepsList = records.map((r) => r.steps || 0)

	// --- 1. 左軸（体重）の最大値・最小値の計算（上下に少しマージンを持たせる） ---
	const minWeight = weights.length > 0 ? Math.floor(Math.min(...weights) - 1) : 50
	const maxWeight = weights.length > 0 ? Math.ceil(Math.max(...weights) + 1) : 80
	const weightRange = maxWeight - minWeight || 1

	// --- 2. 右軸（体脂肪率）の最大値・最小値の計算 ---
	const minBodyFat = bodyFats.length > 0 ? Math.floor(Math.min(...bodyFats) - 2) : 10
	const maxBodyFat = bodyFats.length > 0 ? Math.ceil(Math.max(...bodyFats) + 2) : 30
	const bodyFatRange = maxBodyFat - minBodyFat || 1

	const maxSteps = Math.max(10000, ...stepsList)

	// X座標の計算関数（均等配置）
	const getX = (index: number) => {
		if (records.length === 1) return paddingLeft + chartWidth / 2
		return paddingLeft + (index / (records.length - 1)) * chartWidth
	}

	// Y座標の計算関数（体重用：左軸）
	const getYWeight = (val: number) => {
		return paddingTop + chartHeight - ((val - minWeight) / weightRange) * chartHeight
	}

	// Y座標の計算関数（体脂肪率用：右軸）
	const getYBodyFat = (val: number) => {
		return paddingTop + chartHeight - ((val -minBodyFat) / bodyFatRange) * chartHeight
	}

	// 折れ線パス（d属性）を生成するヘルパー
	const createPath = (data: number[], getY: (v: number) => number) => {
		return data.reduce((acc, val, i) => {
			const x = getX(i)
			const y = getY(val)
			return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`
		}, '')
	}

	// グリッド線の目盛り数（例：4分割）
	const gridSteps = 3
	const barWidth = Math.max(6, Math.min(18, (chartWidth / records.length) * 0.4))

	return (

		<View style={styles.container}>
			<Svg width={svgWidth} height={svgHeight}>

				{/* グリッド線 */}
				{Array.from({ length: gridSteps + 1 }).map((_, i) => {
					const ratio = i / gridSteps
					const y = paddingTop + chartHeight * ratio
					// 左軸の値（体重）
					const weightVal = maxWeight - weightRange * ratio
					// 右軸の値（体脂肪率）
					const bodyFatVal = maxBodyFat - bodyFatRange * ratio

					return (
						<React.Fragment key={i}>
							{/*横のグリッド線 */}
							<Line 
								x1={paddingLeft} 
								y1={y} 
								x2={paddingLeft + chartWidth} 
								y2={y} 
								stroke='rgba(255, 255, 255, 0.15)'
								strokeDasharray='4.4'
								strokeWidth='1' 
							/>

							{/* 左軸ラベル */}
							<SvgText x={paddingLeft - 6} y={y + 4} fontSize='10' fill='rgba(255, 255, 255, 0.7)' textAnchor='end' fontWeight='600'>
								{weightVal.toFixed(1)}
							</SvgText>

							{/* 右軸ラベル */}
							<SvgText x={paddingLeft + chartWidth + 6} y={y + 4} fontSize='10' fill='rgba(255, 255, 255, 0.7)' textAnchor='start' fontWeight='600'>
								{bodyFatVal.toFixed(1)}
							</SvgText>
						</React.Fragment>
					)
				})}

				{/* X軸（日付）ラベル */}
				{records.map((r, i) => {
					const step = Math.ceil(records.length / 6)
					if (i % step !== 0 && i !== records.length - 1) return null

					const x = getX(i)
					const d = new Date(r.recorded_at)
					const label = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`
					return (
							<SvgText key={i} x={x} y={svgHeight - 8} fontSize='10' fill='rgba(255, 255, 255, 0.7)' textAnchor='middle' fontWeight='600'>
								{label}
							</SvgText>
					)
				})}

				{/* 歩数バー（背景） */}
				{showSteps &&
					records.map((r, i) => {
						const steps = r.steps || 0
						const x = getX(i)
						const barHeightRatio = Math.min(1, steps / maxSteps)
						const maxBarAreaHeight = chartHeight * 0.4
						const barH = barHeightRatio * maxBarAreaHeight
						const barY = paddingTop + chartHeight - barH

						return (
							<Rect
								key={`steps-bar-${i}`}
								x={x - barWidth / 2}
								y={barY}
								width={barWidth}
								height={barH}
								fill='rgba(255, 255, 255, 0.2)'
								rx='4'
							/>
						)
					})}

				{/* 体脂肪率の折れ線（ポップなイエロー系） */}
				{showBodyFat && bodyFats.length > 0 && (
					<>
						<Path d={createPath(bodyFats, getYBodyFat)} fill='none' stroke='#ffd166' strokeWidth='3' strokeLinecap='round' />
						{bodyFats.map((val, i) => (
							<Circle key={`bf-${i}`} cx={getX(i)} cy={getYBodyFat(val)} r='4' fill='#ffd166' stroke='#0096c7' strokeWidth='2' />
						))}
					</>
				)}

				{/* 体重の折れ線（クリーンなホワイト） */}
				{showWeight && weights.length > 0 && (
					<>
						<Path d={createPath(weights, getYWeight)} fill='none' stroke='#ffffff' strokeWidth='3' strokeLinecap='round' />
						{weights.map((val, i) => (
							<Circle key={`w-${i}`} cx={getX(i)} cy={getYWeight(val)} r='4.5' fill='#ffffff' stroke='#0096c7' strokeWidth='2' />
						))}
					</>
				)}
			</Svg>
		</View>
	)
}

// 円グラフ（Current body composition）
interface PieChartProps {
	weight: number
	bodyFatPercentage: number
}

export function BodyCompositionPieChart({ weight, bodyFatPercentage }:PieChartProps) {
	if (!weight || weight <= 0) {
		return (
			<View style={styles.pieEmpty}>
				<Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>データを入力してください</Text>
			</View>
		)
	}

	const bodyFatKg = (weight * (bodyFatPercentage || 0)) / 100
	const leanMass = weight - bodyFatKg
	const muscleMassKg = leanMass * 0.65
	const othersKg = leanMass * 0.35

	const size = 150
	const center = size / 2
	const radius = 65

	const getCoordinatesForPercent = (percent: number) => {
		const x = center + radius * Math.cos(2 * Math.PI * percent)
		const y = center + radius * Math.sin(2 * Math.PI * percent)
		return [x, y]
	}

	const slices = [
		{ percent: muscleMassKg / weight, color: '#48cae4', label: 'Muscle', value: muscleMassKg },
		{ percent: bodyFatKg / weight, color: '#ffd166', label: 'Body fat', value: bodyFatKg },
		{ percent: othersKg / weight, color: '#90e0ef', label: 'Others', value: othersKg },
	]

	let cumulativePercent = 0

	return (

		<View style={styles.pieContainer}>
			
			<Svg width={size} height={size}>
				<G transform={`rotate(-90 ${center} ${center})`}>
					{slices.map((slice, i) => {
						const [startX, startY] = getCoordinatesForPercent(cumulativePercent)
						cumulativePercent += slice.percent
						const [endX, endY] = getCoordinatesForPercent(cumulativePercent)
						const largeArcFlag = slice.percent > 0.5 ? 1 : 0

						const pathData = [
							`M ${center} ${center}`,
							`L ${startX} ${startY}`,
							`A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
							'Z',
						].join(' ')

						return <Path key={i} d={pathData} fill={slice.color} stroke='#0096c7' strokeWidth='1.5' />
					})}
				</G>
			</Svg>

			<View style={styles.pieLegend}>
				{slices.map((s, i) => (
					<View key={i} style={styles.legendItem}>
						<View style={[styles.colorBox, { backgroundColor: s.color }]} />
						<Text style={styles.legendText}>
							{s.label}: <Text style={{ fontWeight: 'bold' }}>{s.value.toFixed(1)}kg</Text>
						</Text>
					</View>
				))}
			</View>
		</View>
	)
}


const styles = StyleSheet.create({
	container: { alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
	emptyContainer: { height: 140, justifyContent: 'center', alignItems: 'center' },
	emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
	pieContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', paddingHorizontal: 4 },
	pieEmpty: { height: 120, justifyContent: 'center', alignItems: 'center' },
	pieLegend: { justifyContent: 'center', gap: 8, paddingLeft: 8 },
	legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	colorBox: { width: 14, height: 14, borderRadius: 7 },
	legendText: { color: '#ffffff', fontSize: 13, fontWeight: '500' },
})