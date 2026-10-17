import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react-native';
import {
  addMonths,
  subMonths,
  startOfMonth,
  getDay,
  getDaysInMonth,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
  format,
  setDate,
  setYear,
  setMonth,
  getYear,
  getMonth,
} from 'date-fns';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const PLUM = '#602C66';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
  currentValue?: string; // Formato "dd/mm/aaaa"
  maxDate?: Date;
  minDate?: Date;
}

function DatePickerDialog({
  onClose,
  onSelectDate,
  currentValue,
  maxDate = new Date(),
  minDate = new Date(1920, 0, 1),
}: Omit<DatePickerModalProps, 'visible'>) {
  // Parse initial date from "dd/mm/aaaa"
  const parsedInitialDate = useMemo(() => {
    if (!currentValue) return null;
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(currentValue.trim());
    if (!match) return null;
    const [, d, m, y] = match;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(date.getTime()) ? null : date;
  }, [currentValue]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(parsedInitialDate);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    if (parsedInitialDate) return startOfMonth(parsedInitialDate);
    const defaultPast = new Date();
    defaultPast.setFullYear(defaultPast.getFullYear() - 20);
    return startOfMonth(defaultPast);
  });
  const [mode, setMode] = useState<'calendar' | 'year' | 'month'>('calendar');

  const currentYear = getYear(viewMonth);
  const currentMonthIdx = getMonth(viewMonth);

  const startDay = startOfDay(maxDate);
  const minDay = startOfDay(minDate);

  const monthStart = startOfMonth(viewMonth);
  const leading = getDay(monthStart);
  const daysInMonth = getDaysInMonth(viewMonth);

  const cells: (number | null)[] = [
    ...Array(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Anos disponíveis: do ano atual até 1920
  const years = useMemo(() => {
    const end = getYear(maxDate);
    const start = getYear(minDate);
    const res: number[] = [];
    for (let y = end; y >= start; y--) {
      res.push(y);
    }
    return res;
  }, [maxDate, minDate]);

  const handleSelectDay = (day: number) => {
    const d = setDate(viewMonth, day);
    if (!isAfter(startOfDay(d), startDay) && !isBefore(startOfDay(d), minDay)) {
      setSelectedDate(d);
    }
  };

  const handleConfirm = () => {
    if (selectedDate) {
      const formatted = format(selectedDate, 'dd/MM/yyyy');
      onSelectDate(formatted);
    }
    onClose();
  };

  const canGoBack = !isBefore(subMonths(monthStart, 1), startOfMonth(minDay));
  const canGoForward = !isAfter(startOfMonth(addMonths(monthStart, 1)), startOfMonth(startDay));

  return (
    <Pressable
      className="flex-1 bg-black/60 justify-center items-center p-5"
      onPress={onClose}
    >
      <Pressable
        className="w-full max-w-[360px] bg-paper rounded-rd-lg p-5 shadow-lg"
        onPress={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3 border-b border-hairline pb-3">
          <View className="flex-row items-center">
            <CalendarIcon size={20} color={PLUM} style={{ marginRight: 8 }} />
            <Text className="font-body-bold text-[16px] text-ink">
              Data de nascimento
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={8} accessibilityLabel="Fechar">
            <X size={20} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Seletores de Mês e Ano */}
        <View className="flex-row items-center justify-between mb-4 bg-surface rounded-rd-md p-2">
          <TouchableOpacity
            onPress={() => canGoBack && setViewMonth((m) => subMonths(m, 1))}
            disabled={!canGoBack || mode !== 'calendar'}
            className="p-1"
            accessibilityLabel="Mês anterior"
          >
            <ChevronLeft size={20} color={canGoBack && mode === 'calendar' ? '#000000' : '#A0A0A0'} />
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setMode((m) => (m === 'month' ? 'calendar' : 'month'))}
              className="px-2 py-1 bg-paper/60 rounded-rd-xs"
            >
              <Text className="font-body-bold text-[14px] text-ink capitalize">
                {MONTHS[currentMonthIdx]}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode((m) => (m === 'year' ? 'calendar' : 'year'))}
              className="px-2 py-1 bg-paper/60 rounded-rd-xs"
            >
              <Text className="font-body-bold text-[14px] text-ink">
                {currentYear}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => canGoForward && setViewMonth((m) => addMonths(m, 1))}
            disabled={!canGoForward || mode !== 'calendar'}
            className="p-1"
            accessibilityLabel="Próximo mês"
          >
            <ChevronRight size={20} color={canGoForward && mode === 'calendar' ? '#000000' : '#A0A0A0'} />
          </TouchableOpacity>
        </View>

        {/* Modo Seleção de Ano */}
        {mode === 'year' && (
          <View style={{ height: 240 }}>
            <Text className="font-body text-[12px] text-fg-3 mb-2 text-center">
              Selecione o ano de nascimento
            </Text>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap justify-between">
                {years.map((y) => {
                  const isSelectedYear = y === currentYear;
                  return (
                    <TouchableOpacity
                      key={y}
                      onPress={() => {
                        setViewMonth((prev) => setYear(prev, y));
                        setMode('calendar');
                      }}
                      style={{ width: '23%', marginBottom: 8 }}
                      className={`py-2 rounded-rd-xs items-center ${
                        isSelectedYear ? 'bg-plum' : 'bg-surface'
                      }`}
                    >
                      <Text
                        className={`font-body-medium text-[13px] ${
                          isSelectedYear ? 'text-white font-body-bold' : 'text-ink'
                        }`}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Modo Seleção de Mês */}
        {mode === 'month' && (
          <View style={{ height: 240 }}>
            <Text className="font-body text-[12px] text-fg-3 mb-2 text-center">
              Selecione o mês de nascimento
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {MONTHS.map((m, idx) => {
                const isSelected = idx === currentMonthIdx;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => {
                      setViewMonth((prev) => setMonth(prev, idx));
                      setMode('calendar');
                    }}
                    style={{ width: '31%', marginBottom: 10 }}
                    className={`py-3 rounded-rd-xs items-center ${
                      isSelected ? 'bg-plum' : 'bg-surface'
                    }`}
                  >
                    <Text
                      className={`font-body-medium text-[13px] ${
                        isSelected ? 'text-white font-body-bold' : 'text-ink'
                      }`}
                    >
                      {m.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Modo Calendário (Grid de Dias) */}
        {mode === 'calendar' && (
          <View>
            <View className="flex-row mb-2">
              {WEEKDAYS.map((w, i) => (
                <View key={i} className="flex-1 items-center">
                  <Text className="font-body text-[11px] text-fg-3">{w}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {cells.map((day, i) => {
                if (day == null) {
                  return <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
                }

                const date = setDate(viewMonth, day);
                const isFuture = isAfter(startOfDay(date), startDay);
                const isPastMin = isBefore(startOfDay(date), minDay);
                const disabled = isFuture || isPastMin;
                const selected = !!selectedDate && isSameDay(date, selectedDate);

                return (
                  <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} className="p-0.5">
                    <TouchableOpacity
                      disabled={disabled}
                      onPress={() => handleSelectDay(day)}
                      activeOpacity={0.7}
                      className="flex-1 items-center justify-center rounded-rd-pill"
                      style={{ backgroundColor: selected ? PLUM : 'transparent' }}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled }}
                    >
                      <Text
                        className={`text-[13px] ${
                          selected
                            ? 'font-body-bold text-white'
                            : 'font-body-medium text-ink'
                        }`}
                        style={{ opacity: disabled ? 0.25 : 1 }}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Rodapé com Data Selecionada e Ações */}
        <View className="mt-4 pt-3 border-t border-hairline flex-row items-center justify-between">
          <View>
            <Text className="font-body text-[11px] text-fg-3">Data selecionada:</Text>
            <Text className="font-body-bold text-[14px] text-ink">
              {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Nenhuma'}
            </Text>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onClose}
              className="px-3 py-2 rounded-rd-md bg-surface"
            >
              <Text className="font-body-medium text-[13px] text-ink">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!selectedDate}
              style={{ backgroundColor: selectedDate ? PLUM : '#C0B3C4' }}
              className="px-4 py-2 rounded-rd-md"
            >
              <Text className="font-body-bold text-[13px] text-white">Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Pressable>
  );
}

export function DatePickerModal(props: DatePickerModalProps) {
  if (!props.visible) return null;

  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      onRequestClose={props.onClose}
    >
      <DatePickerDialog {...props} />
    </Modal>
  );
}
