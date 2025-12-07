#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RnMlkitOcr, NSObject)

RCT_EXTERN_METHOD(getAvailableLanguages:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(recognizeText:(NSString *)imageUri
                  options:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
+ (BOOL)requiresMainQueueSetup { return NO; }

@end