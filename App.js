import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';

export default function App() {
  // 預設時間設定（秒）
  const DEFAULT_SETTINGS = {
    workDuration: 25,      // 工作時間（分鐘）
    shortBreak: 5,         // 短休息（分鐘）
    longBreak: 15,          // 長休息（分鐘）
    sessionsUntilLongBreak: 4,  // 幾個工作循環後長休息
  };

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [sessionCount, setSessionCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(DEFAULT_SETTINGS);

  const intervalRef = useRef(null);

  // 格式化時間顯示為 MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 取得當前模式應該顯示的時間
  const getDurationForMode = (mode) => {
    switch (mode) {
      case 'work':
        return settings.workDuration * 60;
      case 'shortBreak':
        return settings.shortBreak * 60;
      case 'longBreak':
        return settings.longBreak * 60;
      default:
        return settings.workDuration * 60;
    }
  };

  // 倒數計時邏輯
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // 計時結束
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // 計時完成的處理
  const handleTimerComplete = () => {
    setIsRunning(false);

    // 震動提示（如果支援的話）
    // 切換模式
    if (mode === 'work') {
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);

      if (newSessionCount % settings.sessionsUntilLongBreak === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreak * 60);
        Alert.alert('🎉 完成！', '你完成了一個循環，該長休息了！');
      } else {
        setMode('shortBreak');
        setTimeLeft(settings.shortBreak * 60);
        Alert.alert('⏰ 工作結束！', '該休息一下了！');
      }
    } else {
      // 休息結束
      setMode('work');
      setTimeLeft(settings.workDuration * 60);
      Alert.alert('☕ 休息結束！', '準備好繼續工作了嗎？');
    }
  };

  // 開始/暫停
  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  // 重置
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getDurationForMode(mode));
  };

  // 跳過當前階段
  const handleSkip = () => {
    handleTimerComplete();
  };

  // 開啟設定
  const openSettings = () => {
    setTempSettings(settings);
    setShowSettings(true);
  };

  // 儲存設定
  const saveSettings = () => {
    // 驗證輸入
    if (tempSettings.workDuration < 1 || tempSettings.workDuration > 60) {
      Alert.alert('錯誤', '工作時間必須在 1-60 分鐘之間');
      return;
    }
    if (tempSettings.shortBreak < 1 || tempSettings.shortBreak > 30) {
      Alert.alert('錯誤', '短休息必須在 1-30 分鐘之間');
      return;
    }
    if (tempSettings.longBreak < 1 || tempSettings.longBreak > 60) {
      Alert.alert('錯誤', '長休息必須在 1-60 分鐘之間');
      return;
    }

    setSettings(tempSettings);
    if (!isRunning) {
      setTimeLeft(getDurationForMode(mode));
    }
    setShowSettings(false);
  };

  // 取得模式相關的文字和顏色
  const getModeInfo = () => {
    switch (mode) {
      case 'work':
        return { title: '專注時間', color: '#FF6B6B', bgColor: '#FFE5E5' };
      case 'shortBreak':
        return { title: '短休息', color: '#4ECDC4', bgColor: '#E5FFF9' };
      case 'longBreak':
        return { title: '長休息', color: '#45B7D1', bgColor: '#E5F4FF' };
      default:
        return { title: '專注時間', color: '#FF6B6B', bgColor: '#FFE5E5' };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <View style={[styles.container, { backgroundColor: modeInfo.bgColor }]}>
      <StatusBar barStyle="dark-content" />

      {/* 頂部選項 */}
      <View style={styles.topBar}>
        <Text style={styles.sessionCount}>第 {sessionCount + 1} 個循環</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
          <Text style={styles.settingsButtonText}>⚙️ 設定</Text>
        </TouchableOpacity>
      </View>

      {/* 模式標題 */}
      <Text style={[styles.title, { color: modeInfo.color }]}>
        {modeInfo.title}
      </Text>

      {/* 計時器 */}
      <Text style={[styles.timer, { color: modeInfo.color }]}>
        {formatTime(timeLeft)}
      </Text>

      {/* 進度條 */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${(1 - timeLeft / getDurationForMode(mode)) * 100}%`,
              backgroundColor: modeInfo.color,
            },
          ]}
        />
      </View>

      {/* 按鈕區域 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.mainButton, { backgroundColor: modeInfo.color }]}
          onPress={handleStartPause}
        >
          <Text style={styles.mainButtonText}>
            {isRunning ? '⏸️ 暫停' : '▶️ 開始'}
          </Text>
        </TouchableOpacity>

        <View style={styles.secondaryButtons}>
          <TouchableOpacity
            style={[styles.smallButton, styles.resetButton]}
            onPress={handleReset}
          >
            <Text style={styles.smallButtonText}>🔄 重置</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, styles.skipButton]}
            onPress={handleSkip}
          >
            <Text style={styles.smallButtonText}>⏭️ 跳過</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 設定 Modal */}
      <Modal visible={showSettings} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>⚙️ 設定</Text>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>工作時間（分鐘）</Text>
                <TextInput
                  style={styles.settingInput}
                  value={tempSettings.workDuration.toString()}
                  onChangeText={(text) =>
                    setTempSettings({
                      ...tempSettings,
                      workDuration: parseInt(text) || 0,
                    })
                  }
                  keyboardType="numeric"
                  placeholder="25"
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>短休息（分鐘）</Text>
                <TextInput
                  style={styles.settingInput}
                  value={tempSettings.shortBreak.toString()}
                  onChangeText={(text) =>
                    setTempSettings({
                      ...tempSettings,
                      shortBreak: parseInt(text) || 0,
                    })
                  }
                  keyboardType="numeric"
                  placeholder="5"
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>長休息（分鐘）</Text>
                <TextInput
                  style={styles.settingInput}
                  value={tempSettings.longBreak.toString()}
                  onChangeText={(text) =>
                    setTempSettings({
                      ...tempSettings,
                      longBreak: parseInt(text) || 0,
                    })
                  }
                  keyboardType="numeric"
                  placeholder="15"
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>循環次數（長休息）</Text>
                <TextInput
                  style={styles.settingInput}
                  value={tempSettings.sessionsUntilLongBreak.toString()}
                  onChangeText={(text) =>
                    setTempSettings({
                      ...tempSettings,
                      sessionsUntilLongBreak: parseInt(text) || 4,
                    })
                  }
                  keyboardType="numeric"
                  placeholder="4"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowSettings(false)}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveSettings}
                >
                  <Text style={styles.saveButtonText}>儲存</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionCount: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  settingsButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
  },
  settingsButtonText: {
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timer: {
    fontSize: 96,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    marginBottom: 30,
  },
  progressContainer: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    marginBottom: 40,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  mainButton: {
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 40,
    minWidth: 200,
    alignItems: 'center',
  },
  mainButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  smallButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  resetButton: {},
  skipButton: {},
  smallButtonText: {
    fontSize: 16,
    color: '#333',
  },
  // Modal 樣式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#EEE',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});
