import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
  addMonths,
  subMonths,
  startOfMonth,
  getDay,
  getDaysInMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  format,
  setDate,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Month-grid date picker (DESIGN.md §8.8 — CalendarMini.jsx): cream surface, month nav chevrons,
 * 7-column grid. Selected day = plum-filled circle + white text; today = bold ink underline;
 * days before `minDate` are muted and not selectable. Sunday-first, pt-BR labels.
 */
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const PLUM = '#602C66';

interface CalendarMiniProps {
  selectedDate?: Date | null;
  onSelectDate?: (date: Date) => void;
  /** earliest selectable day (inclusive); defaults to today */
  minDate?: Date;
}

export function CalendarMini({ selectedDate, onSelectDate, minDate }: CalendarMiniProps) {
  const floor = startOfDay(minDate ?? new Date());
  const [viewMonth, setViewMonth] = React.useState(() => startOfMonth(selectedDate ?? new Date()));

  const monthStart = startOfMonth(viewMonth);
  const leading = getDay(monthStart); // 0 = Sunday
  const daysInMonth = getDaysInMonth(viewMonth);
  const cells: (number | null)[] = [
    ...Array(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const canGoBack = !isBefore(subMonths(monthStart, 1), startOfMonth(floor));

  return (
    <View className="bg-surface rounded-rd-lg p-4">
      {/* month nav */}
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity
          onPress={() => canGoBack && setViewMonth((m) => subMonths(m, 1))}
          disabled={!canGoBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
        >
          <ChevronLeft size={18} color={canGoBack ? '#000000' : '#6B6B6B'} />
        </TouchableOpacity>
        <Text className="font-body-semibold text-[14px] text-ink capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: ptBR })}
        </Text>
        <TouchableOpacity
          onPress={() => setViewMonth((m) => addMonths(m, 1))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
        >
          <ChevronRight size={18} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* weekday header */}
      <View className="flex-row mb-1">
        {WEEKDAYS.map((w, i) => (
          <View key={i} className="flex-1 items-center">
            <Text className="font-body text-[11px] text-fg-3">{w}</Text>
          </View>
        ))}
      </View>

      {/* day grid */}
      <View className="flex-row flex-wrap">
        {cells.map((day, i) => {
          if (day == null) return <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          const date = setDate(viewMonth, day);
          const disabled = isBefore(startOfDay(date), floor);
          const selected = !!selectedDate && isSameDay(date, selectedDate);
          const today = isToday(date);
          return (
            <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} className="p-0.5">
              <TouchableOpacity
                disabled={disabled}
                onPress={() => onSelectDate?.(date)}
                activeOpacity={0.8}
                className="flex-1 items-center justify-center rounded-rd-pill"
                style={{ backgroundColor: selected ? PLUM : 'transparent' }}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
              >
                <Text
                  className={`text-[12px] ${selected ? 'font-body-medium text-white' : today ? 'font-body-bold text-ink' : 'font-body-medium text-ink'}`}
                  style={{
                    opacity: disabled ? 0.35 : 1,
                    textDecorationLine: today && !selected ? 'underline' : 'none',
                  }}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}
