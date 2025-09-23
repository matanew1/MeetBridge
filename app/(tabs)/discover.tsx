@@ .. @@
 import { useUserStore } from '../../store';
 import ProfileDetail from '../components/ProfileDetail';
+import MatchModal from '../components/MatchModal';
 import { useTheme } from '../../contexts/ThemeContext';
 import { lightTheme, darkTheme } from '../../constants/theme';
 import '../../i18n';
@@ .. @@
   const [selectedProfile, setSelectedProfile] = useState(null);
   const [showProfileDetail, setShowProfileDetail] = useState(false);
   const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
   const [unmatchProfileId, setUnmatchProfileId] = useState<string | null>(null);
+  const [showMatchModal, setShowMatchModal] = useState(false);
+  const [matchedUser, setMatchedUser] = useState(null);

   // Animation values
@@ .. @@
     loadConversations,
     createConversation,
+    currentUser,
   } = useUserStore();
@@ .. @@
   const handleLike = (profileId: string) => {
-    likeProfile(profileId);
+    likeProfile(profileId).then((isMatch) => {
+      if (isMatch) {
+        // Find the matched user
+        const matchedUserData = discoverProfiles.find(p => p.id === profileId);
+        if (matchedUserData) {
+          setMatchedUser(matchedUserData);
+          setShowMatchModal(true);
+        }
+      }
+    });
     handleCloseProfile();
   };
@@ .. @@
     setUnmatchProfileId(null);
   };

+  const handleStartChatting = () => {
+    setShowMatchModal(false);
+    if (matchedUser) {
+      createConversation(matchedUser.id);
+      // Navigate to chat tab
+      // You can add navigation logic here if needed
+    }
+  };
+
+  const handleCloseMatchModal = () => {
+    setShowMatchModal(false);
+    setMatchedUser(null);
+  };
+
   const renderEmptyState = (type: 'loved' | 'matches') => (
@@ .. @@
           </View>
         </View>
       )}
+
+      {/* Match Modal */}
+      <MatchModal
+        visible={showMatchModal}
+        onClose={handleCloseMatchModal}
+        onStartChatting={handleStartChatting}
+        matchedUser={matchedUser}
+        currentUser={currentUser}
+      />
     </View>
   );
 }