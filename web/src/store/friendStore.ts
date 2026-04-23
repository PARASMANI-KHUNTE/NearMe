import { create } from 'zustand';
import type { FriendState } from '../types';

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  requests: [],

  setFriends: (friends) => set({ friends }),
  addFriend: (friend) => set((state) => ({ friends: [...state.friends, friend] })),
  removeFriend: (id) => set((state) => ({ friends: state.friends.filter((f) => f.id !== id) })),
  setRequests: (requests) => set({ requests }),
}));