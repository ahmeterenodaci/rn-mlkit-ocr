import Foundation
import MLKitVision
import MLKitTextRecognition

#if canImport(MLKitTextRecognitionChinese)
import MLKitTextRecognitionChinese
#endif
#if canImport(MLKitTextRecognitionDevanagari)
import MLKitTextRecognitionDevanagari
#endif
#if canImport(MLKitTextRecognitionJapanese)
import MLKitTextRecognitionJapanese
#endif
#if canImport(MLKitTextRecognitionKorean)
import MLKitTextRecognitionKorean
#endif

public typealias RCTPromiseResolveBlock = (Any?) -> Void
public typealias RCTPromiseRejectBlock = (String?, String?, Error?) -> Void

@objc(RnMlkitOcr)
public class RnMlkitOcrImpl: NSObject {

  @objc public func getAvailableLanguages(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    var languages = ["latin"]
    
    #if canImport(MLKitTextRecognitionChinese)
    languages.append("chinese")
    #endif
    #if canImport(MLKitTextRecognitionDevanagari)
    languages.append("devanagari")
    #endif
    #if canImport(MLKitTextRecognitionJapanese)
    languages.append("japanese")
    #endif
    #if canImport(MLKitTextRecognitionKorean)
    languages.append("korean")
    #endif
    
    resolve(languages)
  }

  @objc public func recognizeText(_ imageUri: String, options: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        let detectorType = options["detectorType"] as? String ?? "latin"
        
        guard let image = try await loadImage(from: imageUri) else {
          reject("ERR_IMAGE", "Could not load image", nil)
          return
        }
        
        let recognizer = createTextRecognizer(for: detectorType)
        let visionImage = VisionImage(image: image)
        visionImage.orientation = image.imageOrientation
        
        let result = try await recognizer.process(visionImage)
        
        let response = convertTextToDict(text: result)
        resolve(response)
        
      } catch {
        reject("ERR_OCR", error.localizedDescription, error)
      }
    }
  }


  private func createTextRecognizer(for detectorType: String) -> TextRecognizer {
    switch detectorType.lowercased() {
        
    #if canImport(MLKitTextRecognitionChinese)
    case "chinese":
      let options = ChineseTextRecognizerOptions()
      return TextRecognizer.textRecognizer(options: options)
    #endif
        
    #if canImport(MLKitTextRecognitionDevanagari)
    case "devanagari":
      let options = DevanagariTextRecognizerOptions()
      return TextRecognizer.textRecognizer(options: options)
    #endif
        
    #if canImport(MLKitTextRecognitionJapanese)
    case "japanese":
      let options = JapaneseTextRecognizerOptions()
      return TextRecognizer.textRecognizer(options: options)
    #endif
        
    #if canImport(MLKitTextRecognitionKorean)
    case "korean":
      let options = KoreanTextRecognizerOptions()
      return TextRecognizer.textRecognizer(options: options)
    #endif
        
    default:
      let options = TextRecognizerOptions()
      return TextRecognizer.textRecognizer(options: options)
    }
  }

  private func loadImage(from uri: String) async throws -> UIImage? {
    let cleanUri = uri.replacingOccurrences(of: "file://", with: "")
    
    if FileManager.default.fileExists(atPath: cleanUri), let image = UIImage(contentsOfFile: cleanUri) {
      return image
    }
    
    if let url = URL(string: uri) {
      let (data, _) = try await URLSession.shared.data(from: url)
      return UIImage(data: data)
    }
    
    return nil
  }

  private func convertTextToDict(text: Text) -> [String: Any] {
    var blocksArray: [[String: Any]] = []
    
    for block in text.blocks {
      var linesArray: [[String: Any]] = []
      
      for line in block.lines {
        var elementsArray: [[String: Any]] = []
        for element in line.elements {
          elementsArray.append([
            "text": element.text,
            "frame": frameToDict(element.frame)
          ])
        }
        
        linesArray.append([
          "text": line.text,
          "frame": frameToDict(line.frame),
          "elements": elementsArray
        ])
      }
      
      blocksArray.append([
        "text": block.text,
        "frame": frameToDict(block.frame),
        "lines": linesArray
      ])
    }
    
    return [
      "text": text.text,
      "blocks": blocksArray
    ]
  }
  
  private func frameToDict(_ frame: CGRect) -> [String: Double] {
    return [
      "x": Double(frame.origin.x),
      "y": Double(frame.origin.y),
      "width": Double(frame.size.width),
      "height": Double(frame.size.height)
    ]
  }

  @objc public static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
