import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

// Helper to get value from .env, throws if missing
String getEnv(String key) {
  final value = dotenv.maybeGet(key);
  if (value == null) {
    throw StateError('Missing environment variable: $key');
  }
  return value;
}

class CustomFirebaseOptions {
  static final FirebaseOptions currentPlatform = FirebaseOptions(
    apiKey: getEnv('FIREBASE_API_KEY'),
    appId: getEnv('FIREBASE_APP_ID'),
    messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
    projectId: getEnv('FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'), // Add if you use Storage
  );
}