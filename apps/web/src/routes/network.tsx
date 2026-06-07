import { createFileRoute, Link } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { useSession } from '@collabswipe/auth/client';
import { ChevronLeft, UserPlus, UserCheck, Users } from 'lucide-react';

export const Route = createFileRoute('/network')({
  validateSearch: (search: Record<string, unknown>): { userId?: string, tab?: 'followers' | 'following' | 'requests' | 'connections' | 'connectionRequests' } => {
    return {
      userId: search.userId as string | undefined,
      tab: (search.tab as 'followers' | 'following' | 'requests' | 'connections' | 'connectionRequests') || 'followers',
    };
  },
  component: NetworkPage,
});

function NetworkPage() {
  const { userId, tab } = Route.useSearch();
  const { data: session } = useSession();
  const loggedInUserId = session?.user?.id;
  const targetId = userId || loggedInUserId || '';

  const { data: profile } = trpc.profile.getByUserId.useQuery(
    { userId: targetId },
    { enabled: !!targetId }
  );

  const { data: followersData, isLoading: isLoadingFollowers } = trpc.connection.getFollowers.useQuery(
    { userId: targetId },
    { enabled: !!targetId && tab === 'followers' }
  );

  const { data: followingData, isLoading: isLoadingFollowing } = trpc.connection.getFollowing.useQuery(
    { userId: targetId },
    { enabled: !!targetId && tab === 'following' }
  );

  const { data: requestsData, isLoading: isLoadingRequests } = trpc.connection.getFollowRequests.useQuery(
    { userId: targetId },
    { enabled: !!targetId && tab === 'requests' && targetId === loggedInUserId }
  );

  const { data: connectionsData, isLoading: isLoadingConnections } = trpc.connection.getMyConnections.useQuery(
    { userId: targetId },
    { enabled: !!targetId && tab === 'connections' }
  );

  const { data: connectionRequestsData, isLoading: isLoadingConnectionRequests } = trpc.connection.getPendingRequests.useQuery(
    { userId: targetId },
    { enabled: !!targetId && tab === 'connectionRequests' && targetId === loggedInUserId }
  );

  const followMutation = trpc.connection.follow.useMutation({
    onSuccess: () => {
      // Invalidate queries or optimistic update
    }
  });

  const utils = trpc.useUtils();
  const acceptRequest = trpc.connection.acceptFollowRequest.useMutation({
    onSuccess: () => {
      utils.connection.getFollowRequests.invalidate();
      utils.connection.getFollowers.invalidate();
      utils.profile.getByUserId.invalidate();
    }
  });
  const rejectRequest = trpc.connection.rejectFollowRequest.useMutation({
    onSuccess: () => {
      utils.connection.getFollowRequests.invalidate();
    }
  });

  const respondConnection = trpc.connection.respond.useMutation({
    onSuccess: () => {
      utils.connection.getPendingRequests.invalidate();
      utils.connection.getMyConnections.invalidate();
    }
  });

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/profile" search={{ userId: targetId }} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="font-black text-xl text-foreground">
            {profile?.user?.name} {profile?.user?.surname}
          </h1>
          <p className="text-sm text-muted-foreground">@{profile?.user?.username}</p>
        </div>
      </div>

      <div className="flex border-b border-border mb-6 overflow-x-auto no-scrollbar">
        <Link 
          to="/network" 
          search={{ userId: targetId, tab: 'followers' }}
          className={`shrink-0 px-4 py-3 font-semibold transition-colors border-b-2 ${tab === 'followers' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          {profile?.user?._count?.followers || 0} Takipçi
        </Link>
        <Link 
          to="/network" 
          search={{ userId: targetId, tab: 'following' }}
          className={`shrink-0 px-4 py-3 font-semibold transition-colors border-b-2 ${tab === 'following' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          {profile?.user?._count?.following || 0} Takip Edilen
        </Link>
        <Link 
          to="/network" 
          search={{ userId: targetId, tab: 'connections' }}
          className={`shrink-0 px-4 py-3 font-semibold transition-colors border-b-2 ${tab === 'connections' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Bağlantılar
        </Link>
        {targetId === loggedInUserId && (
          <Link 
            to="/network" 
            search={{ userId: targetId, tab: 'requests' }}
            className={`shrink-0 px-4 py-3 font-semibold transition-colors border-b-2 ${tab === 'requests' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Takip İstekleri {requestsData && requestsData.length > 0 ? `(${requestsData.length})` : ''}
          </Link>
        )}
        {targetId === loggedInUserId && (
          <Link 
            to="/network" 
            search={{ userId: targetId, tab: 'connectionRequests' }}
            className={`shrink-0 px-4 py-3 font-semibold transition-colors border-b-2 ${tab === 'connectionRequests' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Bağlantı İstekleri {connectionRequestsData && connectionRequestsData.length > 0 ? `(${connectionRequestsData.length})` : ''}
          </Link>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        {tab === 'followers' && isLoadingFollowers && <p className="text-center py-8 text-muted-foreground">Yükleniyor...</p>}
        {tab === 'followers' && followersData?.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-bold text-lg">Takipçi Yok</h3>
            <p className="text-muted-foreground">Henüz takipçisi bulunmuyor.</p>
          </div>
        )}
        {tab === 'followers' && followersData?.map((item) => (
          <div key={item.follower.id} className="flex items-center justify-between p-3 hover:bg-muted/40 rounded-xl transition-colors">
            <Link to="/profile" search={{ userId: item.follower.id }} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden shrink-0 border border-border/40">
                <img src={item.follower.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${item.follower.name}`} alt={item.follower.name || ''} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-foreground truncate hover:underline">{item.follower.name} {item.follower.surname}</h4>
                <p className="text-xs text-muted-foreground truncate">@{item.follower.name?.toLowerCase()}</p>
              </div>
            </Link>
            {loggedInUserId !== item.follower.id && (
              <button 
                onClick={() => followMutation.mutate({ followerId: loggedInUserId || '', followingId: item.follower.id })}
                className="shrink-0 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-1.5 rounded-full font-bold text-xs transition-colors ml-2"
              >
                Takip Et
              </button>
            )}
          </div>
        ))}

        {tab === 'following' && isLoadingFollowing && <p className="text-center py-8 text-muted-foreground">Yükleniyor...</p>}
        {tab === 'following' && followingData?.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-bold text-lg">Takip Edilen Yok</h3>
            <p className="text-muted-foreground">Henüz kimseyi takip etmiyor.</p>
          </div>
        )}
        {tab === 'following' && followingData?.map((item) => (
          <div key={item.following.id} className="flex items-center justify-between p-3 hover:bg-muted/40 rounded-xl transition-colors">
            <Link to="/profile" search={{ userId: item.following.id }} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden shrink-0 border border-border/40">
                <img src={item.following.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${item.following.name}`} alt={item.following.name || ''} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-foreground truncate hover:underline">{item.following.name} {item.following.surname}</h4>
                <p className="text-xs text-muted-foreground truncate">@{item.following.name?.toLowerCase()}</p>
              </div>
            </Link>
            {loggedInUserId !== item.following.id && (
              <button 
                className="shrink-0 bg-secondary text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground px-4 py-1.5 rounded-full font-bold text-xs transition-colors ml-2"
              >
                Takip Ediliyor
              </button>
            )}
          </div>
        ))}

        {tab === 'requests' && targetId === loggedInUserId && isLoadingRequests && <p className="text-center py-8 text-muted-foreground">Yükleniyor...</p>}
        {tab === 'requests' && targetId === loggedInUserId && requestsData?.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-bold text-lg">İstek Yok</h3>
            <p className="text-muted-foreground">Bekleyen takip isteğiniz bulunmuyor.</p>
          </div>
        )}
        {tab === 'requests' && targetId === loggedInUserId && requestsData?.map((item) => (
          <div key={item.follower.id} className="flex items-center justify-between p-3 hover:bg-muted/40 rounded-xl transition-colors">
            <Link to="/profile" search={{ userId: item.follower.id }} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden shrink-0 border border-border/40">
                <img src={item.follower.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${item.follower.name}`} alt={item.follower.name || ''} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-foreground truncate hover:underline">{item.follower.name} {item.follower.surname}</h4>
                <p className="text-xs text-muted-foreground truncate">@{item.follower.name?.toLowerCase()}</p>
              </div>
            </Link>
            <div className="flex items-center gap-2 ml-2">
              <button 
                onClick={() => acceptRequest.mutate({ followerId: item.follower.id, followingId: loggedInUserId })}
                disabled={acceptRequest.isLoading}
                className="shrink-0 bg-primary text-primary-foreground hover:opacity-90 px-4 py-1.5 rounded-full font-bold text-xs transition-colors"
              >
                Onayla
              </button>
              <button 
                onClick={() => rejectRequest.mutate({ followerId: item.follower.id, followingId: loggedInUserId })}
                disabled={rejectRequest.isLoading}
                className="shrink-0 bg-secondary text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground px-4 py-1.5 rounded-full font-bold text-xs transition-colors"
              >
                Reddet
              </button>
            </div>
          </div>
        ))}

        {tab === 'connections' && isLoadingConnections && <p className="text-center py-8 text-muted-foreground">Yükleniyor...</p>}
        {tab === 'connections' && connectionsData?.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-bold text-lg">Bağlantı Yok</h3>
            <p className="text-muted-foreground">Henüz bağlantı kurulmamış.</p>
          </div>
        )}
        {tab === 'connections' && connectionsData?.map((conn) => {
          const user = conn.requesterId === targetId ? conn.addressee : conn.requester;
          return (
            <div key={user.id} className="flex items-center justify-between p-3 hover:bg-muted/40 rounded-xl transition-colors">
              <Link to="/profile" search={{ userId: user.id }} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden shrink-0 border border-border/40">
                  <img src={user.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} alt={user.name || ''} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-foreground truncate hover:underline">{user.name} {user.surname}</h4>
                  <p className="text-xs text-muted-foreground truncate">@{user.username || user.name?.toLowerCase()}</p>
                </div>
              </Link>
            </div>
          );
        })}

        {tab === 'connectionRequests' && targetId === loggedInUserId && isLoadingConnectionRequests && <p className="text-center py-8 text-muted-foreground">Yükleniyor...</p>}
        {tab === 'connectionRequests' && targetId === loggedInUserId && connectionRequestsData?.length === 0 && (
          <div className="text-center py-12">
            <UserPlus className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-bold text-lg">Bağlantı İsteği Yok</h3>
            <p className="text-muted-foreground">Bekleyen bağlantı isteğiniz bulunmuyor.</p>
          </div>
        )}
        {tab === 'connectionRequests' && targetId === loggedInUserId && connectionRequestsData?.map((item) => (
          <div key={item.requester.id} className="flex items-center justify-between p-3 hover:bg-muted/40 rounded-xl transition-colors">
            <Link to="/profile" search={{ userId: item.requester.id }} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden shrink-0 border border-border/40">
                <img src={item.requester.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${item.requester.name}`} alt={item.requester.name || ''} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-foreground truncate hover:underline">{item.requester.name} {item.requester.surname}</h4>
                <p className="text-xs text-muted-foreground truncate">@{item.requester.username || item.requester.name?.toLowerCase()}</p>
              </div>
            </Link>
            <div className="flex items-center gap-2 ml-2">
              <button 
                onClick={() => respondConnection.mutate({ requesterId: item.requester.id, addresseeId: loggedInUserId, status: "ACCEPTED" })}
                disabled={respondConnection.isLoading}
                className="shrink-0 bg-primary text-primary-foreground hover:opacity-90 px-4 py-1.5 rounded-full font-bold text-xs transition-colors"
              >
                Kabul Et
              </button>
              <button 
                onClick={() => respondConnection.mutate({ requesterId: item.requester.id, addresseeId: loggedInUserId, status: "REJECTED" })}
                disabled={respondConnection.isLoading}
                className="shrink-0 bg-secondary text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground px-4 py-1.5 rounded-full font-bold text-xs transition-colors"
              >
                Reddet
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
