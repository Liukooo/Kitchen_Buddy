import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="addIngredient"
        options={{
          title: 'Add Ingredient',
          tabBarIcon: ({ color,  focused }) => <IconSymbol size={28} name={focused ? 'plus.circle.fill' : 'plus.circle'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expiringSoonIngredient"
        options={{
          title: 'Expiring soon',
          tabBarIcon: ({ color,  focused }) => <IconSymbol size={28} name={focused ? 'hourglass.bottomhalf.fill' : 'hourglass'} color={color} />,
        }}
      />
      <Tabs.Screen
        name="infoIngredient"
        options={{
          title: 'More Info',
          tabBarIcon: ({ color,  focused }) => <IconSymbol size={28} name={focused ? 'info.circle.fill' : 'info.circle'} color={color} />,
        }}
      />
    </Tabs>
  );
}
