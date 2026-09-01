const fs = require('fs');
const file = 'mobile/src/screens/main/ChatScreen.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, FlatList } from 'react-native';`,
  `import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, FlatList, RefreshControl } from 'react-native';`
);

code = code.replace(
  `        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.2}`,
  `        refreshControl={<RefreshControl refreshing={isLoadingMore} onRefresh={loadMoreMessages} />}`
);

fs.writeFileSync(file, code);
