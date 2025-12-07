import { useState, useEffect } from 'react';
import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { recognizeText, getAvailableLanguages } from 'rn-mlkit-ocr';
import type { OcrResult, DetectorType } from 'rn-mlkit-ocr';

const imageUrl =
  'https://raw.githubusercontent.com/googlesamples/mlkit/refs/heads/master/ios/quickstarts/vision/Resources/image_has_text.jpg';

export default function App() {
  const [ocrResult, setOcrResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const langs = await getAvailableLanguages();
        setAvailableLanguages(langs);
      } catch (error) {
        console.error('Error loading languages:', error);
      }
    };

    fetchLanguages();
  }, []);

  const performOCR = async (detectorType: DetectorType = 'latin') => {
    if (!imageUrl) return;

    setLoading(true);
    setOcrResult('');

    try {
      const result: OcrResult = await recognizeText(imageUrl, detectorType);
      setOcrResult(result.text);
    } catch (error) {
      console.error('OCR Error:', error);
      setOcrResult('Error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {imageUrl && (
        <>
          <Image source={{ uri: imageUrl }} style={styles.image} />

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Installed models:{' '}
              {availableLanguages.length > 0
                ? availableLanguages.join(', ')
                : 'Loading...'}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            {availableLanguages.map((lang) => (
              <Button
                key={lang}
                title={lang.charAt(0).toUpperCase() + lang.slice(1)}
                onPress={() => performOCR(lang as DetectorType)}
                disabled={loading}
              />
            ))}
          </View>
        </>
      )}

      {loading && <Text style={styles.loadingText}>Processing...</Text>}

      {ocrResult ? (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultText}>{ocrResult}</Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 10,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginVertical: 20,
  },
  infoContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    marginBottom: 10,
    color: 'blue',
  },
  resultContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  resultText: {
    fontSize: 16,
  },
});
