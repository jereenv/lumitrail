/**
 * RequestCard — component unit tests.
 *
 * Covers:
 *   - Renders the fromPlayerId name
 *   - Pressing Accept calls onAccept
 *   - Pressing Decline calls onDecline
 *
 * Note: render() is async in @testing-library/react-native v14+ (React 19).
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import RequestCard from './RequestCard';
import type { FriendRequest } from '@/domain/social/friendship';

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const REQUEST: FriendRequest = {
  id: 'req-1',
  fromPlayerId: 'alexplay',
  toPlayerId: 'me',
  status: 'pending',
  createdAt: 1700000000000,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RequestCard', () => {
  it('renders the fromPlayerId name', async () => {
    const { getByText } = await render(
      <RequestCard request={REQUEST} onAccept={jest.fn()} onDecline={jest.fn()} />,
    );
    expect(getByText('alexplay')).toBeTruthy();
  });

  it('calls onAccept when the Accept button is pressed', async () => {
    const onAccept = jest.fn();
    const { getByTestId } = await render(
      <RequestCard request={REQUEST} onAccept={onAccept} onDecline={jest.fn()} />,
    );
    fireEvent.press(getByTestId('request-accept-req-1'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('calls onDecline when the Decline button is pressed', async () => {
    const onDecline = jest.fn();
    const { getByTestId } = await render(
      <RequestCard request={REQUEST} onAccept={jest.fn()} onDecline={onDecline} />,
    );
    fireEvent.press(getByTestId('request-decline-req-1'));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });
});
