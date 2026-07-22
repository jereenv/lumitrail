/**
 * Lumitrail — App shell.
 *
 * Manages first-run onboarding and the main bottom-tab navigation.
 * Deliberately lightweight: navigation state lives in useNavigationStore,
 * no third-party router required.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { palette } from '@/app/theme';
import { useExplorationStore } from '@/app/store/useExplorationStore';
import { useNavigationStore } from '@/app/store/useNavigationStore';
import { TabBar } from '@/presentation/components';
import {
  OnboardingScreen,
  MapScreen,
  StatsScreen,
  AchievementsScreen,
  LeaderboardScreen,
  FriendsScreen,
  SettingsScreen,
} from '@/presentation/screens';

export default function App(): React.ReactElement {
  const { init } = useExplorationStore();
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const activeTab = useNavigationStore((s) => s.activeTab);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);

  useEffect(() => {
    void init();
  }, [init]);

  if (!hasOnboarded) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={() => setHasOnboarded(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          {activeTab === 'map' && <MapScreen />}
          {activeTab === 'stats' && <StatsScreen />}
          {activeTab === 'achievements' && <AchievementsScreen />}
          {activeTab === 'leaderboard' && <LeaderboardScreen />}
          {activeTab === 'friends' && <FriendsScreen />}
          {activeTab === 'settings' && <SettingsScreen />}
        </View>
        <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  content: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
});
