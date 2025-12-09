# rn-mlkit-ocr

A powerful React Native OCR (Optical Character Recognition) module powered by Google ML Kit. Supports multiple languages and scripts with selective model loading for optimized app size.

## Features

- 🌍 **Multi-language support**: Latin, Chinese, Devanagari, Japanese, and Korean scripts
- 📦 **Selective model loading**: Include only the languages you need to minimize app size
- ⚡ **High performance**: Powered by Google ML Kit's on-device text recognition
- 🔄 **Flexible deployment**: Choose between bundled models (offline) or unbundled models (download on demand)
- 📱 **Cross-platform**: Works on both iOS and Android

## Requirements

- iOS 15.5+ (Note: ML Kit iOS APIs run only on 64-bit devices.)
- Android API 23+

## Installation

```bash
npm install rn-mlkit-ocr
# or
yarn add rn-mlkit-ocr
```

### iOS Setup

Run pod install:

```bash
cd ios && pod install
```

### Android Setup

No additional setup required for Android.

## Configuration

### Selecting OCR Models

By default, all language models are included. To optimize your app size, you can specify which models to include.

#### For Expo Projects

Add the plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "rn-mlkit-ocr",
        {
          "ocrModels": ["latin", "chinese", "devanagari", "japanese", "korean"],
          "ocrUseBundled": true
        }
      ]
    ]
  }
}
```

#### For React Native CLI Projects

##### Android

Add the following to your `android/build.gradle` file inside the `buildscript { ext { ... } }` block:

```gradle
buildscript {
    ext {
        // ... other configurations
        ocrModels = ["latin", "chinese", "devanagari", "japanese", "korean"]
        ocrUseBundled = true
    }
}
```

##### iOS

Add the following to your `ios/Podfile` before the `use_react_native!` call:

```ruby
# --- RN-MLKIT-OCR CONFIG ---
$ReactNativeOcrSubspecs = ['latin', 'chinese', 'devanagari', 'japanese', 'korean']
# --- END RN-MLKIT-OCR CONFIG ---
```

### Configuration Options

- **`ocrModels`**: Array of language models to include
  - Available options: `'latin'`, `'chinese'`, `'devanagari'`, `'japanese'`, `'korean'`, or `'all'`
  - Default: `['all']`
- **`ocrUseBundled`** (Android only): Whether to use bundled models
  - `true`: Models are bundled with the app (larger app size, works offline immediately)
  - `false`: Models are downloaded on first use (smaller app size, requires internet on first use)
  - Default: `false`

## Usage

### Basic Text Recognition

```typescript
import MlkitOcr from 'rn-mlkit-ocr';

const imageUri = 'file:///path/to/image.jpg'; // Local image or link

try {
  const result = await MlkitOcr.recognizeText(imageUri);
  console.log('Recognized text:', result.text);

  // Access detailed information
  result.blocks.forEach((block) => {
    console.log('Block:', block.text);
    block.lines.forEach((line) => {
      console.log('  Line:', line.text);
      line.elements.forEach((element) => {
        console.log('    Element:', element.text);
      });
    });
  });
} catch (error) {
  console.error('OCR Error:', error);
}
```

### Using Specific Language Models

```typescript
import MlkitOcr from 'rn-mlkit-ocr';

// Recognize Chinese text
const result = await MlkitOcr.recognizeText(imageUri, 'chinese');

// Recognize Japanese text
const result = await MlkitOcr.recognizeText(imageUri, 'japanese');
```

### Getting Available Languages

```typescript
import MlkitOcr from 'rn-mlkit-ocr';

const languages = await MlkitOcr.getAvailableLanguages();
console.log('Available languages:', languages);
// Output: ['latin', 'chinese', 'devanagari', 'japanese', 'korean']
```

## API Reference

### `recognizeText(imageUri: string, detectorType?: DetectorType): Promise<OcrResult>`

Performs OCR on the specified image.

**Parameters:**

- `imageUri`: Path to the image (file path, content URI, or HTTP/HTTPS URL)
- `detectorType`: Optional language detector type (`'latin'`, `'chinese'`, `'devanagari'`, `'japanese'`, `'korean'`). Defaults to `'latin'`

**Returns:** Promise resolving to `OcrResult`

### `getAvailableLanguages(): Promise<DetectorType[]>`

Returns the list of language models available in the app based on your configuration.

**Returns:** Promise resolving to array of detector types

### Types

```typescript
interface OcrResult {
  text: string; // Full recognized text
  blocks: OcrBlock[]; // Text blocks
}

interface OcrBlock {
  text: string;
  frame: OcrFrame;
  lines: OcrLine[];
}

interface OcrLine {
  text: string;
  frame: OcrFrame;
  elements: OcrElement[];
}

interface OcrElement {
  text: string;
  frame: OcrFrame;
}

interface OcrFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DetectorType = 'latin' | 'chinese' | 'devanagari' | 'japanese' | 'korean';
```

## Supported Languages & Scripts

For a complete list of supported languages, see [Google ML Kit Text Recognition Languages](https://developers.google.com/ml-kit/vision/text-recognition/v2/languages).

## Example App

Check out the example app in the `example/` directory for a complete working implementation.

```bash
cd example
yarn install

# For iOS
cd ios && pod install && cd ..
yarn ios

# For Android
yarn android
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
