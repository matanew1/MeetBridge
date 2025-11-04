// Example: How to add skeleton loaders to your screens

// 1. In search.tsx (Discovery Screen)
import { DiscoveryScreenSkeleton } from '../components/ui';

// Add loading state check:
if (isLoadingDiscover && discoverProfiles.length === 0) {
return <DiscoveryScreenSkeleton />;
}

// ---

// 2. In chat.tsx (Chat List)
import { ChatScreenSkeleton } from '../components/ui';

if (isLoading) {
return <ChatScreenSkeleton />;
}

// ---

// 3. In connections.tsx (Connections Grid)
import { ConnectionsGridSkeleton } from '../components/ui';

if (isLoading && connections.length === 0) {
return <ConnectionsGridSkeleton />;
}

// ---

// 4. In chat/[id].tsx (Individual Messages)
import { MessageSkeleton } from '../components/ui';

// While messages are loading, show skeleton:
{messages.length === 0 && isLoading ? (
<View>
<MessageSkeleton isFromCurrentUser={false} />
<MessageSkeleton isFromCurrentUser={true} />
<MessageSkeleton isFromCurrentUser={false} />
</View>
) : (
<FlatList
    data={messages}
    renderItem={renderMessage}
  />
)}

// ---

// 5. For Profile Detail Modal
import { ProfileDetailSkeleton } from '../components/ui';

if (isLoadingProfile) {
return <ProfileDetailSkeleton />;
}
