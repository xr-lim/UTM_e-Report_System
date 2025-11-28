import 'package:flutter/material.dart';

class TrafficReportScreen extends StatefulWidget {
  const TrafficReportScreen({super.key});

  @override
  State<TrafficReportScreen> createState() => _TrafficReportScreenState();
}

class _TrafficReportScreenState extends State<TrafficReportScreen> {
  final PageController _pageController = PageController();
  final TextEditingController _plateController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _locationNotesController = TextEditingController();

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
            'Upload Evidence',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          _ImageUploadCard(
            onUploadTap: () => _showSnackBar('Image picker coming soon'),
            onCameraTap: () => _showSnackBar('Camera support coming soon'),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _plateController,
            decoration: const InputDecoration(
              labelText: 'Plate Number',
              hintText: 'e.g. ABC1234',
            ),
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
          Container(
            height: 200,
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade400),
            ),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.map, size: 48, color: Colors.grey),
                  const SizedBox(height: 8),
                  Text(
                    _locationLabel ?? 'No location selected',
                    style: TextStyle(
                      color: _locationLabel == null
                          ? Colors.grey
                          : Colors.grey.shade800,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _locationLabel = 'Using current location (mock)';
                  });
                  _showSnackBar('Location capture to be implemented');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey[50],
                  foregroundColor: Colors.black,
                ),
                icon: const Icon(Icons.my_location),
                label: const Text('Use Current Location'),
              ),
              OutlinedButton.icon(
                onPressed: () {
                  setState(() {
                    _locationLabel = 'Map selection placeholder';
                  });
                  _showSnackBar('Map picker to be implemented');
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.black,
                  side: const BorderSide(color: Colors.black),
                ),
                icon: const Icon(Icons.place_outlined),
                label: const Text('Select on Map'),
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

class _ImageUploadCard extends StatelessWidget {
  const _ImageUploadCard({
    required this.onUploadTap,
    required this.onCameraTap,
  });

  final VoidCallback onUploadTap;
  final VoidCallback onCameraTap;

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
              height: 160,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: const Center(
                child: Icon(
                  Icons.camera_alt_outlined,
                  size: 48,
                  color: Colors.grey,
                ),
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


