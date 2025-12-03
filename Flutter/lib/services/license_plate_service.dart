import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'dart:convert';

class LicensePlateService {
  // You can configure the API endpoint in your .env file
  // For example: LICENSE_PLATE_API_URL=https://your-api-endpoint.com/recognize
  static String? get _apiUrl => dotenv.maybeGet('LICENSE_PLATE_API_URL');

  /// Scans a vehicle image and extracts the license plate number
  /// 
  /// Returns the license plate number as a string, or null if recognition fails
  static Future<String?> scanLicensePlate(File imageFile) async {
    try {
      // Check if API URL is configured
      if (_apiUrl == null || _apiUrl!.isEmpty) {
        throw Exception('License plate API URL not configured. Please add LICENSE_PLATE_API_URL to your .env file');
      }

      // Create multipart request
      var request = http.MultipartRequest('POST', Uri.parse(_apiUrl!));
      
      // Add the image file
      request.files.add(
        await http.MultipartFile.fromPath('image', imageFile.path),
      );

      // Optional: Add any additional headers if your API requires them
      // request.headers['Authorization'] = 'Bearer YOUR_API_KEY';
      // request.headers['X-API-Key'] = dotenv.maybeGet('LICENSE_PLATE_API_KEY') ?? '';

      // Send the request
      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        // Parse the response
        final jsonResponse = json.decode(response.body);
        
        // Adjust these keys based on your API's response format
        // Common response formats:
        // { "plate_number": "ABC1234" }
        // { "data": { "plate": "ABC1234" } }
        // { "result": "ABC1234" }
        
        String? plateNumber;
        
        if (jsonResponse is Map<String, dynamic>) {
          // Try different possible response formats
          plateNumber = jsonResponse['plate_number'] as String? ??
                       jsonResponse['plate'] as String? ??
                       jsonResponse['result'] as String? ??
                       jsonResponse['text'] as String?;
          
          // If nested in 'data' object
          if (plateNumber == null && jsonResponse['data'] != null) {
            final data = jsonResponse['data'] as Map<String, dynamic>?;
            plateNumber = data?['plate_number'] as String? ??
                         data?['plate'] as String? ??
                         data?['result'] as String?;
          }
        } else if (jsonResponse is String) {
          // If API returns plain string
          plateNumber = jsonResponse;
        }

        // Clean and validate the plate number
        if (plateNumber != null && plateNumber.isNotEmpty) {
          // Remove whitespace and convert to uppercase
          plateNumber = plateNumber.trim().toUpperCase();
          return plateNumber;
        }
        
        return null;
      } else {
        throw Exception('API request failed with status ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      // Log error for debugging
      print('License plate recognition error: $e');
      rethrow;
    }
  }
}

