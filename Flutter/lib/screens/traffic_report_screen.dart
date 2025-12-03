import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geocoding/geocoding.dart' as geocoding;
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart' as latlng;
import '../services/license_plate_service.dart';

class TrafficReportScreen extends StatefulWidget {
  const TrafficReportScreen({super.key});

  @override
  State<TrafficReportScreen> createState() => _TrafficReportScreenState();
}

class _TrafficReportScreenState extends State<TrafficReportScreen> {
  static const latlng.LatLng _utmCampusCenter = latlng.LatLng(1.5631, 103.6368);

  final PageController _pageController = PageController();
  final TextEditingController _plateController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _locationNotesController = TextEditingController();
  final ImagePicker _picker = ImagePicker();

  XFile? _vehicleImage;
  final List<XFile> _supportingImages = [];

  final List<String> _categories = const [
    'Accident',
    'Illegal Parking',
    'Speeding',
    'Hit and Run',
    'Other',
  ];

  String? _selectedCategory;
  int _currentPage = 0;
  String? _locationLabel;
  latlng.LatLng? _selectedLatLng;
  bool _isScanningPlate = false;
  bool _isLocating = false;

  @override
  void dispose() {
    _pageController.dispose();
    _plateController.dispose();
    _descriptionController.dispose();
    _locationNotesController.dispose();
    super.dispose();
  }

  void _goToPage(int page) {
    setState(() => _currentPage = page);
    _pageController.animateToPage(
      page,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _nextPage() {
    if (_currentPage == 0 && !_validateFirstPage()) return;
    if (_currentPage == 1 && !_validateSecondPage()) return;
    if (_currentPage < 2) {
      _goToPage(_currentPage + 1);
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _goToPage(_currentPage - 1);
    }
  }

  bool _validateFirstPage() {
    if (_selectedCategory == null) {
      _showSnackBar('Please choose a category.');
      return false;
    }

    if (_vehicleImage == null) {
      _showSnackBar('Please upload a vehicle photo with the plate visible.');
      return false;
    }

    if (_descriptionController.text.trim().isEmpty) {
      _showSnackBar('Please add a short description.');
      return false;
    }

    return true;
  }

  bool _validateSecondPage() {
    if (_locationLabel == null || _locationLabel!.isEmpty) {
      _showSnackBar('Please add a location.');
      return false;
    }
    return true;
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> _pickVehicleImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 80,
      );

      if (image == null) return;

      setState(() {
        _vehicleImage = image;
        _isScanningPlate = true;
      });

      // Automatically scan license plate from the uploaded image
      await _scanLicensePlate(image);
    } catch (e) {
      _showSnackBar('Failed to pick image. Please try again.');
      setState(() {
        _isScanningPlate = false;
      });
    }
  }

  Future<void> _scanLicensePlate(XFile imageFile) async {
    try {
      final File file = File(imageFile.path);
      final String? plateNumber = await LicensePlateService.scanLicensePlate(file);

      setState(() {
        _isScanningPlate = false;
      });

      if (plateNumber != null && plateNumber.isNotEmpty) {
        // Auto-fill the plate number text field
        _plateController.text = plateNumber;
        _showSnackBar('License plate detected: $plateNumber');
      } else {
        _showSnackBar('Could not detect license plate. Please enter manually.');
      }
    } catch (e) {
      setState(() {
        _isScanningPlate = false;
      });
      
      // Show user-friendly error message
      String errorMessage = 'Failed to scan license plate.';
      if (e.toString().contains('API URL not configured')) {
        errorMessage = 'License plate API not configured. Please contact support.';
      } else if (e.toString().contains('status')) {
        errorMessage = 'License plate service unavailable. Please try again later.';
      }
      
      _showSnackBar(errorMessage);
      debugPrint('License plate scanning error: $e');
    }
  }

  int get _remainingSupportingSlots => 5 - _supportingImages.length;

  Future<void> _addSupportingFromGallery() async {
    if (_remainingSupportingSlots <= 0) {
      _showSnackBar('Maximum of 5 supporting images reached.');
      return;
    }

    try {
      final images = await _picker.pickMultiImage(
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 80,
      );

      if (images.isEmpty) return;

      final allowed = images.take(_remainingSupportingSlots).toList();
      setState(() => _supportingImages.addAll(allowed));

      if (images.length > allowed.length) {
        _showSnackBar('Only the first ${allowed.length} images were added (limit 5).');
      }
    } catch (e) {
      _showSnackBar('Failed to pick images. Please try again.');
    }
  }

  Future<void> _addSupportingFromCamera() async {
    if (_remainingSupportingSlots <= 0) {
      _showSnackBar('Maximum of 5 supporting images reached.');
      return;
    }

    try {
      final image = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 80,
      );

      if (image == null) return;
      setState(() => _supportingImages.add(image));
    } catch (e) {
      _showSnackBar('Failed to capture image. Please try again.');
    }
  }

  void _removeSupportingImage(int index) {
    setState(() => _supportingImages.removeAt(index));
  }

  Future<bool> _ensureLocationPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _showSnackBar('Please enable location services.');
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _showSnackBar('Location permission is required.');
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      _showSnackBar(
          'Location permissions are permanently denied. Enable them in settings.');
      return false;
    }

    return true;
  }

  Future<String> _reverseGeocode(latlng.LatLng coords) async {
    try {
      final placemarks = await geocoding.placemarkFromCoordinates(
        coords.latitude,
        coords.longitude,
      );

      if (placemarks.isNotEmpty) {
        final placemark = placemarks.first;
        final parts = [
          placemark.name,
          placemark.street,
          placemark.locality,
          placemark.administrativeArea,
        ]
            .whereType<String>()
            .map((part) => part.trim())
            .where((part) => part.isNotEmpty)
            .toList();
        if (parts.isNotEmpty) {
          return parts.join(', ');
        }
      }
    } catch (e) {
      debugPrint('Reverse geocoding failed: $e');
    }

    return _formatCoordinates(coords);
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _isLocating = true);
    try {
      final hasPermission = await _ensureLocationPermission();
      if (!hasPermission) {
        setState(() => _isLocating = false);
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      final coords = latlng.LatLng(position.latitude, position.longitude);
      final readableLabel = await _reverseGeocode(coords);

      setState(() {
        _selectedLatLng = coords;
        _locationLabel = readableLabel;
        _isLocating = false;
      });
    } catch (e) {
      setState(() => _isLocating = false);
      _showSnackBar('Failed to capture current location.');
      debugPrint('Current location error: $e');
    }
  }

  Future<void> _openMapPicker() async {
    final startingPoint = _selectedLatLng ?? _utmCampusCenter;
    final result = await showModalBottomSheet<latlng.LatLng>(
      context: context,
      isScrollControlled: true,
      builder: (context) => FractionallySizedBox(
        heightFactor: 0.9,
        child: _MapPicker(initialPosition: startingPoint),
      ),
    );

    if (result != null) {
      final readableLabel = await _reverseGeocode(result);
      setState(() {
        _selectedLatLng = result;
        _locationLabel = readableLabel;
      });
    }
  }

  String _formatCoordinates(latlng.LatLng coords) =>
      '${coords.latitude.toStringAsFixed(5)}, ${coords.longitude.toStringAsFixed(5)}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Traffic Report'),
      ),
      body: Column(
        children: [
          const SizedBox(height: 16),
          _StepIndicator(currentStep: _currentPage),
          const SizedBox(height: 16),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildImageAndDetailsPage(),
                _buildLocationPage(),
                _buildConfirmationPage(),
              ],
            ),
          ),
          _buildNavigation(),
        ],
      ),
    );
  }

  Widget _buildImageAndDetailsPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Vehicle Photo (Required)',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          const Text(
            'Please include a clear photo of the vehicle with the license plate visible.',
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 12),
          _VehicleImageCard(
            imageFile: _vehicleImage == null ? null : File(_vehicleImage!.path),
            onUploadTap: () => _pickVehicleImage(ImageSource.gallery),
            onCameraTap: () => _pickVehicleImage(ImageSource.camera),
            isScanning: _isScanningPlate,
          ),
          const SizedBox(height: 24),
          const Text(
            'Supporting Images (Optional, max 5)',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          const Text(
            'Add close-ups, wider shots, or other photos that help explain the incident.',
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 12),
          _SupportingImagesSection(
            images: _supportingImages,
            onAddFromCamera: _addSupportingFromCamera,
            onAddFromGallery: _addSupportingFromGallery,
            onRemove: _removeSupportingImage,
            remainingSlots: _remainingSupportingSlots,
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _plateController,
            decoration: InputDecoration(
              labelText: 'Plate Number',
              hintText: 'e.g. ABC1234',
              suffixIcon: _isScanningPlate
                  ? const Padding(
                      padding: EdgeInsets.all(12.0),
                      child: SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : null,
            ),
            enabled: !_isScanningPlate,
          ),
          const SizedBox(height: 24),
          DropdownButtonFormField<String>(
            value: _selectedCategory,
            items: _categories
                .map(
                  (category) => DropdownMenuItem(
                    value: category,
                    child: Text(category),
                  ),
                )
                .toList(),
            decoration: const InputDecoration(
              labelText: 'Category',
            ),
            onChanged: (value) => setState(() => _selectedCategory = value),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _descriptionController,
            minLines: 4,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText: 'Description',
              hintText: 'Provide additional details about the incident.',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Incident Location',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          _buildMapPreview(),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              ElevatedButton.icon(
                onPressed: _isLocating ? null : _useCurrentLocation,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey[50],
                  foregroundColor: Colors.black,
                ),
                icon: _isLocating
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.my_location),
                label: Text(_isLocating ? 'Locating...' : 'Use Current Location'),
              ),
              OutlinedButton.icon(
                onPressed: _openMapPicker,
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.black,
                  side: const BorderSide(color: Colors.black),
                ),
                icon: const Icon(Icons.place_outlined),
                label: const Text('Select on Map'),
              ),
              if (_selectedLatLng != null)
                TextButton.icon(
                  onPressed: () {
                    setState(() {
                      _selectedLatLng = null;
                      _locationLabel = null;
                    });
                  },
                  icon: const Icon(Icons.clear),
                  label: const Text('Clear Selection'),
                ),
            ],
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _locationNotesController,
            minLines: 3,
            maxLines: 5,
            decoration: const InputDecoration(
              labelText: 'Location Notes (optional)',
              hintText: 'Landmarks, directions or additional guidance.',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMapPreview() {
    if (_selectedLatLng == null) {
      return Container(
        height: 220,
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.map_outlined, size: 48, color: Colors.grey),
              const SizedBox(height: 8),
              Text(
                'No location selected',
                style: TextStyle(color: Colors.grey.shade700),
              ),
            ],
          ),
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        height: 220,
        child: Stack(
          children: [
            FlutterMap(
              options: MapOptions(
                initialCenter: _selectedLatLng!,
                initialZoom: 16,
                interactionOptions:
                    const InteractionOptions(flags: InteractiveFlag.none),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'utm_report_system',
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: _selectedLatLng!,
                      width: 40,
                      height: 40,
                      alignment: Alignment.topCenter,
                      child: const Icon(
                        Icons.location_on,
                        color: Colors.redAccent,
                        size: 40,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            Positioned(
              left: 12,
              right: 12,
              top: 12,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _locationLabel ?? _formatCoordinates(_selectedLatLng!),
                  style: const TextStyle(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConfirmationPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Confirm Details',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),
          Card(
            color: Colors.grey[50],
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSummaryRow('Category', _selectedCategory ?? '-'),
                  _buildSummaryRow(
                      'Plate No.', _plateController.text.trim().isEmpty
                          ? '-'
                          : _plateController.text.trim()),
                  _buildSummaryRow(
                      'Vehicle Photo', _vehicleImage == null ? 'Not attached' : 'Attached'),
                  _buildSummaryRow(
                      'Supporting Photos',
                      _supportingImages.isEmpty
                          ? 'None'
                          : '${_supportingImages.length} attached'),
                  _buildSummaryRow(
                      'Description',
                      _descriptionController.text.trim().isEmpty
                          ? '-'
                          : _descriptionController.text.trim()),
                  _buildSummaryRow(
                      'Location', _locationLabel ?? 'Not provided yet'),
                  _buildSummaryRow(
                      'Location Notes',
                      _locationNotesController.text.trim().isEmpty
                          ? '-'
                          : _locationNotesController.text.trim()),
                  _buildSummaryRow('Status', 'Pending'),
                  _buildSummaryRow('Type', 'Traffic'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'You will still be able to edit before submitting once we add backend integration.',
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }

  Widget _buildNavigation() {
    return SafeArea(
      minimum: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Row(
        children: [
          if (_currentPage > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: _previousPage,
                child: const Text('Back'),
              ),
            ),
          if (_currentPage > 0) const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: _currentPage == 2 ? _showSubmitSoon : _nextPage,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
              child: Text(_currentPage == 2 ? 'Submit' : 'Next'),
            ),
          ),
        ],
      ),
    );
  }

  void _showSubmitSoon() {
    _showSnackBar('Submission flow will be implemented soon.');
  }
}

class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.currentStep});

  final int currentStep;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(
          3,
          (index) => Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: index <= currentStep
                    ? Colors.blue
                    : Colors.grey.shade300,
                child: Text(
                  '${index + 1}',
                  style: TextStyle(
                    color: index <= currentStep ? Colors.white : Colors.grey,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              if (index < 2)
                Container(
                  width: 40,
                  height: 2,
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  color: index < currentStep
                      ? Colors.blue
                      : Colors.grey.shade300,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _VehicleImageCard extends StatelessWidget {
  const _VehicleImageCard({
    required this.onUploadTap,
    required this.onCameraTap,
    this.imageFile,
    this.isScanning = false,
  });

  final VoidCallback onUploadTap;
  final VoidCallback onCameraTap;
  final File? imageFile;
  final bool isScanning;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: Colors.grey[200],
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: imageFile == null
                  ? const Center(
                      child: Icon(
                        Icons.camera_alt_outlined,
                        size: 48,
                        color: Colors.grey,
                      ),
                    )
                  : Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(
                            imageFile!,
                            fit: BoxFit.cover,
                          ),
                        ),
                        if (isScanning)
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.5),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  CircularProgressIndicator(
                                    color: Colors.white,
                                  ),
                                  SizedBox(height: 12),
                                  Text(
                                    'Scanning license plate...',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onCameraTap,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[50],
                      foregroundColor: Colors.black,
                    ),
                    icon: const Icon(Icons.photo_camera_outlined),
                    label: const Text('Take Photo'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onUploadTap,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[50],
                      foregroundColor: Colors.black,
                    ),
                    icon: const Icon(Icons.photo_library_outlined),
                    label: const Text('Upload'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SupportingImagesSection extends StatelessWidget {
  const _SupportingImagesSection({
    required this.images,
    required this.onAddFromCamera,
    required this.onAddFromGallery,
    required this.onRemove,
    required this.remainingSlots,
  });

  final List<XFile> images;
  final VoidCallback onAddFromCamera;
  final VoidCallback onAddFromGallery;
  final void Function(int index) onRemove;
  final int remainingSlots;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            ElevatedButton.icon(
              onPressed: remainingSlots > 0 ? onAddFromCamera : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.grey[50],
                foregroundColor: Colors.black,
              ),
              icon: const Icon(Icons.photo_camera),
              label: Text(
                remainingSlots > 0 ? 'Camera' : 'Limit reached',
              ),
            ),
            OutlinedButton.icon(
              onPressed: remainingSlots > 0 ? onAddFromGallery : null,
              icon: const Icon(Icons.photo_library_outlined),
              label: const Text('Gallery'),
            ),
            Text(
              'Remaining: $remainingSlots',
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (images.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 24),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: Column(
              children: [
                Icon(Icons.collections_outlined, color: Colors.grey.shade500),
                const SizedBox(height: 8),
                const Text(
                  'No supporting images yet.',
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
          )
        else
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: List.generate(images.length, (index) {
              final file = File(images[index].path);
              return Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.file(
                      file,
                      width: 100,
                      height: 100,
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    top: 4,
                    right: 4,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: InkWell(
                        onTap: () => onRemove(index),
                        child: const Padding(
                          padding: EdgeInsets.all(2),
                          child: Icon(
                            Icons.close,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }),
          ),
      ],
    );
  }
}

class _MapPicker extends StatefulWidget {
  const _MapPicker({required this.initialPosition});

  final latlng.LatLng initialPosition;

  @override
  State<_MapPicker> createState() => _MapPickerState();
}

class _MapPickerState extends State<_MapPicker> {
  late latlng.LatLng _tempSelection;
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _tempSelection = widget.initialPosition;
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 48,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade400,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Select Location on Map',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: widget.initialPosition,
                    initialZoom: 16,
                    interactionOptions: const InteractionOptions(
                      flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
                    ),
                    onTap: (_, point) {
                      setState(() => _tempSelection = point);
                    },
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'utm_report_system',
                    ),
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: _tempSelection,
                          width: 48,
                          height: 48,
                          alignment: Alignment.topCenter,
                          child: const Icon(
                            Icons.location_pin,
                            size: 48,
                            color: Colors.redAccent,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Lat: ${_tempSelection.latitude.toStringAsFixed(5)}, '
              'Lng: ${_tempSelection.longitude.toStringAsFixed(5)}',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.of(context).pop(_tempSelection),
                icon: const Icon(Icons.check_circle_outline),
                label: const Text('Use This Location'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}



