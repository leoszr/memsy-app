import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors, fonts } from '../../src/theme/tokens';

function tabIcon(emoji: string) {
  return function TabIcon({ color }: { color: string }) {
    return <Text style={{ fontSize: 22, color }}>{emoji}</Text>;
  };
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: colors.gameBlue,
        tabBarInactiveTintColor: colors.navyInk,
        tabBarStyle: {
          backgroundColor: colors.chalkWhite,
          borderTopColor: colors.navyInk,
          borderTopWidth: 2.5,
        },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="add"
        options={{
          title: 'Adicionar',
          tabBarIcon: tabIcon('✦'),
          tabBarAccessibilityLabel: 'Adicionar palavra',
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Cards',
          tabBarIcon: tabIcon('🂠'),
          tabBarAccessibilityLabel: 'Meus cards',
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Treinar',
          tabBarIcon: tabIcon('⚡'),
          tabBarAccessibilityLabel: 'Treinar',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progresso',
          tabBarIcon: tabIcon('🔥'),
          tabBarAccessibilityLabel: 'Progresso',
        }}
      />
    </Tabs>
  );
}
