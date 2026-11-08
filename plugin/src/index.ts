import {
  withProjectBuildGradle,
  withPodfile,
  withGradleProperties,
  withAndroidManifest,
} from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';

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

  config = withGradleProperties(config, (gradlePropsConfig) => {
    const properties = gradlePropsConfig.modResults;
    const { ocrModels, ocrUseBundled } = props;
    const models = ocrModels || ['all'];
    const useBundled = ocrUseBundled !== undefined ? ocrUseBundled : false;

    function setProperty(key: string, value: string) {
      const item = properties.find(
        (p) => p.type === 'property' && p.key === key
      );
      if (item && item.type === 'property') {
        item.value = value;
      } else {
        properties.push({ type: 'property', key, value });
      }
    }

    setProperty('RnMlkitOcr_ocrUseBundled', String(useBundled));
    setProperty('RnMlkitOcr_ocrModels', JSON.stringify(models));

    return gradlePropsConfig;
  });

  config = withAndroidManifest(config, (manifestConfig) => {
    const mainApplication = manifestConfig.modResults.manifest.application?.[0];
    if (mainApplication) {
      if (!mainApplication['meta-data']) {
        mainApplication['meta-data'] = [];
      }
      const existing = mainApplication['meta-data'].find(
        (m: any) =>
          m.$?.['android:name'] === 'com.google.mlkit.vision.DEPENDENCIES'
      );
      if (!existing) {
        mainApplication['meta-data'].push({
          $: {
            'android:name': 'com.google.mlkit.vision.DEPENDENCIES',
            'android:value': 'ocr',
          },
        });
      }
    }
    return manifestConfig;
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

  // Clean up any legacy or erroneous buildscript { ext { ... } } wrapper
  buildGradle = buildGradle.replace(
    /buildscript\s*\{\s*ext\s*\{[\s\S]*?ocrModels[\s\S]*?ocrUseBundled[\s\S]*?\}\s*\}/g,
    ''
  );

  if (buildGradle.includes('ocrModels =')) {
    return buildGradle.replace(
      /ocrModels\s?=\s?\[[\s\S]*?\]\s+ocrUseBundled\s?=\s?(true|false)/,
      `ocrModels = ${modelsString}\n    ocrUseBundled = ${useBundled}`
    );
  }
  if (buildGradle.includes('ext {')) {
    return buildGradle.replace('ext {', `ext {${newConfig}`);
  }
  // When no root ext block exists, inject a top-level ext { ... } block
  return buildGradle.trimEnd() + `\n\next {${newConfig}}\n`;
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
