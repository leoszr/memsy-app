import { Tabs } from 'expo-router';
import { colors, fonts } from '../../src/theme/tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
        options={{ title: 'Adicionar', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="cards"
        options={{ title: 'Cards', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="train"
        options={{ title: 'Treinar', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progresso', tabBarIcon: () => null }}
      />
    </Tabs>
  );
}
