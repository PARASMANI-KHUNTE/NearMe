export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  uniqueId?: string;
}

export interface Friend {
  id: string;
  name: string;
  status: 'offline' | 'nearby';
  picture?: string;
}

export interface PendingRequest {
  _id: string;
  requesterId: {
    _id: string;
    name: string;
    picture?: string;
    uniqueId?: string;
  };
  status: 'pending';
}

export interface Notification {
  id: string;
  type: 'proximity_alert' | 'friend_request' | 'friend_accepted' | 'meet_request';
  message: string;
  read: boolean;
  createdAt: string;
  from?: User;
}

export interface GeoPosition {
  lat: number;
  lng: number;
}

export interface FriendZoneData {
  id: string;
  name: string;
  approximateLocation: GeoPosition;
  distance?: number;
}

export interface RouteData {
  geometry: [number, number][];
  distance: number;
  duration: number;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export interface LocationState {
  shareLocation: boolean;
  radius: number;
  preciseSharing: boolean;
  setShareLocation: (share: boolean) => void;
  setRadius: (radius: number) => void;
  setPreciseSharing: (precise: boolean) => void;
  invisibleMode: boolean;
  setInvisibleMode: (invisible: boolean) => void;
}

export interface FriendState {
  friends: Friend[];
  requests: PendingRequest[];
  setFriends: (friends: Friend[]) => void;
  addFriend: (friend: Friend) => void;
  removeFriend: (id: string) => void;
  setRequests: (requests: PendingRequest[]) => void;
}

export interface NotificationState {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
}
