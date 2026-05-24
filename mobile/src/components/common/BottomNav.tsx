import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Home,
  MessageCircle,
  ScanEye,
  Calendar,
  Settings,
  type LucideIcon,
} from 'lucide-react-native';

/**
 * Bottom navigation (DESIGN.md §8.2 — BottomNav.jsx). Cream surface, 96px tall, no top border;
 * active tab is plum-tinted with an animated underline pill (0 → 18px via spring) and a 1.12
 * icon scale. Plugged into the navigator via `tabBar={(props) => <BottomNav {...props} />}` in
 * `src/routes/app.routes.tsx`.
 *
 * Atualmente 5 abas — Home · Chat · **Simulador** (Bisko AI, killer feature) · Sessões · Settings.
 * Se uma aba nova for adicionada em `app.routes.tsx`, registrar ícone + label nos maps abaixo.
 */

const PLUM = '#602C66';
const INK = '#000000';
const CREAM = '#EAE0D5';
const SPRING = { damping: 16, stiffness: 200 } as const;

// Route name → lucide icon. Anything not in this map is skipped (defensive).
const ICONS: Record<string, LucideIcon> = {
  Home,
  Chat: MessageCircle,
  Simulador: ScanEye,
  Sessoes: Calendar,
  Settings,
};

// Accessibility label per tab — falls back to the route name if missing.
const LABELS: Record<string, string> = {
  Home: 'Início',
  Chat: 'Mensagens',
  Simulador: 'Simulador',
  Sessoes: 'Sessões',
  Settings: 'Configurações',
};

function TabIcon({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) {
  // Single shared progress drives both the icon scale and the underline pill width.
  // Spring (not timing) so taps feel like physical pucks, not switches.
  const progress = useDerivedValue(() => withSpring(focused ? 1 : 0, SPRING));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + progress.value * 0.12 }] }));
  const underlineStyle = useAnimatedStyle(() => ({ width: progress.value * 18 }));
  return (
    <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={iconStyle}>
        <Icon size={26} color={focused ? PLUM : INK} />
      </Animated.View>
      <Animated.View
        style={[
          { position: 'absolute', bottom: 2, height: 3, borderRadius: 2, backgroundColor: PLUM },
          underlineStyle,
        ]}
      />
    </View>
  );
}

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Honor `tabBarStyle: { display: 'none' }` set by the focused screen — the default
  // BottomTabBar handles this automatically, but a custom tabBar has to opt in.
  // Used by ConfirmedScreen to hide the bar during the success state.
  const focused = state.routes[state.index];
  const focusedStyle = descriptors[focused.key].options.tabBarStyle as { display?: 'none' | 'flex' } | undefined;
  if (focusedStyle?.display === 'none') return null;

  // Extend the bar into the safe-area inset on devices with a home indicator or system
  // gesture bar so the icons aren't crowded against the phone's bottom controls. On
  // iPhone the inset itself (~34px) is enough buffer above the home indicator; on
  // Androids without an inset we floor at 6px so the icons aren't flush with the edge.
  // Icon area (height − paddings) stays a constant 58px regardless of device.
  const bottomPad = Math.max(insets.bottom, 6);
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: CREAM,
        height: 72 + bottomPad,
        paddingTop: 14,
        paddingBottom: bottomPad,
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const Icon = ICONS[route.name];
        if (!Icon) return null;

        const { options } = descriptors[route.key];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={
              (typeof options.tabBarAccessibilityLabel === 'string'
                ? options.tabBarAccessibilityLabel
                : undefined) ?? LABELS[route.name] ?? route.name
            }
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.85}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <TabIcon Icon={Icon} focused={focused} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
