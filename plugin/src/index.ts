import type { ConfigPlugin } from '@expo/config-plugins';
import { withProjectBuildGradle, withPodfile } from '@expo/config-plugins';

interface Props {
  ocrModels?: string[];
  ocrUseBundled?: boolean;
}

const withMlKitConfig: ConfigPlugin<Props> = (config, props = {}) => {
  config = withProjectBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language === 'groovy') {
      gradleConfig.modResults.contents = setGradleProperties(
        gradleConfig.modResults.contents,
        props
      );
    }
    return gradleConfig;
  });

  config = withPodfile(config, (podfileConfig) => {
    podfileConfig.modResults.contents = setPodfileProperties(
      podfileConfig.modResults.contents,
      props
    );
    return podfileConfig;
  });

  return config;
};

function setGradleProperties(buildGradle: string, props: Props): string {
  const { ocrModels, ocrUseBundled } = props;
  const models = ocrModels || ['all'];
  const useBundled = ocrUseBundled !== undefined ? ocrUseBundled : false;
  const modelsString = `["${models.join('", "')}"]`;
  const newConfig = `
        // --- RN-MLKIT-OCR CONFIG START ---
        ocrModels = ${modelsString}
        ocrUseBundled = ${useBundled}
        // --- RN-MLKIT-OCR CONFIG END ---
  `;

  if (buildGradle.includes('ocrModels =')) {
    return buildGradle.replace(
      /ocrModels\s?=\s?\[[\s\S]*?\]\s+ocrUseBundled\s?=\s?(true|false)/,
      `ocrModels = ${modelsString}\n        ocrUseBundled = ${useBundled}`
    );
  }
  if (buildGradle.includes('ext {')) {
    return buildGradle.replace('ext {', `ext {${newConfig}`);
  }
  return buildGradle + `\nbuildscript {\n    ext {${newConfig}\n    }\n}\n`;
}

function setPodfileProperties(podfile: string, props: Props): string {
  const { ocrModels } = props;

  let models: string[] = [];

  if (!ocrModels || ocrModels.includes('all')) {
    models = ['latin', 'chinese', 'devanagari', 'japanese', 'korean'];
  } else {
    models = ocrModels.map((m) => m.charAt(0).toUpperCase() + m.slice(1));
    if (!models.includes('latin')) {
      models.push('latin');
    }
  }

  const variableContent = `$ReactNativeOcrSubspecs = [${models
    .map((m) => `'${m}'`)
    .join(', ')}]`;
  const tag = '# --- RN-MLKIT-OCR CONFIG ---';

  if (podfile.includes(tag)) {
    return podfile.replace(
      /# --- RN-MLKIT-OCR CONFIG ---[\s\S]*?# --- END RN-MLKIT-OCR CONFIG ---/,
      `${tag}\n${variableContent}\n# --- END RN-MLKIT-OCR CONFIG ---`
    );
  }

  return (
    `${tag}\n${variableContent}\n# --- END RN-MLKIT-OCR CONFIG ---\n\n` +
    podfile
  );
}

export default withMlKitConfig;

// Add CommonJS compatibility for Expo
module.exports = withMlKitConfig;
module.exports.default = withMlKitConfig;
