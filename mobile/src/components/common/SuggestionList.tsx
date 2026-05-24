import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Tag } from 'lucide-react-native';

import { Estilo } from '../../services/api/estiloService';

interface SuggestionListProps {
  suggestions: Estilo[];
  onSelect: (estilo: Estilo) => void;
}

/**
 * Dropdown de sugestoes do autocomplete da barra de busca. Visual segue os
 * tokens semanticos (bg-surface / hairline / fg-2 / plum) — sem cor "hardcoded".
 *
 * Sem altura fixa: deixa o consumidor decidir scroll/overflow (no caso da
 * Home, o ScrollView pai ja rola se a lista for grande).
 */
export function SuggestionList({ suggestions, onSelect }: SuggestionListProps) {
  if (suggestions.length === 0) return null;
  return (
    <View className="bg-surface rounded-r-md overflow-hidden">
      {suggestions.map((s, i) => (
        <TouchableOpacity
          key={s.estiloId}
          activeOpacity={0.7}
          onPress={() => onSelect(s)}
          className={`flex-row items-center px-4 py-3 ${
            i > 0 ? 'border-t border-hairline' : ''
          }`}
        >
          <Tag size={16} color="#602C66" style={{ marginRight: 12 }} />
          <Text className="font-body-medium text-[14px] text-ink flex-1">{s.nome}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
