import { useNavigationStore } from './useNavigationStore';

beforeEach(() => {
  useNavigationStore.setState({ activeTab: 'map', focusTarget: null });
});

test('setActiveTab switches tab', () => {
  useNavigationStore.getState().setActiveTab('stats');
  expect(useNavigationStore.getState().activeTab).toBe('stats');
});

test('focusMap sets the target and jumps to the map tab', () => {
  const target = {
    latitude: 51.5,
    longitude: -0.1,
    latitudeDelta: 0.4,
    longitudeDelta: 0.8,
    label: 'London',
  };
  useNavigationStore.getState().setActiveTab('stats');
  useNavigationStore.getState().focusMap(target);
  expect(useNavigationStore.getState().focusTarget).toEqual(target);
  expect(useNavigationStore.getState().activeTab).toBe('map');
});

test('clearMapFocus resets only the focus', () => {
  useNavigationStore
    .getState()
    .focusMap({ latitude: 1, longitude: 2, latitudeDelta: 0.1, longitudeDelta: 0.1 });
  useNavigationStore.getState().clearMapFocus();
  expect(useNavigationStore.getState().focusTarget).toBeNull();
  expect(useNavigationStore.getState().activeTab).toBe('map');
});
