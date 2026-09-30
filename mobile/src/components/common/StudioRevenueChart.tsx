import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop, Text as SvgText } from 'react-native-svg';
import { studioDashboardTheme as theme } from '../../theme/studioDashboard';

interface Props {
  daily: { day: number; value: number }[];
  compact?: boolean;
}

export function StudioRevenueChart({ daily, compact = false }: Props) {
  const gradientId = `revenue-${useId().replace(/:/g, '')}`;
  const left = compact ? 2 : 44;
  const top = 12;
  const bottom = compact ? 42 : 138;
  const right = 314;
  const max = Math.max(100, Math.ceil(Math.max(0, ...daily.map((day) => day.value)) / 500) * 500);
  const points = daily.map((day, index) => ({
    x: daily.length === 1 ? (left + right) / 2 : left + index / (daily.length - 1) * (right - left),
    y: bottom - day.value / max * (bottom - top),
  }));
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const first = points[0];
  const last = points[points.length - 1];
  const area = first && last ? `${line} L ${last.x} ${bottom} L ${first.x} ${bottom} Z` : '';
  const labelIndices = [...new Set([0, Math.floor((daily.length - 1) / 2), daily.length - 1])];

  return (
    <View accessible={!compact} accessibilityRole="image"
      accessibilityLabel={`Receita contratada por dia, em reais. ${daily.map((day) => `Dia ${day.day}: ${day.value}`).join('; ')}`}
      accessibilityElementsHidden={compact} importantForAccessibility={compact ? 'no-hide-descendants' : 'auto'}>
      <Svg width="100%" height={compact ? 36 : 190} viewBox={`0 0 320 ${compact ? 48 : 168}`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.purple} stopOpacity={0.22} />
            <Stop offset="1" stopColor={theme.colors.purple} stopOpacity={0.01} />
          </LinearGradient>
        </Defs>
        {!compact && [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = bottom - fraction * (bottom - top);
          const value = max * fraction;
          return <React.Fragment key={fraction}>
            <Line x1={left} x2={right} y1={y} y2={y} stroke={theme.colors.line} strokeDasharray="3 3" />
            <SvgText x={left - 6} y={y + 4} textAnchor="end" fontSize={10} fill={theme.colors.muted}>
              {value >= 1000 ? `${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k` : Math.round(value)}
            </SvgText>
          </React.Fragment>;
        })}
        {area ? <Path d={area} fill={`url(#${gradientId})`} /> : null}
        {line ? <Path d={line} fill="none" stroke={theme.colors.purple} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /> : null}
        {last && <Circle cx={last.x} cy={last.y} r={3.5} fill={theme.colors.purple} stroke={theme.colors.card} strokeWidth={1.5} />}
        {!compact && labelIndices.filter((index) => index >= 0 && index < points.length).map((index) => (
          <SvgText key={index} x={points[index].x} y={160} textAnchor="middle" fontSize={10} fill={theme.colors.muted}>
            {String(daily[index].day).padStart(2, '0')}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
