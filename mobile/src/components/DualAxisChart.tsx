import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import Svg, { Path, Circle, Line, Text as SvgText, Rect } from 'react-native-svg'

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
}

export default function DualAxisChart({ records, showWeight, showBodyFat}: DualAxisChartProps) {

	const screenWidth = Dimensions.get('window').width
	const svgWidth = screenWidth > 600 ? 560 : screenWidth - 32
	const svgHeight = 280

	// 余白の定義（左：体重用軸、右：体脂肪率用軸、上下：ラベル用）
	const paddingLeft = 55
	const paddingRight = 55
	const paddingTop = 20
	const paddingBottom = 40

	const chartWidth = svgWidth - paddingLeft - paddingRight
	const chartHeight = svgHeight - paddingTop - paddingBottom

	if (!records || records.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<Text style={styles.emptyText}>データがありません</Text>
			</View>
		)
	}

	// データの抽出
	const weights = records.map((r) => r.weight)
	const bodyFats = records.map((r) => r.body_fat)

	// --- 1. 左軸（体重）の最大値・最小値の計算（上下に少しマージンを持たせる） ---
	const minWeight = weights.length > 0 ? Math.min(...weights) - 1 : 50
	const maxWeight = weights.length > 0 ? Math.max(...weights) + 1 : 80
	const weightRange = maxWeight - minWeight || 1

	// --- 2. 右軸（体脂肪率）の最大値・最小値の計算 ---
	const minBodyFat = bodyFats.length > 0 ? Math.min(...bodyFats) - 2 : 10
	const maxBodyFat = bodyFats.length > 0 ? Math.max(...bodyFats) + 2 : 30
	const bodyFatRange = maxBodyFat - minBodyFat || 1

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
	const gridSteps = 4

	return (

		<View style={styles.container}>
			<Svg width={svgWidth} height={svgHeight}>
				{/* 背景と枠線 */}
				<Rect x={paddingLeft} y={paddingTop} width={chartWidth} height={chartHeight} fill='#fff' stroke='#e1e4e8' strokeWidth='1' />

				{/* 横グリッド線 & 左軸・右軸の数値ラベル */}
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
							<Line x1={paddingLeft} y1={y} x2={paddingLeft + chartWidth} y2={y} stroke='#f0f3f6' strokeWidth='1' />

							{/* 左軸ラベル（体重：青系） */}
							<SvgText x={paddingLeft - 8} y={y + 4} fontSize='10' fill='#666' textAnchor='end'>
								{weightVal.toFixed(1)}
							</SvgText>

							{/* 右軸ラベル（体脂肪率：オレンジ系） */}
							<SvgText x={paddingLeft + chartWidth + 8} y={y + 4} fontSize='10' fill='#666' textAnchor='start'>
								{bodyFatVal.toFixed(1)}
							</SvgText>
						</React.Fragment>
					)
				})}

				{/* X軸（日付）ラベル */}
				{records.map((r, i) => {
					const x = getX(i)
					const d = new Date(r.recorded_at)
					const label = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`
					return (
						<React.Fragment key={i}>
							<Line x1={x} y1={paddingTop} x2={x} y2={paddingTop + chartHeight} stroke='#f8f9fa' strokeWidth='1' />
							<SvgText x={x} y={svgHeight - 12} fontSize='10' fill='#666' textAnchor='middle'>
								{label}
							</SvgText>
						</React.Fragment>
					)
				})}

				{/* 体脂肪率の折れ線 & ドット（オレンジ / 右軸基準） */}
				{showBodyFat && bodyFats.length > 0 && (
					<>
						<Path d={createPath(bodyFats, getYBodyFat)} fill='none' stroke='#fd7e14' strokeWidth='2.5' />
						{bodyFats.map((val, i) => {
							<Circle key={`bf-${i}`} cx={getX(i)} cy={getYBodyFat(val)} r='4' fill='#fd7e14' stroke='#fff' strokeWidth='1.5' />
						})}
					</>
				)}

				{/* 体重の折れ線 & ドット（青 / 左軸基準） */}
				{showWeight && weights.length > 0 && (
					<>
						<Path d={createPath(weights, getYWeight)} fill='none' stroke='#007aff' strokeWidth='2.5' />
						{weights.map((val, i) => {
							<Circle key={`w-${i}`} cx={getX(i)} cy={getYWeight(val)} r='4.5' fill='#007aff' stroke='#fff' strokeWidth='1.5' />
						})}
					</>
				)}
			</Svg>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: 8,
	},
	emptyContainer: {
		height: 200,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyText: {
		color: '#666',
		fontSize: 14,
	},
})