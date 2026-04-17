import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pause, Play, RefreshCw, Settings, SkipForward } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const COMBOS = [

  "Jab, Cross", 
  "Jab, Jab, Cross", 
  "1, 2, 3, 2", 
  "Lead Hook, Cross", 
  "1, 2, Lead Uppercut",
  "1, 2, Left Body Hook",
  "1, 6, 3, 2",
  "2, 3, 2",
  "1, 2, 1, 2",
  "1, 2 Body, 3 Head",
  
  "1, 2, Slip Right, 2",
  "1, Roll Right, 2, 3",
  "Slip Left, 5, 2, 3",
  "1, 2, Pull, 2",
  "1, 2, 3, Roll Left, 3",
  "1, 1, 2, Slip Right, 6",
  "Slip Right, 2, 3, 2",
  "Slip Left, 3, 2, 5",
  "1, 2, Block Left, 3, 2",
  "Pull, 2, 3, 2",

  "1, 2, 3, 4",
  "1, Rear Body Hook, 3, 2",
  "2, 3, 2, Lead Body Hook",
  "1, 2, 5, 2",
  "1, 1 Body, 1 Head, 2",
  "1, 2, 3 Body, Roll Right, 2",

  "1, 2, 3, Pivot Left",
  "Duck Left, Left Body Hook, 3, 2",
  "1, 2, Step Back, 2",
  "Slip Right, 6, 3, 2",
  "1, 2, 3, Step Right, 2",
  "1, 2, Pivot Left, 2, 3",
  "Double Jab, Step Back, 2, 3, 2"
];

export default function HomeScreen() {

  // states
  const [round, setRound] = useState(1);
  const [totalRounds, setRounds] = useState(12);
  const [seconds, setSeconds] = useState(120);
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [currentCombo, setCurrentCombo] = useState("READY TO BOX?");
  const [menuVisible, setMenuVisible] = useState(false);

  // refs 
  const secondsRef = useRef(120);
  const isSpeakingRef = useRef(false);
  const lastComboTimeRef = useRef(120);
  const COMBO_GAP = 2.5;

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  // logic for phase switching + round progression
  const handlePhaseSwitch = useCallback(() => {
    if (!isResting) {
      Speech.speak("Rest", { rate: 1.0 });
      setIsResting(true);
      setSeconds(15);
      setCurrentCombo("BREATHE");
    } else {
      if (round < totalRounds) {
        const nextRound = round + 1;
        setRound(nextRound);
        setIsResting(false);
        setSeconds(120);
        lastComboTimeRef.current = 120;
        Speech.speak(`Round ${nextRound}`, { rate: 1.0 });
        setCurrentCombo("WORK!");
      } else {
        setIsActive(false);
        Speech.speak("Workout complete", { rate: 1.0 });
        setCurrentCombo("FINISHED");
      }
    }
  }, [isResting, round, totalRounds]);

  // timer
  useEffect(() => {
    let interval: any = null;

    if (isActive) {
      interval = window.setInterval(() => {
          if (secondsRef.current > 0) {
            setSeconds((prev) => prev - 1);
          } else {
            handlePhaseSwitch();
            return;
          }

        const timeSinceLastComboFinish = lastComboTimeRef.current - secondsRef.current;

        if (
          !isResting && 
          !isSpeakingRef.current && 
          timeSinceLastComboFinish >= COMBO_GAP &&
          secondsRef.current > 5
        ) {
          triggerCombo();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isResting, handlePhaseSwitch]);

  const triggerCombo = () => {
    const randomCombo = COMBOS[Math.floor(Math.random() * COMBOS.length)];
    setCurrentCombo(randomCombo);
    isSpeakingRef.current = true;
    Speech.speak(randomCombo, {
      rate: 1.4,
      onDone: () => {
        isSpeakingRef.current = false;
        lastComboTimeRef.current = secondsRef.current;
      },
      onError: () => {
        isSpeakingRef.current = false;
        lastComboTimeRef.current = secondsRef.current;
      }
    });
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsResting(false);
    setRound(1);
    setSeconds(120);
    secondsRef.current = 120;
    lastComboTimeRef.current = 120;
    setCurrentCombo("READY TO BOX?");
    Speech.stop();
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <ThemedText style={styles.logoText}>FIGHT STATE</ThemedText>
          <View style={styles.liveBadge}>
            <ThemedText style={styles.liveBadgeText}>LIVE SESSION</ThemedText>
          </View>
        </View>

        <View style={styles.roundRow}>
          <View style={styles.cogPlaceholder} />
          <ThemedText style={styles.roundTitle}>
            ROUND {round} OF {totalRounds}
          </ThemedText>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.cogButton}>
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.cogButton}>
              <Settings size={28} color="#FF6700" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        <Modal
          transparent={true}
          visible={menuVisible}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.dropdownMenu}>
                <ThemedText style={styles.menuTitle}>WORKOUT CONFIG</ThemedText>
                
                <View style={styles.menuItem}>
                  <ThemedText style={styles.menuLabel}>TOTAL ROUNDS</ThemedText>
                  <TextInput 
                    style={styles.menuInput}
                    keyboardType="numeric"
                    value={totalRounds.toString()}
                    onChangeText={(val) => setRounds(Number(val) || 1)}
                  />
                </View>

                <View style={styles.menuItem}>
                  <ThemedText style={styles.menuLabel}>ROUND SECONDS</ThemedText>
                  <TextInput 
                    style={styles.menuInput}
                    keyboardType="numeric"
                    value={seconds.toString()}
                    onChangeText={(val) => {
                      const s = Number(val) || 1;
                      setSeconds(s);
                      secondsRef.current = s;
                    }}
                  />
                </View>

                <TouchableOpacity 
                  style={styles.closeMenuButton} 
                  onPress={() => setMenuVisible(false)}
                >
                  <ThemedText style={styles.closeMenuText}>APPLY & CLOSE</ThemedText>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[
            styles.timerRing,
            { borderColor: isResting ? '#93000a' : '#C3F400' }
          ]}>
            <ThemedText style={[styles.phaseLabel, { color: isResting ? '#ffb4ab' : '#C3F400' }]}>
              {isResting ? 'REST' : 'WORK'}
            </ThemedText>
            <ThemedText style={styles.timerNumbers}>
              {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
            </ThemedText>
          </View>

          <View style={styles.comboCard}>
            <ThemedText style={styles.comboLabel}>CURRENT COMBO</ThemedText>
            <ThemedText style={styles.comboText}>{currentCombo}</ThemedText>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
                onPress={() => setIsActive(!isActive)}
                style={styles.mainButton}
              >
                {isActive ? (
                  <Pause size={32} color="#351000" fill="#351000" />
                ) : (
                  <Play size={32} color="#351000" fill="#351000" />
                )}
                <ThemedText style={styles.mainButtonText}>
                  {isActive ? "PAUSE" : "START"}
                </ThemedText>
              </TouchableOpacity>

            <View style={styles.secondaryButtonsRow}>
              <TouchableOpacity onPress={resetTimer} style={styles.sideButton}>
                <RefreshCw size={24} color="white" />
                <ThemedText style={styles.sideButtonText}>RESET</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePhaseSwitch} style={styles.sideButton}>
                <SkipForward size={24} color="white" fill="white" />
                <ThemedText style={styles.sideButtonText}>SKIP</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 4,
    alignItems: 'center',
  },
  logoText: {
    color: '#FF6700',
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  liveBadge: {
    backgroundColor: 'rgba(195,244,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveBadgeText: {
    color: '#C3F400',
    fontSize: 10,
    fontWeight: 'bold',
  },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 4,
  },
  roundTitle: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: 'white',
    lineHeight: 40,
    paddingVertical: 5,
  },
  cogButton: {
    padding: 5,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 100,
  },
  timerRing: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 10,
    flexDirection: 'column', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginVertical: 40,
    backgroundColor: '#1c1b1b',
    paddingBottom: 10,
  },
  phaseLabel: {
    letterSpacing: 4,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timerNumbers: {
    fontSize: 80,
    lineHeight: 80,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center', 
    textAlignVertical: 'center',
  },
  comboCard: {
    backgroundColor: '#2a2a2a',
    width: '90%',
    padding: 25,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  comboLabel: {
    color: '#C3F400',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  comboText: {
    color: 'white',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 8,
    lineHeight: 38,
    paddingTop: 4,
  },
  controlsContainer: {
    width: '90%',
    marginTop: 40,
  },
  mainButton: {
    backgroundColor: '#FF6700',
    paddingVertical: 20,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FF6700',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  mainButtonText: {
    color: '#351000',
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 10,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  sideButton: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 24,
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: '#1c1b1b',
    borderRadius: 20,
    padding: 20,
    width: 250,
    borderWidth: 1,
    borderColor: '#FF6700',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  menuTitle: {
    color: '#FF6700',
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  menuItem: {
    marginBottom: 15,
  },
  menuLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  menuInput: {
    backgroundColor: '#2a2a2a',
    color: 'white',
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeMenuButton: {
    backgroundColor: '#C3F400',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  closeMenuText: {
    color: '#351000',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 12,
  },
  cogPlaceholder: {
  width: 38, 
},
});