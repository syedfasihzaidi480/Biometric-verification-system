import React from 'react';
import renderer, { act } from 'react-test-renderer';
import LoginScreen from '../src/screens/LoginScreen';
import * as credentials from '../src/utils/auth/credentials';

jest.mock('../src/utils/auth/credentials', () => ({
  signInWithCredentials: jest.fn(),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows success alert on successful sign in', async () => {
    const spy = jest.spyOn(credentials, 'signInWithCredentials').mockResolvedValue({
      ok: true,
      session: { user: { id: '1' } },
    });

    const tree = renderer.create(<LoginScreen />);

    await act(async () => {
      await credentials.signInWithCredentials({
        identifier: 'test@example.com',
        email: 'test@example.com',
        password: 'password',
        callbackUrl: '/(tabs)',
      });
    });

    expect(spy).toHaveBeenCalledWith({
      identifier: 'test@example.com',
      email: 'test@example.com',
      password: 'password',
      callbackUrl: '/(tabs)',
    });
  });
});
