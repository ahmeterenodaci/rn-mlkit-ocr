require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

selected_subspecs = defined?($ReactNativeOcrSubspecs) ? $ReactNativeOcrSubspecs : ['Latin', 'Chinese', 'Devanagari', 'Japanese', 'Korean']


Pod::Spec.new do |s|
  s.name         = "RnMlkitOcr"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "15.5" }
  s.source       = { :git => "https://github.com/ahmeterenodaci/rn-mlkit-ocr.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"

  s.dependency "React-Core"

  if selected_subspecs.include?('Latin')
    s.dependency 'GoogleMLKit/TextRecognition', '3.2.0'
  end
  if selected_subspecs.include?('Chinese')
    s.dependency 'GoogleMLKit/TextRecognitionChinese', '3.2.0'
  end
  if selected_subspecs.include?('Devanagari')
    s.dependency 'GoogleMLKit/TextRecognitionDevanagari', '3.2.0'
  end
  if selected_subspecs.include?('Japanese')
    s.dependency 'GoogleMLKit/TextRecognitionJapanese', '3.2.0'
  end
  if selected_subspecs.include?('Korean')
    s.dependency 'GoogleMLKit/TextRecognitionKorean', '3.2.0'
  end
end
