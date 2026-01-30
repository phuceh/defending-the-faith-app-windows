import 'react-native-gesture-handler';
import React, { useRef, useEffect, useState, createContext, useContext, useMemo } from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Switch,
  Button,
  ScrollView,
  Share,
  Alert,
  TextInput,
  Vibration,
  ActivityIndicator,
  RefreshControl,
  Image,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, useDrawerStatus } from '@react-navigation/drawer';
import questions from './questions';

const Drawer = createDrawerNavigator();

// Subtle theme colors inspired by the icon
const COLORS = {
  navy: '#1e3a5f',
  gold: '#d4af37',
  lightGold: '#e8c878',
  brown: '#6b4423',
  cream: '#f5e6d3',
  lightCream: '#faf6f0',
  darkNavy: '#152840',
  white: '#ffffff',
  lightGray: '#f8f9fa',
  darkGray: '#333333',
  subtleGold: '#f0e5c8',
};

// Question themes mapping
const QUESTION_THEMES = {
  'Foundations of Faith': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  'The Bible': [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  'Jesus Christ': [20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
  'God and Philosophy': [30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
  'The Problem of Evil and Suffering': [40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
  'Cultural and Moral Challenges': [50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
  'World Religions and Beliefs': [60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
  'Atheism, Agnosticism, and Secularism': [70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
  'Doubt, Deconstruction, and Evangelism': [80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
  'Purpose, Meaning, and the Christian Life': [90, 91, 92, 93, 94, 95, 96, 97, 98, 99],
};

// Contexts
const ThemeContext = createContext();
const FontSizeContext = createContext();
const ReadQuestionsContext = createContext();
const FavouritesContext = createContext();
const NotesContext = createContext();
const LastQuestionContext = createContext();

function SplashScreen({ onContinue }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.splashContainer}>
      <Animated.View 
        style={[
          styles.splashContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        {/* Title section at top */}
        <View style={styles.splashTitleSection}>
          <Text style={styles.splashMainTitle}>
            DEFENDING{'\n'}
            <Text style={styles.splashMainTitleSmall}>THE FAITH</Text>
          </Text>
          <Text style={styles.splashSubtitle}>
            An Introduction to Christian Apologetics
          </Text>
        </View>

        {/* Quote section centered */}
        <View style={styles.splashQuoteSection}>
          <Text style={styles.splashTitle}>1 Peter 3:15</Text>
          <Text style={styles.splashVerse}>
            "...But in your hearts revere Christ as Lord. Always be prepared to give an answer to everyone who asks you to give the reason for the hope that you have. But do this with gentleness and respect..."
          </Text>
        </View>
      </Animated.View>

      <View style={{ width: '100%', paddingHorizontal: 20, paddingBottom: 30 }}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => {
            Vibration.vibrate(15);
            onContinue();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function QuestionScreen({ route }) {
  const { Question } = route.params;
  const data = questions[Question];
  const { fontSize } = useContext(FontSizeContext);
  const { isDarkTheme } = useContext(ThemeContext);
  const { readQuestions, addReadQuestion } = useContext(ReadQuestionsContext);
  const { favourites, toggleFavourite } = useContext(FavouritesContext);
  const { notes, updateNote } = useContext(NotesContext);
  const { setLastQuestion } = useContext(LastQuestionContext);
  const drawerStatus = useDrawerStatus();
  const timerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(1)).current;

  const backgroundColor = isDarkTheme ? '#1a1a1a' : COLORS.white;
  const textColor = isDarkTheme ? '#e8e8e8' : COLORS.darkGray;
  const dividerColor = isDarkTheme ? '#404040' : '#e0e0e0';
  const cardBackground = isDarkTheme ? '#2a2a2a' : COLORS.lightGray;
  const inputBackground = isDarkTheme ? '#333' : COLORS.white;

  const isFavourite = favourites.includes(Question);
  const hasNote = notes[Question] && notes[Question].trim().length > 0;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [Question]);

  // Update last viewed question whenever this screen is viewed
  useEffect(() => {
    setLastQuestion(Question);
  }, [Question, setLastQuestion]);

  // Helper function to parse bold text with two formatting options
  const parseTextWithBold = (text) => {
    // Match both **text** (bold + blue) and *text* (bold only)
    // Important: Match ** before * to avoid conflicts
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      // Check for **text** pattern (bold + blue)
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <Text key={index} style={{ fontWeight: '700', color: COLORS.navy, fontSize: fontSize + 1 }}>
            {boldText}
          </Text>
        );
      }
      // Check for *text* pattern (bold only)
      else if (part.startsWith('*') && part.endsWith('*')) {
        const boldText = part.slice(1, -1);
        return (
          <Text key={index} style={{ fontWeight: '700' }}>
            {boldText}
          </Text>
        );
      }
      // Regular text
      return part;
    });
  };

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Only mark as read when drawer is closed (user is actually viewing)
    if (drawerStatus !== 'closed') return;

    // Check if already read
    if (readQuestions.includes(Question)) return;

    timerRef.current = setTimeout(() => {
      addReadQuestion(Question);
      timerRef.current = null;
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [Question, drawerStatus, readQuestions, addReadQuestion]);

  const handleToggleFavourite = () => {
    Vibration.vibrate(20);
    toggleFavourite(Question);
    // Animate star
    Animated.sequence([
      Animated.timing(starScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(starScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleShare = async () => {
    try {
      const message = `Q: ${data.question}\n\nA: ${data.answer}\n\n— Christian Apologetics App`;
      await Share.share({
        message: message,
        title: `Q${Question + 1}: ${data.question}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share this question and answer.');
    }
  };

  const handleShareNote = async () => {
    if (!hasNote) {
      Alert.alert('No Note', 'You haven\'t written any notes for this question yet.');
      return;
    }
    try {
      const message = `My notes on Q${Question + 1}: ${data.question}\n\n${notes[Question]}\n\n— Christian Apologetics App`;
      await Share.share({
        message: message,
        title: `Notes: Q${Question + 1}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share your note.');
    }
  };

  return (
    <SafeAreaView style={[styles.screenContainer, { backgroundColor }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={[styles.questionHeader, { backgroundColor }]}>
          <View style={styles.questionTitleRow}>
            <Text 
              style={[styles.question, { fontSize: fontSize + 4, color: textColor, flex: 1 }]}
              accessible={true}
              accessibilityRole="header"
            >
              {data.question}
            </Text>
            <TouchableOpacity
              onPress={handleToggleFavourite}
              style={styles.favoriteButton}
              accessible={true}
              accessibilityLabel={isFavourite ? "Remove from favourites" : "Add to favourites"}
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <Animated.Text 
                style={[
                  styles.favoriteIcon,
                  { transform: [{ scale: starScale }] }
                ]}
              >
                {isFavourite ? '★' : '☆'}
              </Animated.Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 16 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.contentContainer, { paddingBottom: 40, paddingTop: 8 }]}>
          <Text
            style={[
              styles.answer,
              { fontSize, lineHeight: fontSize * 1.6, color: textColor },
            ]}
            accessible={true}
            accessibilityRole="text"
          >
            {parseTextWithBold(data.answer)}
          </Text>

          <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => {
              Vibration.vibrate(15);
              handleShare();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.shareButtonText}>Share Q&A</Text>
          </TouchableOpacity>

          <View style={[styles.notesContainer, { backgroundColor: cardBackground }]}>
            <Text style={[styles.notesLabel, { color: textColor }]}>Personal Notes:</Text>
            <TextInput
              style={[
                styles.noteInput,
                { 
                  backgroundColor: inputBackground, 
                  color: textColor,
                  fontSize: fontSize - 2,
                  borderColor: dividerColor,
                }
              ]}
              placeholder="Add your personal notes here..."
              placeholderTextColor={isDarkTheme ? '#888' : '#999'}
              value={notes[Question] || ''}
              onChangeText={(text) => updateNote(Question, text)}
              multiline
              scrollEnabled={false}
              accessible={true}
              accessibilityLabel="Personal notes input"
              accessibilityHint="Add your own notes about this question"
            />
            {hasNote && (
              <TouchableOpacity 
                style={[styles.shareNoteButton, { marginTop: 12 }]}
                onPress={() => {
                  Vibration.vibrate(15);
                  handleShareNote();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.shareNoteButtonText}>Share Note</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function QuestionList({ navigation }) {
  const { readQuestions } = useContext(ReadQuestionsContext);
  const { favourites } = useContext(FavouritesContext);
  const { isDarkTheme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const currentThemeIndexRef = useRef(0);

  const backgroundColor = isDarkTheme ? '#1a1a1a' : COLORS.white;
  const textColor = isDarkTheme ? '#e8e8e8' : COLORS.darkGray;
  const inputBackground = isDarkTheme ? '#2a2a2a' : COLORS.white;
  const progress = readQuestions.length / questions.length;

  useEffect(() => {
    loadSearchHistory();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('SEARCH_HISTORY');
      if (history) setSearchHistory(JSON.parse(history));
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 2 && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory.slice(0, 4)];
      setSearchHistory(newHistory);
      AsyncStorage.setItem('SEARCH_HISTORY', JSON.stringify(newHistory));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Vibration.vibrate(10);
    await loadSearchHistory();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Group questions by theme with headers
  const groupedQuestions = useMemo(() => {
    const filtered = questions
      .map((item, index) => ({ ...item, originalIndex: index }))
      .filter((item) => {
        const searchLower = searchQuery.toLowerCase();
        const questionText = item.question.toLowerCase();
        const questionNumber = `q${item.originalIndex + 1}`;
        const matchesSearch = questionText.includes(searchLower) || questionNumber.includes(searchLower);
        const matchesFilter = filterMode === 'all' || favourites.includes(item.originalIndex);
        return matchesSearch && matchesFilter;
      });

    // Create grouped structure with theme headers
    const grouped = [];
    Object.entries(QUESTION_THEMES).forEach(([themeName, questionIndices]) => {
      const themeQuestions = filtered.filter(q => questionIndices.includes(q.originalIndex));
      if (themeQuestions.length > 0) {
        // Add theme header
        grouped.push({ type: 'header', themeName });
        // Add questions
        themeQuestions.forEach(q => grouped.push({ type: 'question', ...q }));
      }
    });

    return grouped;
  }, [searchQuery, filterMode, favourites]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleScroll = (event) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  };

 const scrollToNextTheme = (direction) => {
  if (!flatListRef.current) return;

  Vibration.vibrate(15);

  const visibleThemes = [];
  Object.entries(QUESTION_THEMES).forEach(([themeName, questionIndices]) => {
    const themeQuestions = groupedQuestions.filter(
      (item) => item.type === 'question' && questionIndices.includes(item.originalIndex)
    );
    if (themeQuestions.length > 0) {
      visibleThemes.push(themeName);
    }
  });

  if (visibleThemes.length === 0) return;

  const headerIndices = [];
  groupedQuestions.forEach((item, index) => {
    if (item.type === 'header' && visibleThemes.includes(item.themeName)) {
      headerIndices.push(index);
    }
  });

  if (headerIndices.length === 0) return;

  let newThemeIndex = currentThemeIndexRef.current;

  if (direction === 'up') {
    newThemeIndex = currentThemeIndexRef.current + 1;
    if (newThemeIndex >= headerIndices.length) {
      newThemeIndex = headerIndices.length - 1;
    }
  } else if (direction === 'down') {
    newThemeIndex = currentThemeIndexRef.current - 1;
    if (newThemeIndex < 0) {
      newThemeIndex = 0;
    }
  }

  if (newThemeIndex !== currentThemeIndexRef.current) {
    currentThemeIndexRef.current = newThemeIndex;
    const targetIndex = headerIndices[newThemeIndex];
    
    if (targetIndex !== undefined) {
      flatListRef.current.scrollToIndex({
        index: targetIndex,
        animated: true,
        viewPosition: 0,
      });
    }
  }
};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <View style={[styles.progressContainer, { backgroundColor, borderBottomColor: isDarkTheme ? '#404040' : '#e0e0e0' }]}>
        <Text style={[styles.progressText, { color: textColor }]}>
          {readQuestions.length} / {questions.length} read
        </Text>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: progressWidth },
            ]}
          />
        </View>
      </View>

      <View style={[styles.filterContainer, { backgroundColor, borderBottomColor: isDarkTheme ? '#404040' : '#e0e0e0' }]}>
        <TouchableOpacity
          onPress={() => {
            Vibration.vibrate(10);
            setFilterMode('all');
          }}
          style={[
            styles.filterButton,
            filterMode === 'all' && styles.filterButtonActive,
            { 
              backgroundColor: filterMode === 'all' ? COLORS.navy : (isDarkTheme ? '#2a2a2a' : COLORS.white),
              borderColor: isDarkTheme ? '#404040' : '#e0e0e0',
            }
          ]}
          accessible={true}
          accessibilityLabel="Show all questions"
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <Text style={[
            styles.filterButtonText,
            filterMode === 'all' && styles.filterButtonTextActive,
            { color: filterMode === 'all' ? COLORS.white : textColor }
          ]}>
            All Questions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Vibration.vibrate(10);
            setFilterMode('favourites');
          }}
          style={[
            styles.filterButton,
            filterMode === 'favourites' && styles.filterButtonActive,
            { 
              backgroundColor: filterMode === 'favourites' ? COLORS.navy : (isDarkTheme ? '#2a2a2a' : COLORS.white),
              borderColor: isDarkTheme ? '#404040' : '#e0e0e0',
            }
          ]}
          accessible={true}
          accessibilityLabel={`Show favourites, ${favourites.length} items`}
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <Text style={[
            styles.filterButtonText,
            filterMode === 'favourites' && styles.filterButtonTextActive,
            { color: filterMode === 'favourites' ? COLORS.white : textColor }
          ]}>
            ★ Favourites ({favourites.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor, borderBottomColor: isDarkTheme ? '#404040' : '#e0e0e0' }]}>
        <TextInput
          style={[
            styles.searchInput, 
            { 
              backgroundColor: inputBackground, 
              color: textColor,
              borderColor: isDarkTheme ? '#404040' : '#e0e0e0',
            }
          ]}
          placeholder="Search questions..."
          placeholderTextColor={isDarkTheme ? '#888' : '#999'}
          value={searchQuery}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
          accessible={true}
          accessibilityLabel="Search questions"
          accessibilityHint="Type to search through questions"
        />
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={styles.verticalAccentLine}>
          <TouchableOpacity
            style={styles.scrollButton}
            onPress={() => scrollToNextTheme('up')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Scroll to next theme"
            accessibilityRole="button"
          >
            <Text style={styles.scrollArrow}>▲</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.scrollButton}
            onPress={() => scrollToNextTheme('down')}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Scroll to previous theme"
            accessibilityRole="button"
          >
            <Text style={styles.scrollArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          data={groupedQuestions}
          keyExtractor={(item, index) => item.type === 'header' ? `header-${item.themeName}` : `question-${item.originalIndex}`}
          inverted
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 20 }}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0 });
            });
          }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={isDarkTheme ? '#fff' : COLORS.navy}
            />
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View style={[styles.themeHeader, { backgroundColor: isDarkTheme ? '#1f1f1f' : '#e0e0e0' }]}>
                  <Text style={[styles.themeHeaderText, { color: COLORS.navy }]}>
                    {item.themeName}
                  </Text>
                </View>
              );
            }

            const { originalIndex } = item;
            const isFavourite = favourites.includes(originalIndex);
            const isRead = readQuestions.includes(originalIndex);

            return (
              <TouchableOpacity
                onPress={() => {
                  Vibration.vibrate(10);
                  navigation.navigate(`Question${originalIndex + 1}`, { Question: originalIndex });
                  navigation.closeDrawer();
                }}
                style={[styles.QuestionButton, { borderBottomColor: isDarkTheme ? '#404040' : '#e0e0e0' }]}
                accessible={true}
                accessibilityLabel={`Question ${originalIndex + 1}: ${item.question}${isRead ? ', read' : ', unread'}${isFavourite ? ', favourited' : ''}`}
                accessibilityRole="button"
                accessibilityHint="Double tap to open this question"
                activeOpacity={0.7}
              >
                <View style={styles.questionListRow}>
                  <Text
                    style={[
                      styles.QuestionButtonText,
                      { color: isRead ? '#999' : textColor },
                      { flex: 1 },
                    ]}
                  >
                    <Text style={{ fontWeight: '700' }}>Q{originalIndex + 1}</Text>. {item.question}
                  </Text>
                  {isFavourite && (
                    <Text style={styles.favoriteIndicator}>★</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function StatsScreen() {
  const { readQuestions } = useContext(ReadQuestionsContext);
  const { favourites } = useContext(FavouritesContext);
  const { notes } = useContext(NotesContext);
  const { isDarkTheme } = useContext(ThemeContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const backgroundColor = isDarkTheme ? '#1a1a1a' : COLORS.white;
  const textColor = isDarkTheme ? '#e8e8e8' : COLORS.darkGray;
  const cardBackground = isDarkTheme ? '#2a2a2a' : COLORS.lightGray;
  const percentage = Math.round((readQuestions.length / questions.length) * 100);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Calculate stats for each theme
  const themeStats = useMemo(() => {
    return Object.entries(QUESTION_THEMES).map(([themeName, questionIndices]) => {
      const readInTheme = questionIndices.filter(idx => readQuestions.includes(idx)).length;
      const favouritesInTheme = questionIndices.filter(idx => favourites.includes(idx)).length;
      const notesInTheme = questionIndices.filter(idx => notes[idx] && notes[idx].trim().length > 0).length;
      const totalInTheme = questionIndices.length;
      const percentageRead = Math.round((readInTheme / totalInTheme) * 100);

      return {
        themeName,
        readInTheme,
        favouritesInTheme,
        notesInTheme,
        totalInTheme,
        percentageRead,
      };
    });
  }, [readQuestions, favourites, notes]);

  const shareProgress = async () => {
    try {
      await Share.share({
        message: `I've read ${readQuestions.length} out of ${questions.length} questions (${percentage}%) in the Defending The Faith - Christian Apologetics app!`,
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share progress.');
    }
  };

  const totalNotes = Object.keys(notes).filter(key => notes[key] && notes[key].trim().length > 0).length;

  return (
    <SafeAreaView style={[styles.screenContainer, { backgroundColor }]}>
      <Animated.ScrollView 
        contentContainerStyle={[styles.statsContentContainer, { paddingBottom: 40 }]}
        style={{ opacity: fadeAnim }}
      >
        <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, marginBottom: 20 }}>Your Statistics</Text>

        {/* Overall Stats */}
        {/* Combined Questions Read and Completion */}
        <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
          <Text style={[styles.statLabel, { color: textColor }]}>Questions Read ({percentage}%)</Text>
          <Text style={[styles.statValue, { color: COLORS.navy }]}>
            {readQuestions.length} / {questions.length}
          </Text>
          <View style={[styles.progressBarBackground, { marginTop: 10, width: '100%' }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${percentage}%` },
              ]}
            />
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
          <Text style={[styles.statLabel, { color: textColor }]}>Favourites</Text>
          <Text style={[styles.statValue, { color: COLORS.navy }]}>
            ★ {favourites.length}
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
          <Text style={[styles.statLabel, { color: textColor }]}>Notes Written</Text>
          <Text style={[styles.statValue, { color: COLORS.navy }]}>
            {totalNotes}
          </Text>
        </View>

        {/* Section Breakdown */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: textColor, marginTop: 24, marginBottom: 16 }}>
          Progress by Section
        </Text>

        {themeStats.map((theme, index) => (
          <View key={index} style={[styles.themeStatCard, { backgroundColor: cardBackground }]}>
            <Text style={[styles.themeStatTitle, { color: COLORS.navy }]}>
              {theme.themeName}
            </Text>
            
            <View style={styles.themeStatRow}>
              <Text style={[styles.themeStatLabel, { color: textColor }]}>
                Read: {theme.readInTheme} / {theme.totalInTheme}
              </Text>
              <Text style={[styles.themeStatPercentage, { color: COLORS.navy }]}>
                {theme.percentageRead}%
              </Text>
            </View>
            <View style={[styles.progressBarBackground, { marginTop: 6, width: '100%', height: 6 }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${theme.percentageRead}%`, height: 6 },
                ]}
              />
            </View>

            <View style={styles.themeStatDetails}>
              <Text style={[styles.themeStatDetailText, { color: textColor }]}>
                ★ {theme.favouritesInTheme} favourited
              </Text>
              <Text style={[styles.themeStatDetailText, { color: textColor }]}>
                {theme.notesInTheme} notes
              </Text>
            </View>
          </View>
        ))}

        <TouchableOpacity 
          style={[styles.shareButton, { marginTop: 24 }]}
          onPress={() => {
            Vibration.vibrate(15);
            shareProgress();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.shareButtonText}>Share My Progress</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function SettingsScreen({ navigation }) {
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const { fontSize, setFontSize } = useContext(FontSizeContext);
  const { readQuestions, resetReadQuestions } = useContext(ReadQuestionsContext);
  const { favourites, setFavourites } = useContext(FavouritesContext);
  const { notes, setNotes } = useContext(NotesContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const backgroundColor = isDarkTheme ? '#1a1a1a' : COLORS.white;
  const textColor = isDarkTheme ? '#e8e8e8' : COLORS.darkGray;
  const cardBackground = isDarkTheme ? '#2a2a2a' : COLORS.lightGray;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const resetProgress = () => {
    Vibration.vibrate([0, 50, 50, 50]);
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetReadQuestions();
              navigation.openDrawer();
            } catch (error) {
              console.error('Error resetting progress:', error);
              Alert.alert('Error', 'Failed to reset progress');
            }
          },
        },
      ]
    );
  };

  const resetFavourites = () => {
    Vibration.vibrate([0, 50, 50, 50]);
    Alert.alert(
      'Clear Favourites',
      'Are you sure you want to clear all your favourites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setFavourites([]);
              await AsyncStorage.setItem('FAVOURITES', JSON.stringify([]));
              navigation.openDrawer();
            } catch (error) {
              console.error('Error clearing favourites:', error);
              Alert.alert('Error', 'Failed to clear favourites');
            }
          },
        },
      ]
    );
  };

  const clearAllNotes = () => {
    Vibration.vibrate([0, 50, 50, 50]);
    Alert.alert(
      'Clear All Notes',
      'Are you sure you want to clear all personal notes? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setNotes({});
              await AsyncStorage.setItem('NOTES', JSON.stringify({}));
              navigation.openDrawer();
            } catch (error) {
              console.error('Error clearing notes:', error);
              Alert.alert('Error', 'Failed to clear notes');
            }
          },
        },
      ]
    );
  };

  const exportAllNotes = async () => {
    const notesWithContent = Object.keys(notes).filter(key => notes[key] && notes[key].trim().length > 0);

    if (notesWithContent.length === 0) {
      Alert.alert('No Notes', 'You haven\'t written any notes yet.');
      return;
    }

    try {
      let exportText = 'MY APOLOGETICS NOTES\n';
      exportText += '='.repeat(50) + '\n\n';

      notesWithContent.forEach(questionIndex => {
        const questionData = questions[parseInt(questionIndex)];
        exportText += `Q${parseInt(questionIndex) + 1}: ${questionData.question}\n`;
        exportText += '-'.repeat(50) + '\n';
        exportText += `${notes[questionIndex]}\n\n`;
      });

      exportText += '\n— Exported from Christian Apologetics App';

      await Share.share({
        message: exportText,
        title: 'My Apologetics Notes',
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to export notes.');
    }
  };

  const notesCount = Object.keys(notes).filter(key => notes[key] && notes[key].trim().length > 0).length;

  return (
    <SafeAreaView style={[styles.screenContainer, { backgroundColor }]}>
      <Animated.ScrollView 
        contentContainerStyle={styles.contentContainer}
        style={{ opacity: fadeAnim }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: textColor, marginBottom: 24 }}>Settings</Text>

        <View style={[styles.settingCard, { backgroundColor: cardBackground }]}>
          <View style={styles.settingRow}>
            <Text style={{ color: textColor, fontSize: 16, fontWeight: '600' }}>Dark Theme</Text>
            <Switch 
              value={isDarkTheme} 
              onValueChange={() => {
                Vibration.vibrate(10);
                toggleTheme();
              }}
              trackColor={{ false: '#e0e0e0', true: COLORS.navy }}
              thumbColor={isDarkTheme ? COLORS.white : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.settingCard, { backgroundColor: cardBackground }]}>
          <Text style={{ color: textColor, fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
            Font Size: {fontSize}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={styles.fontButton}
              onPress={() => {
                Vibration.vibrate(10);
                setFontSize((s) => Math.max(12, s - 2));
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.fontButtonText}>A-</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.fontButton}
              onPress={() => {
                Vibration.vibrate(10);
                setFontSize((s) => Math.min(30, s + 2));
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.fontButtonText}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.settingCard, { backgroundColor: cardBackground }]}>
          <Text style={{ color: textColor, fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
            Progress ({readQuestions.length})
          </Text>
          <TouchableOpacity 
            style={styles.settingActionButton}
            onPress={resetProgress}
            activeOpacity={0.7}
          >
            <Text style={styles.settingActionButtonText}>Reset Progress</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.settingCard, { backgroundColor: cardBackground }]}>
          <Text style={{ color: textColor, fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
            Favourites ({favourites.length})
          </Text>
          <TouchableOpacity 
            style={styles.settingActionButton}
            onPress={resetFavourites}
            activeOpacity={0.7}
          >
            <Text style={styles.settingActionButtonText}>Clear Favourites</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.settingCard, { backgroundColor: cardBackground }]}>
          <Text style={{ color: textColor, fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
            Notes ({notesCount})
          </Text>
          <View style={{ gap: 12 }}>
            <TouchableOpacity 
              style={styles.settingActionButton}
              onPress={() => {
                Vibration.vibrate(15);
                exportAllNotes();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.settingActionButtonText}>Export All Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingActionButton}
              onPress={clearAllNotes}
              activeOpacity={0.7}
            >
              <Text style={styles.settingActionButtonText}>Clear All Notes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bible Version Attribution */}
        <View style={[styles.settingCard, { marginTop: 8, backgroundColor: cardBackground }]}>
          <Text style={{ color: textColor, fontSize: 16, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' }}>
            All Bible quotations are taken from the New International Version (NIV)
          </Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [readQuestions, setReadQuestions] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [notes, setNotes] = useState({});
  const [lastQuestion, setLastQuestion] = useState(0);
  const [resetCounter, setResetCounter] = useState(0);
  const navigationRef = useRef();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [storedQuestions, storedTheme, storedFontSize, storedFavourites, storedNotes, storedLastQuestion] = await Promise.all([
          AsyncStorage.getItem('READ_QUESTIONS'),
          AsyncStorage.getItem('DARK_THEME'),
          AsyncStorage.getItem('FONT_SIZE'),
          AsyncStorage.getItem('FAVOURITES'),
          AsyncStorage.getItem('NOTES'),
          AsyncStorage.getItem('LAST_QUESTION'),
        ]);

        if (storedQuestions) setReadQuestions(JSON.parse(storedQuestions));
        if (storedTheme !== null) setIsDarkTheme(JSON.parse(storedTheme));
        if (storedFontSize) setFontSize(JSON.parse(storedFontSize));
        if (storedFavourites) setFavourites(JSON.parse(storedFavourites));
        if (storedNotes) setNotes(JSON.parse(storedNotes));
        if (storedLastQuestion !== null) setLastQuestion(JSON.parse(storedLastQuestion));
      } catch (error) {
        console.error('Error loading settings:', error);
        Alert.alert('Error', 'Failed to load saved settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [resetCounter]);

  useEffect(() => {
    AsyncStorage.setItem('READ_QUESTIONS', JSON.stringify(readQuestions)).catch(error => {
      console.error('Error saving read questions:', error);
    });
  }, [readQuestions]);

  useEffect(() => {
    AsyncStorage.setItem('FAVOURITES', JSON.stringify(favourites)).catch(error => {
      console.error('Error saving favourites:', error);
    });
  }, [favourites]);

  useEffect(() => {
    AsyncStorage.setItem('DARK_THEME', JSON.stringify(isDarkTheme)).catch(error => {
      console.error('Error saving theme:', error);
    });
  }, [isDarkTheme]);

  useEffect(() => {
    AsyncStorage.setItem('FONT_SIZE', JSON.stringify(fontSize)).catch(error => {
      console.error('Error saving font size:', error);
    });
  }, [fontSize]);

  useEffect(() => {
    AsyncStorage.setItem('NOTES', JSON.stringify(notes)).catch(error => {
      console.error('Error saving notes:', error);
    });
  }, [notes]);

  useEffect(() => {
    AsyncStorage.setItem('LAST_QUESTION', JSON.stringify(lastQuestion)).catch(error => {
      console.error('Error saving last question:', error);
    });
  }, [lastQuestion]);

  const toggleTheme = () => setIsDarkTheme((prev) => !prev);

  const toggleFavourite = (questionIndex) => {
    setFavourites((prev) =>
      prev.includes(questionIndex)
        ? prev.filter((idx) => idx !== questionIndex)
        : [...prev, questionIndex]
    );
  };

  const addReadQuestion = (questionIndex) => {
    setReadQuestions((prev) => {
      if (prev.includes(questionIndex)) {
        return prev;
      }
      return [...prev, questionIndex];
    });
  };

  const updateNote = (questionIndex, text) => {
    setNotes((prev) => ({
      ...prev,
      [questionIndex]: text,
    }));
  };

  const resetReadQuestions = async () => {
    try {
      await AsyncStorage.setItem('READ_QUESTIONS', JSON.stringify([]));
      setReadQuestions([]);
      setResetCounter(prev => prev + 1);
    } catch (error) {
      console.error('Error resetting read questions:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <ActivityIndicator size="large" color={COLORS.navy} />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (isSplashVisible) {
    return <SplashScreen onContinue={() => setIsSplashVisible(false)} />;
  }

  return (
    <ThemeContext.Provider value={{ isDarkTheme, toggleTheme }}>
      <ReadQuestionsContext.Provider value={{ readQuestions, addReadQuestion, resetReadQuestions, setReadQuestions }}>
        <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
          <FavouritesContext.Provider value={{ favourites, setFavourites, toggleFavourite }}>
            <NotesContext.Provider value={{ notes, updateNote, setNotes }}>
              <LastQuestionContext.Provider value={{ lastQuestion, setLastQuestion }}>
                <NavigationContainer ref={navigationRef} key={resetCounter}>
                  <Drawer.Navigator
                    drawerContent={(props) => <QuestionList {...props} />}
                    defaultStatus="open"
                    screenOptions={({ route, navigation }) => {
                      const isSettings = route.name === 'Settings';
                      const isStats = route.name === 'Statistics';
                      const currentQuestion = isSettings || isStats
                        ? null
                        : parseInt(route.name.replace('Question', '')) - 1;

                      const headerBackground = isDarkTheme ? '#1a1a1a' : COLORS.white;
                      const headerTextColor = isDarkTheme ? '#e8e8e8' : COLORS.navy;
                      const isOnQuestionScreen = !isSettings && !isStats;

                      return {
                        header: () => (
                          <View style={[styles.headerWrapper, { backgroundColor: headerBackground, borderBottomColor: isDarkTheme ? '#404040' : '#e0e0e0' }]}>
                            <SafeAreaView style={[styles.headerSafeArea, { backgroundColor: headerBackground }]}>
                              <View style={styles.headerTopRow}>
                                <View style={styles.headerLeftButtons}>
                                  <TouchableOpacity 
                                    onPress={() => {
                                      Vibration.vibrate(10);
                                      navigation.openDrawer();
                                    }}
                                    accessible={true}
                                    accessibilityLabel="Open menu"
                                    accessibilityRole="button"
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[styles.menuIcon, { color: headerTextColor }]}>☰</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity 
                                    onPress={() => {
                                      Vibration.vibrate(10);
                                      const questionToNavigate = lastQuestion + 1;
                                      navigation.navigate(`Question${questionToNavigate}`, { Question: lastQuestion });
                                    }}
                                    accessible={true}
                                    accessibilityLabel="Go to last read question"
                                    accessibilityRole="button"
                                    activeOpacity={0.7}
                                    disabled={isOnQuestionScreen}
                                    style={styles.bookIconButton}
                                  >
                                    <Image
                                      source={require('./assets/book-icon.png')}
                                      style={[
                                        styles.bookIcon,
                                        { 
                                          tintColor: headerTextColor,
                                          opacity: isOnQuestionScreen ? 0.4 : 1
                                        }
                                      ]}
                                      resizeMode="contain"
                                    />
                                  </TouchableOpacity>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 15 }}>
                                  <TouchableOpacity 
                                    onPress={() => {
                                      Vibration.vibrate(10);
                                      navigation.navigate('Statistics');
                                    }}
                                    accessible={true}
                                    accessibilityLabel="View statistics"
                                    accessibilityRole="button"
                                    activeOpacity={0.7}
                                    disabled={isStats}
                                  >
                                    <Image
                                      source={require('./assets/statistics-icon.png')}
                                      style={[
                                        styles.headerIcon,
                                        { 
                                          tintColor: headerTextColor,
                                          opacity: isStats ? 0.4 : 1
                                        }
                                      ]}
                                    />
                                  </TouchableOpacity>

                                  <TouchableOpacity 
                                    onPress={() => {
                                      Vibration.vibrate(10);
                                      navigation.navigate('Settings');
                                    }}
                                    accessible={true}
                                    accessibilityLabel="Open settings"
                                    accessibilityRole="button"
                                    activeOpacity={0.7}
                                    disabled={isSettings}
                                  >
                                    <Image
                                      source={require('./assets/settings-icon.png')}
                                      style={[
                                        styles.headerIcon,
                                        { 
                                          tintColor: headerTextColor,
                                          opacity: isSettings ? 0.4 : 1
                                        }
                                      ]}
                                    />
                                  </TouchableOpacity>
                                </View>
                              </View>

                              {!isSettings && !isStats && (
                                <>
                                  {/* Navigation row with centered question number */}
                                  <View style={styles.headerBottomRow}>
                                    <TouchableOpacity
                                      onPress={() => {
                                        if (currentQuestion > 0) {
                                          Vibration.vibrate(10);
                                          navigation.navigate(`Question${currentQuestion}`, {
                                            Question: currentQuestion - 1,
                                          });
                                        }
                                      }}
                                      disabled={currentQuestion === 0}
                                      accessible={true}
                                      accessibilityLabel="Previous question"
                                      accessibilityRole="button"
                                      activeOpacity={0.7}
                                    >
                                      <Text
                                        style={[
                                          styles.navButton,
                                          { color: currentQuestion === 0 ? '#ccc' : headerTextColor },
                                        ]}
                                      >
                                        Previous
                                      </Text>
                                    </TouchableOpacity>

                                    <View style={styles.questionNumberCentered}>
                                      <Text style={[styles.headerSubtitle, { color: headerTextColor }]}>
                                        Q{currentQuestion + 1}
                                      </Text>
                                    </View>

                                    <TouchableOpacity
                                      onPress={() => {
                                        if (currentQuestion < questions.length - 1) {
                                          Vibration.vibrate(10);
                                          navigation.navigate(`Question${currentQuestion + 2}`, {
                                            Question: currentQuestion + 1,
                                          });
                                        }
                                      }}
                                      disabled={currentQuestion === questions.length - 1}
                                      accessible={true}
                                      accessibilityLabel="Next question"
                                      accessibilityRole="button"
                                      activeOpacity={0.7}
                                    >
                                      <Text
                                        style={[
                                          styles.navButton,
                                          {
                                            color:
                                              currentQuestion === questions.length - 1
                                                ? '#ccc'
                                                : headerTextColor,
                                          },
                                        ]}
                                      >
                                        Next
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                </>
                              )}
                            </SafeAreaView>
                          </View>
                        ),
                        drawerType: 'slide',
                      };
                    }}
                  >
                    {questions.map((q, i) => (
                      <Drawer.Screen
                        key={i}
                        name={`Question${i + 1}`}
                        component={QuestionScreen}
                        initialParams={{ Question: i }}
                        options={{ drawerLabel: `Q${i + 1}. ${q.question}` }}
                      />
                    ))}
                    <Drawer.Screen name="Statistics" component={StatsScreen} />
                    <Drawer.Screen name="Settings" component={SettingsScreen} />
                  </Drawer.Navigator>
                </NavigationContainer>
              </LastQuestionContext.Provider>
            </NotesContext.Provider>
          </FavouritesContext.Provider>
        </FontSizeContext.Provider>
      </ReadQuestionsContext.Provider>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  contentContainer: { flexGrow: 1, padding: 24 },
  statsContentContainer: { 
    flexGrow: 1, 
    padding: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  questionHeader: { padding: 24, paddingBottom: 12 },
  questionTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  favoriteButton: { 
    paddingLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: { 
    fontSize: 32, 
    color: COLORS.navy,
    lineHeight: 32,
    textAlignVertical: 'center',
  },
  mainTitle: { 
    fontSize: 28, 
    fontWeight: '700', 
    textAlign: 'center', 
    letterSpacing: 0.3,
    color: COLORS.navy,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  titleBanner: {
    backgroundColor: COLORS.navy,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '600', 
    textAlign: 'center', 
    letterSpacing: 0.2,
    color: COLORS.darkGray,
  },
  headerSubtitle: { 
    fontSize: 28, 
    textAlign: 'center', 
    fontWeight: '600',
    marginTop: -4,
  },
  questionNumberCentered: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  question: { fontWeight: '700', marginBottom: 4, letterSpacing: 0.2, flex: 1 },
  answer: { marginTop: 0, letterSpacing: 0.3 },
  QuestionButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  questionListRow: { flexDirection: 'row', alignItems: 'center' },
  QuestionButtonText: { fontSize: 16, letterSpacing: 0.2 },
  favoriteIndicator: { fontSize: 20, color: COLORS.navy, marginLeft: 8 },
  themeHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.navy,
  },
  themeHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerWrapper: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerSafeArea: {},
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  headerLeftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookIconButton: {
    padding: 2,
  },
  bookIcon: {
    width: 32,
    height: 32,
  },
  headerMiddle: { alignItems: 'center', marginVertical: 12 },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
    position: 'relative',
  },
  navButton: { fontSize: 16, paddingHorizontal: 12, fontWeight: '600' },
  menuIcon: { fontSize: 32 },
  headerIcon: {
    width: 32,
    height: 32,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 10,
    paddingTop: 90,
  },
  splashContent: { 
    flex: 1,
    justifyContent: 'flex-start', 
    alignItems: 'center', 
    paddingHorizontal: 10,
    width: '100%',
  },
  splashTitleSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  splashQuoteSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  splashTitleBanner: {
    backgroundColor: COLORS.navy,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  splashMainTitle: {
    fontSize: 35,
    fontWeight: '700',
    color: COLORS.navy,
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  splashMainTitleSmall: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
    letterSpacing: 0.3,
  },
  splashSubtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.darkGray,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  splashTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    marginBottom: 16, 
    color: COLORS.navy, 
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  splashVerse: { 
    fontSize: 18, 
    fontStyle: 'italic', 
    textAlign: 'center', 
    lineHeight: 28, 
    color: COLORS.darkGray, 
    letterSpacing: 0.2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  settingActionButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  settingActionButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  progressContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressText: { fontSize: 14, marginBottom: 8, textAlign: 'center', fontWeight: '600', letterSpacing: 0.3 },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: { 
    height: '100%', 
    backgroundColor: COLORS.navy,
    borderRadius: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: { 
    backgroundColor: COLORS.navy, 
    borderColor: COLORS.navy,
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  filterButtonText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  filterButtonTextActive: { color: COLORS.white, fontWeight: '700' },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 44,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  verticalAccentLine: {
    width: 32,
    backgroundColor: COLORS.navy,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  scrollButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollArrow: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '700',
  },
  notesContainer: {
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  noteInput: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    maxHeight: 300,
    textAlignVertical: 'top',
    fontSize: 15,
    lineHeight: 22,
  },
  shareNoteButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shareNoteButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statCard: {
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontSize: 15,
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  themeStatCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  themeStatTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  themeStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  themeStatLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeStatPercentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  themeStatDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  themeStatDetailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,  // Changed from 18 to 16
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  shareButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  shareButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  fontButton: {
    flex: 1,
    backgroundColor: COLORS.navy,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  fontButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});