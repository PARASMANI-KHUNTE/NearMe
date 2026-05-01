import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  UserPlus, 
  UserMinus, 
  Check, 
  X, 
  MessageCircle,
  ShieldAlert
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useFriendStore } from '../../store/friendStore';
import { api } from '../../services/api';
import type { PendingRequest } from '../../types';

interface SearchResult {
  id: string;
  _id?: string;
  name: string;
  picture?: string;
  uniqueId: string;
}

interface ServerFriend {
  id?: string;
  _id?: string;
  name: string;
  picture?: string;
}

export function FriendsPage() {
  const { friends, setFriends, requests, setRequests, addFriend, removeFriend } = useFriendStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load friends
        const friendsRes = await api.get('/api/friends');
        if (friendsRes.data.data) {
          const mappedFriends = (friendsRes.data.data as ServerFriend[]).map((f) => ({
            id: f.id || f._id || '',
            name: f.name,
            picture: f.picture,
            status: 'offline' as const,
          }));
          setFriends(mappedFriends);
        }

        // Load pending requests
        const requestsRes = await api.get('/api/friends/requests');
        if (requestsRes.data.data) {
          setRequests(requestsRes.data.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, [setFriends, setRequests]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setShowResults(true);
    try {
      const response = await api.get('/api/users/search', {
        params: { q: searchQuery },
      });
      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      await api.post('/api/friends/request', { recipientId: userId });
      setSearchResults(searchResults.filter(r => r._id !== userId));
      setSearchQuery('');
      setShowResults(false);
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string, requesterId: string, requesterName: string) => {
    try {
      await api.post(`/api/friends/request/${requestId}/accept`);
      
      // Add to friends list
      addFriend({
        id: requesterId,
        name: requesterName,
        status: 'offline',
      });
      
      // Remove from requests
      setRequests(requests.filter((r) => r._id !== requestId));
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.post(`/api/friends/request/${requestId}/reject`);
      setRequests(requests.filter((r) => r._id !== requestId));
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleRemoveFriend = async (userId: string) => {
    try {
      await api.delete(`/api/friends/${userId}`);
      removeFriend(userId);
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 text-[var(--text)]">
            <Users className="text-primary w-8 h-8" />
            Friends
          </h1>
          <p className="text-[var(--text-muted)] text-lg font-medium">Manage your friends and requests.</p>
        </div>
        
        <div className="w-full md:w-96 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by NearMe ID..."
            className="w-full glass bg-white/5 border-[var(--border)] border-none rounded-full py-5 pl-14 pr-6 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all font-bold text-sm tracking-tight"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {isLoading && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </header>

      {showResults && searchResults.length > 0 && (
        <Card className="p-4 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">Search Results</h3>
            <button onClick={() => setShowResults(false)} className="text-xs text-[var(--text-muted)]">Close</button>
          </div>
          <div className="space-y-2">
            {searchResults.map((result) => (
              <div key={result.id || result._id} className="flex items-center justify-between p-3 bg-surface rounded-xl">
                <div className="flex items-center gap-3">
                  <img src={result.picture || `https://ui-avatars.com/api/?name=${result.name}&background=random`} alt="" className="w-10 h-10 rounded-xl" />
                  <div>
                    <p className="font-bold text-sm">{result.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{result.uniqueId}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleAddFriend(result.id || result._id || '')}>
                  Add
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Friend Requests - Right Column on large screens */}
        <div className="xl:col-span-4 order-1 xl:order-2 space-y-8">
          <AnimatePresence>
            {requests.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="p-8 border-primary/20 bg-primary/5 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                      <UserPlus className="w-5 h-5 text-primary" />
                      Pending Approval
                    </h2>
                    <span className="bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                      {requests.length} New
                    </span>
                  </div>
                  <div className="space-y-4">
                    {requests.map((request: PendingRequest) => (
                      <div
                        key={request._id}
                        className="flex items-center justify-between p-4 bg-surface rounded-[1.5rem] border border-[var(--border)] group hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={request.requesterId.picture || `https://ui-avatars.com/api/?name=${request.requesterId.name}&background=f59e0b&color=fff`}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <span className="text-sm font-bold tracking-tight">{request.requesterId.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="w-9 h-9 p-0 rounded-xl"
                            onClick={() => handleAcceptRequest(request._id, request.requesterId._id, request.requesterId.name)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="glass"
                            size="sm"
                            className="w-9 h-9 p-0 rounded-xl"
                            onClick={() => handleRejectRequest(request._id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Card className="p-8 border-[var(--border)] bg-surface/30 border-dashed text-center space-y-4 opacity-50">
                <ShieldAlert className="w-10 h-10 mx-auto text-[var(--text-muted)]" />
                <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">No Pending Requests</p>
              </Card>
            )}
          </AnimatePresence>
        </div>

        {/* Friends List - Left Column */}
        <div className="xl:col-span-8 order-2 xl:order-1">
          <Card className="p-8 border-[var(--border)] h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                Friends
              </h2>
              <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest bg-surface px-4 py-2 rounded-full">
                {friends.length} Friends
              </span>
            </div>

            {friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                <div className="w-24 h-24 bg-surface rounded-[2rem] flex items-center justify-center">
                  <UserPlus className="w-10 h-10 text-[var(--text-muted)] opacity-20" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">No Friends Yet</h3>
                  <p className="text-[var(--text-muted)] max-w-xs mx-auto">Search for friends by NearMe ID above.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((friend) => (
                  <motion.div
                    layout
                    key={friend.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between p-5 rounded-[2rem] bg-surface/50 border border-[var(--border)] hover:border-primary/20 hover:bg-surface transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={friend.picture || `https://ui-avatars.com/api/?name=${friend.name}&background=random`}
                          alt=""
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-transparent group-hover:ring-primary/20 transition-all"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-[var(--surface)] rounded-full ${
                          friend.status === 'nearby' ? 'bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-[var(--text-muted)]'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold tracking-tight">{friend.name}</p>
                        <p className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5 uppercase tracking-tighter">
                          {friend.status === 'nearby' ? (
                            <span className="text-primary font-black animate-pulse">● Nearby</span>
                          ) : (
                            <span className="text-[var(--text-muted)] opacity-50">● Offline</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="glass" size="sm" className="w-10 h-10 p-0 rounded-xl">
                          <MessageCircle className="w-4 h-4" />
                       </Button>
                       <Button
                        size="sm"
                        variant="ghost"
                        className="w-10 h-10 p-0 rounded-xl text-error hover:bg-error/10"
                        onClick={() => handleRemoveFriend(friend.id)}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
