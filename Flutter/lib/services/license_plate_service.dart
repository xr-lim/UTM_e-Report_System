import 'dart:io';
import 'package:http/http.dart' as http;
import 'dart:convert';

/// Result class for license plate detection
class PlateDetectionResult {
  final String plate;
  final double confidence;
  final String status;

  PlateDetectionResult({
    required this.plate,
    required this.confidence,
    required this.status,
  });

  factory PlateDetectionResult.fromJson(Map<String, dynamic> json) {
    return PlateDetectionResult(
      status: json['status'] as String? ?? '',
      plate: json['plate'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class LicensePlateService {
  // API endpoint for plate detection
  // Change this to your actual API URL
  static const String _apiUrl = 'http://172.20.10.5:8000/plate';

  /// Scans a vehicle image and extracts the license plate number
  ///
  /// Returns the license plate number as a string, or null if recognition fails
  static Future<String?> scanLicensePlate(File imageFile) async {
    final result = await detectPlate(imageFile);
    return result?.plate;
  }

  /// Scans a vehicle image and returns detailed plate detection result
  ///
  /// Returns PlateDetectionResult with plate, confidence and status
  static Future<PlateDetectionResult?> detectPlate(File imageFile) async {
    print('========== LICENSE PLATE API DEBUG ==========');
    print('[LicensePlate] Starting plate detection...');
    print('[LicensePlate] API URL: $_apiUrl');
    print('[LicensePlate] Image path: ${imageFile.path}');
    print('[LicensePlate] Image exists: ${imageFile.existsSync()}');

    if (imageFile.existsSync()) {
      final fileSize = await imageFile.length();
      print(
        '[LicensePlate] Image size: ${(fileSize / 1024).toStringAsFixed(2)} KB',
      );
    }

    try {
      // Create multipart request
      print('[LicensePlate] Creating multipart request...');
      var request = http.MultipartRequest('POST', Uri.parse(_apiUrl));

      // Add the image file with field name 'file' as per API spec
      print('[LicensePlate] Adding file to request with field name: "file"');
      request.files.add(
        await http.MultipartFile.fromPath('file', imageFile.path),
      );
      print(
        '[LicensePlate] File added. Total files in request: ${request.files.length}',
      );
      print('[LicensePlate] File field name: ${request.files.first.field}');
      print(
        '[LicensePlate] File content type: ${request.files.first.contentType}',
      );

      // Send the request with timeout
      print('[LicensePlate] Sending request to API...');
      var streamedResponse = await request.send().timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          print('[LicensePlate] ERROR: Request timed out after 30 seconds');
          throw Exception('Request timed out. Please check your connection.');
        },
      );
      print('[LicensePlate] Response received!');
      print(
        '[LicensePlate] Response status code: ${streamedResponse.statusCode}',
      );

      var response = await http.Response.fromStream(streamedResponse);
      print('[LicensePlate] Response body: ${response.body}');
      print('==============================================');

      if (response.statusCode == 200) {
        // Parse the response
        // Expected format: { "status": "string", "plate": "string", "confidence": 0 }
        final jsonResponse = json.decode(response.body) as Map<String, dynamic>;
        print('[LicensePlate] Parsed JSON: $jsonResponse');
        final result = PlateDetectionResult.fromJson(jsonResponse);
        print(
          '[LicensePlate] Plate: ${result.plate}, Status: ${result.status}, Confidence: ${result.confidence}',
        );

        // Check if plate was detected
        if (result.plate.isNotEmpty && result.status == 'success') {
          print('[LicensePlate] SUCCESS: Plate detected!');
          return PlateDetectionResult(
            status: result.status,
            plate: result.plate.trim().toUpperCase(),
            confidence: result.confidence,
          );
        }

        print('[LicensePlate] No plate detected or status not success');
        return null;
      } else if (response.statusCode == 422) {
        // Validation error - likely invalid file format
        print('[LicensePlate] ERROR 422: Validation error');
        throw Exception('Invalid image format. Please use a valid image file.');
      } else {
        print(
          '[LicensePlate] ERROR: Unexpected status code ${response.statusCode}',
        );
        throw Exception(
          'API request failed with status ${response.statusCode}',
        );
      }
    } catch (e) {
      // Log error for debugging
      print('[LicensePlate] EXCEPTION: $e');
      print('==============================================');
      rethrow;
    }
  }
}
