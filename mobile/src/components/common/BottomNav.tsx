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
 * icon scale. Plugado num navigator via `tabBar={(props) => <BottomNav {...props} />}`.
 *
 * Os ícones/labels são configuráveis por `props` — assim o MESMO visual atende fluxos
 * diferentes: o fluxo do cliente usa os defaults abaixo (`app.routes.tsx`); o fluxo do
 * tatuador passa seu próprio mapa via `ArtistBottomNav` (`artist.routes.tsx`).
 */

const PLUM = '#602C66';
const INK = '#000000';
const CREAM = '#EAE0D5';
const SPRING = { damping: 16, stiffness: 200 } as const;

const CLIENT_ICONS: Record<string, LucideIcon> = {
  Home,
  Chat: MessageCircle,
  Simulador: ScanEye,
  Sessoes: Calendar,
  Settings,
};

const CLIENT_LABELS: Record<string, string> = {
  Home: 'Início',
  Chat: 'Mensagens',
  Simulador: 'Simulador',
  Sessoes: 'Sessões',
  Settings: 'Configurações',
};

interface BottomNavProps extends BottomTabBarProps {
  /** route name → ícone lucide. Default: mapa do cliente. */
  icons?: Record<string, LucideIcon>;
  /** route name → label de acessibilidade. Default: mapa do cliente. */
  labels?: Record<string, string>;
}

function TabIcon({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) {
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

export function BottomNav({
  state,
  descriptors,
  navigation,
  icons = CLIENT_ICONS,
  labels = CLIENT_LABELS,
}: BottomNavProps) {
  const insets = useSafeAreaInsets();

  const focused = state.routes[state.index];
  const focusedStyle = descriptors[focused.key].options.tabBarStyle as { display?: 'none' | 'flex' } | undefined;
  if (focusedStyle?.display === 'none') return null;

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
        const Icon = icons[route.name];
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
                : undefined) ?? labels[route.name] ?? route.name
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
