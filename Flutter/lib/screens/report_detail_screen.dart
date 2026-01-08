import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

const _primaryColor = Color(0xFF42A5F5);
const _cardBackground = Color(0xFFF8FBFF);
const _labelColor = Color(0xFF64748B);
const _valueColor = Color(0xFF0F172A);

class ReportDetailScreen extends StatelessWidget {
  final String id;
  final Map<String, dynamic> data;

  const ReportDetailScreen({super.key, required this.id, required this.data});

  @override
  Widget build(BuildContext context) {
    final type = (data['type'] as String?)?.toLowerCase() ?? '';
    final category = (data['category'] as String?)?.trim() ?? '';
    final description = (data['description'] as String?)?.trim() ?? '';

    // support multiple possible image fields used by different collections
    final imageWithCp = (data['image_with_cp'] as String?) ??
      (data['image_with_face'] as String?) ??
      (data['image_with_vehicle'] as String?) ??
      '';

    // supporting images may be stored under different keys
    final rawSupporting = (data['supporting_images'] as List?) ??
      (data['supporting_image'] as List?) ??
      (data['supporting'] as List?) ??
      <dynamic>[];
    final supporting = rawSupporting.map((e) => e.toString()).toList();

    // suspect/enlarged face image (suspicious reports)
    final suspectFaceEnlarged = (data['suspect_face_enlarged'] as String?) ?? '';

    final plate = (data['plate_number'] as String?) ?? '';
    final status = (data['status'] as String?) ?? '';
    final locationVal = data['location'];
    final capitalizedType =
        type.isNotEmpty ? '${type[0].toUpperCase()}${type.substring(1)}' : 'Report';
    final statusLabel = status.isNotEmpty
        ? '${status[0].toUpperCase()}${status.substring(1)}'
        : 'Pending';

    double? lat;
    double? lng;
    if (locationVal is GeoPoint) {
      lat = locationVal.latitude;
      lng = locationVal.longitude;
    } else if (locationVal is Map) {
      if (locationVal['latitude'] != null && locationVal['longitude'] != null) {
        lat = (locationVal['latitude'] as num).toDouble();
        lng = (locationVal['longitude'] as num).toDouble();
      } else if (locationVal['lat'] != null && locationVal['lng'] != null) {
        lat = (locationVal['lat'] as num).toDouble();
        lng = (locationVal['lng'] as num).toDouble();
      }
    } else if (locationVal is String) {
      // parse common string formats like '37.4219983° N, 122.084° W' or '37.4219983, -122.084'
      final s = locationVal;
      final nums = RegExp(r'[-+]?\d+\.?\d*').allMatches(s).map((m) => double.parse(m.group(0)!)).toList();
      if (nums.length >= 2) {
        lat = nums[0];
        lng = nums[1];
        // adjust sign according to direction letters if present
        if (RegExp(r'[Ss]').hasMatch(s)) lat = -lat!.abs();
        if (RegExp(r'[Ww]').hasMatch(s)) lng = -lng!.abs();
      }
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: const Text('Report Details')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 36),
        child: Container(
          decoration: BoxDecoration(
            color: _cardBackground,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: _primaryColor.withOpacity(0.08)),
            boxShadow: [
              BoxShadow(
                color: _primaryColor.withOpacity(0.12),
                blurRadius: 24,
                offset: const Offset(0, 18),
              ),
            ],
          ),
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: _primaryColor,
                    child: Icon(
                      type == 'traffic'
                          ? Icons.directions_car
                          : Icons.shield_outlined,
                      size: 28,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          capitalizedType,
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: _valueColor,
                              ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Report ID: $id',
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(
                                fontSize: 14,
                                color: _labelColor,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        if (category.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          _tagChip(category),
                        ],
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _statusColor(statusLabel).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _statusIcon(statusLabel),
                          size: 16,
                          color: _statusColor(statusLabel),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          statusLabel,
                          style: TextStyle(
                            color: _statusColor(statusLabel),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const Divider(height: 1, thickness: 1),
              const SizedBox(height: 24),
              _infoSection(label: 'Description', value: description),
              if (imageWithCp.isNotEmpty) ...[
                const SizedBox(height: 24),
                _sectionTitle('Image with CP'),
                const SizedBox(height: 12),
                _networkImage(imageWithCp),
              ],
              if (suspectFaceEnlarged.isNotEmpty) ...[
                const SizedBox(height: 24),
                _sectionTitle('Suspect Face'),
                const SizedBox(height: 12),
                _networkImage(suspectFaceEnlarged),
              ],
              if (supporting.isNotEmpty) ...[
                const SizedBox(height: 24),
                _sectionTitle('Supporting Images'),
                const SizedBox(height: 12),
                SizedBox(
                  height: 120,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: supporting.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (context, i) => SizedBox(
                      width: 160,
                      child: _networkImage(supporting[i]),
                    ),
                  ),
                ),
              ],
              if (type == 'traffic' && plate.isNotEmpty) ...[
                const SizedBox(height: 24),
                _infoSection(label: 'Plate Number', value: plate),
              ],
              if (lat != null && lng != null) ...[
                const SizedBox(height: 24),
                _sectionTitle('Location'),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: SizedBox(
                    height: 220,
                    child: FlutterMap(
                      options: MapOptions(
                        center: LatLng(lat, lng),
                        initialZoom: 15,
                      ),
                      children: [
                        TileLayer(
                          urlTemplate:
                              'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                          subdomains: const ['a', 'b', 'c'],
                        ),
                        MarkerLayer(
                          markers: [
                            Marker(
                              point: LatLng(lat, lng),
                              width: 48,
                              height: 48,
                              child: Icon(
                                Icons.location_on,
                                color: _primaryColor,
                                size: 36,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoSection({required String label, required String value}) {
    if (value.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitle(label),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            color: _valueColor,
            fontSize: 16,
            height: 1.4,
          ),
        ),
      ],
    );
  }

  Widget _sectionTitle(String label) {
    return Text(
      label,
      style: const TextStyle(
        fontWeight: FontWeight.w700,
        fontSize: 16,
        color: _valueColor,
      ),
    );
  }

  Widget _tagChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: _primaryColor.withOpacity(0.25)),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          color: _primaryColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _networkImage(String url) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Image.network(
          url,
          fit: BoxFit.cover,
          errorBuilder: (context, _, __) => Container(
            color: Colors.grey[200],
            child: const Icon(
              Icons.broken_image,
              size: 40,
              color: Colors.grey,
            ),
          ),
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'in progress':
      case 'processing':
        return const Color(0xFFFB8C00);
      case 'resolved':
      case 'completed':
        return const Color(0xFF2E7D32);
      case 'rejected':
      case 'cancelled':
        return const Color(0xFFC62828);
      default:
        return _primaryColor;
    }
  }

  IconData _statusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'in progress':
      case 'processing':
        return Icons.autorenew;
      case 'resolved':
      case 'completed':
        return Icons.verified;
      case 'rejected':
      case 'cancelled':
        return Icons.cancel;
      case 'pending':
        return Icons.more_horiz;
      default:
        return Icons.info_outline;
    }
  }
}
