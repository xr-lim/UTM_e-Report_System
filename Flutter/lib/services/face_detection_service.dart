import 'dart:io';
import 'dart:typed_data';
import 'package:http/http.dart' as http;

/// Result class for face detection
class FaceDetectionResult {
  final Uint8List imageBytes;
  final String status;

  FaceDetectionResult({required this.imageBytes, required this.status});
}

class FaceDetectionService {
  static const String _apiUrl = 'http://172.20.10.5:8000/face';

  /// Scans an image and returns the enlarged face image
  ///
  /// Returns the processed image as bytes, or null if detection fails
  static Future<FaceDetectionResult?> detectAndEnlargeFace(
    File imageFile,
  ) async {
    print('========== FACE DETECTION API DEBUG ==========');
    print('[FaceDetection] Starting face detection...');
    print('[FaceDetection] API URL: $_apiUrl');
    print('[FaceDetection] Image path: ${imageFile.path}');
    print('[FaceDetection] Image exists: ${imageFile.existsSync()}');

    if (imageFile.existsSync()) {
      final fileSize = await imageFile.length();
      print(
        '[FaceDetection] Image size: ${(fileSize / 1024).toStringAsFixed(2)} KB',
      );
    }

    try {
      // Create multipart request
      print('[FaceDetection] Creating multipart request...');
      var request = http.MultipartRequest('POST', Uri.parse(_apiUrl));

      // Add the image file with field name 'file'
      print('[FaceDetection] Adding file to request with field name: "file"');
      request.files.add(
        await http.MultipartFile.fromPath('file', imageFile.path),
      );
      print(
        '[FaceDetection] File added. Total files in request: ${request.files.length}',
      );

      // Send the request with timeout
      print('[FaceDetection] Sending request to API...');
      var streamedResponse = await request.send().timeout(
        const Duration(seconds: 60),
        onTimeout: () {
          print('[FaceDetection] ERROR: Request timed out after 60 seconds');
          throw Exception('Request timed out. Please check your connection.');
        },
      );
      print('[FaceDetection] Response received!');
      print(
        '[FaceDetection] Response status code: ${streamedResponse.statusCode}',
      );

      var response = await http.Response.fromStream(streamedResponse);
      print(
        '[FaceDetection] Response body length: ${response.bodyBytes.length} bytes',
      );
      print('==============================================');

      if (response.statusCode == 200) {
        // API returns binary JPG image directly
        final Uint8List imageBytes = response.bodyBytes;

        if (imageBytes.isEmpty) {
          print('[FaceDetection] No image data in response');
          return null;
        }

        print('[FaceDetection] SUCCESS: Face image processed!');
        print(
          '[FaceDetection] Processed image size: ${imageBytes.length} bytes',
        );

        return FaceDetectionResult(imageBytes: imageBytes, status: 'success');
      } else if (response.statusCode == 422) {
        print('[FaceDetection] ERROR 422: Validation error');
        throw Exception('Invalid image format. Please use a valid image file.');
      } else {
        print(
          '[FaceDetection] ERROR: Unexpected status code ${response.statusCode}',
        );
        throw Exception(
          'API request failed with status ${response.statusCode}',
        );
      }
    } catch (e) {
      print('[FaceDetection] EXCEPTION: $e');
      print('==============================================');
      rethrow;
    }
  }
}
