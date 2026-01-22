import RnMlkitOcr from './NativeRnMlkitOcr';

export interface OcrFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrElement {
  text: string;
  frame: OcrFrame;
}

export interface OcrLine {
  text: string;
  frame: OcrFrame;
  elements: OcrElement[];
}

export interface OcrBlock {
  text: string;
  frame: OcrFrame;
  lines: OcrLine[];
}

export interface OcrResult {
  text: string;
  blocks: OcrBlock[];
}

export type DetectorType =
  | 'latin'
  | 'chinese'
  | 'devanagari'
  | 'japanese'
  | 'korean';

export function recognizeText(
  imageUri: string,
  detectorType?: DetectorType
): Promise<OcrResult> {
  const options = detectorType ? { detectorType } : undefined;
  return RnMlkitOcr.recognizeText(imageUri, options) as Promise<OcrResult>;
}

export function getAvailableLanguages(): Promise<DetectorType[]> {
  return RnMlkitOcr.getAvailableLanguages();
}

export interface MlkitOcrModule {
  recognizeText: (
    imageUri: string,
    detectorType?: DetectorType
  ) => Promise<OcrResult>;
  getAvailableLanguages: () => Promise<DetectorType[]>;
}

const MlkitOcr: MlkitOcrModule = {
  recognizeText,
  getAvailableLanguages,
};

export default MlkitOcr;
