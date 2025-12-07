package com.rnmlkitocr

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.TextRecognizer
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.File
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class RnMlkitOcrModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val executor = Executors.newSingleThreadExecutor()

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun recognizeText(imageUri: String, options: ReadableMap?, promise: Promise) {
    val detectorType = if (options != null && options.hasKey("detectorType")) {
        options.getString("detectorType") ?: "latin"
    } else {
        "latin"
    }
    processOCR(imageUri, detectorType, promise)
  }

  @ReactMethod
  fun getAvailableLanguages(promise: Promise) {
      val languages = Arguments.createArray()

      if (BuildConfig.HAS_LATIN) languages.pushString("latin")
      if (BuildConfig.HAS_CHINESE) languages.pushString("chinese")
      if (BuildConfig.HAS_DEVANAGARI) languages.pushString("devanagari")
      if (BuildConfig.HAS_JAPANESE) languages.pushString("japanese")
      if (BuildConfig.HAS_KOREAN) languages.pushString("korean")

      promise.resolve(languages)
  }

  
  private fun processOCR(imageUri: String, detectorType: String, promise: Promise) {
    executor.execute {
      try {
        val context = reactApplicationContext
        val image = loadImage(context, imageUri)
        
        if (image == null) {
          promise.reject("ERR_IMAGE", "Failed to load image")
          return@execute
        }

        val recognizer = createTextRecognizer(detectorType)

        recognizer.process(image)
          .addOnSuccessListener { text ->
            val result = convertTextToWritableMap(text)
            promise.resolve(result)
          }
          .addOnFailureListener { e ->
            promise.reject("ERR_OCR", e.message ?: "OCR failed", e)
          }
      } catch (e: Exception) {
        promise.reject("ERR_OCR", e.message ?: "OCR failed", e)
      }
    }
  }

  
  private fun createTextRecognizer(detectorType: String): TextRecognizer {
    return when (detectorType.lowercase()) {
      "chinese" -> {
        if (!BuildConfig.HAS_CHINESE) throw IllegalArgumentException("Chinese model not available")
        createRecognizerByReflection("com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions")
      }
      "devanagari" -> {
        if (!BuildConfig.HAS_DEVANAGARI) throw IllegalArgumentException("Devanagari model not available")
        createRecognizerByReflection("com.google.mlkit.vision.text.devanagari.DevanagariTextRecognizerOptions")
      }
      "japanese" -> {
        if (!BuildConfig.HAS_JAPANESE) throw IllegalArgumentException("Japanese model not available")
        createRecognizerByReflection("com.google.mlkit.vision.text.japanese.JapaneseTextRecognizerOptions")
      }
      "korean" -> {
        if (!BuildConfig.HAS_KOREAN) throw IllegalArgumentException("Korean model not available")
        createRecognizerByReflection("com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions")
      }
      else -> {
        if (!BuildConfig.HAS_LATIN) throw IllegalArgumentException("Latin model not available")
        TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
      }
    }
  }
  
  private fun createRecognizerByReflection(optionsClassName: String): TextRecognizer {
    try {
      // Create options instance
      val optionsClass = Class.forName(optionsClassName)
      val builderClass = Class.forName("$optionsClassName\$Builder")
      val builderInstance = builderClass.getDeclaredConstructor().newInstance()
      val buildMethod = builderClass.getMethod("build")
      val options = buildMethod.invoke(builderInstance)
      
      // Call TextRecognition.getClient with the options
      // The method signature accepts any TextRecognizerOptions subclass
      val methods = TextRecognition::class.java.methods
      val getClientMethod = methods.find { method ->
        method.name == "getClient" && 
        method.parameterCount == 1 &&
        method.parameterTypes[0].isAssignableFrom(optionsClass)
      } ?: throw NoSuchMethodException("getClient method not found for $optionsClassName")
      
      return getClientMethod.invoke(null, options) as TextRecognizer
    } catch (e: Exception) {
      e.printStackTrace()
      throw RuntimeException("Failed to create text recognizer for $optionsClassName: ${e.message}", e)
    }
  }
  
  private fun loadImage(context: Context, uri: String): InputImage? {
    return try {
      if (uri.startsWith("http://") || uri.startsWith("https://")) {
        val bitmap = downloadBitmap(uri)
        if (bitmap != null) return InputImage.fromBitmap(bitmap, 0)
        return null
      }
      val cleanUri = uri.replace("file://", "")
      val file = File(cleanUri)
      if (file.exists()) {
        val bitmap = BitmapFactory.decodeFile(cleanUri)
        if (bitmap != null) return InputImage.fromBitmap(bitmap, 0)
      }
      val contentUri = Uri.parse(uri)
      InputImage.fromFilePath(context, contentUri)
    } catch (e: Exception) {
      e.printStackTrace()
      null
    }
  }

  private fun downloadBitmap(urlString: String): Bitmap? {
     var connection: HttpURLConnection? = null
     var inputStream: InputStream? = null
     return try {
       val url = URL(urlString)
       connection = url.openConnection() as HttpURLConnection
       connection.connectTimeout = 15000
       connection.readTimeout = 15000
       connection.requestMethod = "GET"
       connection.doInput = true
       connection.connect()
       if (connection.responseCode == HttpURLConnection.HTTP_OK) {
         inputStream = connection.inputStream
         BitmapFactory.decodeStream(inputStream)
       } else {
         null
       }
     } catch (e: Exception) {
       null
     } finally {
       inputStream?.close()
       connection?.disconnect()
     }
  }

  private fun convertTextToWritableMap(text: Text): WritableMap {
      val result = Arguments.createMap()
      result.putString("text", text.text)
      val blocksArray = Arguments.createArray()
      
      for (block in text.textBlocks) {
          val blockMap = Arguments.createMap()
          blockMap.putString("text", block.text)
          blockMap.putMap("frame", getFrameMap(block.boundingBox))
          
          val linesArray = Arguments.createArray()
          for (line in block.lines) {
              val lineMap = Arguments.createMap()
              lineMap.putString("text", line.text)
              lineMap.putMap("frame", getFrameMap(line.boundingBox))
              
              val elementsArray = Arguments.createArray()
              for (element in line.elements) {
                  val elementMap = Arguments.createMap()
                  elementMap.putString("text", element.text)
                  elementMap.putMap("frame", getFrameMap(element.boundingBox))
                  elementsArray.pushMap(elementMap)
              }
              lineMap.putArray("elements", elementsArray)
              linesArray.pushMap(lineMap)
          }
          blockMap.putArray("lines", linesArray)
          blocksArray.pushMap(blockMap)
      }
      result.putArray("blocks", blocksArray)
      return result
  }
  
  private fun getFrameMap(boundingBox: android.graphics.Rect?): WritableMap {
      val map = Arguments.createMap()
      map.putDouble("x", boundingBox?.left?.toDouble() ?: 0.0)
      map.putDouble("y", boundingBox?.top?.toDouble() ?: 0.0)
      map.putDouble("width", boundingBox?.width()?.toDouble() ?: 0.0)
      map.putDouble("height", boundingBox?.height()?.toDouble() ?: 0.0)
      return map
  }

  companion object {
    const val NAME = "RnMlkitOcr"
  }
}