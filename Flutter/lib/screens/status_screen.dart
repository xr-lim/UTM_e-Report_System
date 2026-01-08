import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'report_detail_screen.dart';

class StatusScreen extends StatefulWidget {
  const StatusScreen({super.key});

  @override
  State<StatusScreen> createState() => _StatusScreenState();
}

class _StatusScreenState extends State<StatusScreen> {
  String _selectedFilter = _statusFilters.first.value;

  static const List<_StatusFilter> _statusFilters = [
    _StatusFilter(
      label: 'All',
      value: 'all',
      icon: Icons.check_circle,
    ),
    _StatusFilter(
      label: 'Pending',
      value: 'pending',
      icon: Icons.more_horiz,
    ),
    _StatusFilter(
      label: 'In Review',
      value: 'in review',
      icon: Icons.groups_outlined,
    ),
    _StatusFilter(
      label: 'Resolved',
      value: 'resolved',
      icon: Icons.verified_outlined,
    ),
    _StatusFilter(
      label: 'Rejected',
      value: 'rejected',
      icon: Icons.cancel_outlined,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    // Create a combined stream that listens to both suspicious_reports and traffic_reports
    Stream<List<QueryDocumentSnapshot<Map<String, dynamic>>>> combinedStream() {
      final firestore = FirebaseFirestore.instance;

      return Stream.multi((controller) {
        StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? subA;
        StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? subB;

        var latestA = <QueryDocumentSnapshot<Map<String, dynamic>>>[];
        var latestB = <QueryDocumentSnapshot<Map<String, dynamic>>>[];

        Query<Map<String, dynamic>> qA = firestore.collection('suspicious_reports');
        Query<Map<String, dynamic>> qB = firestore.collection('traffic_reports');

        if (user != null) {
          final userRef = firestore.collection('users').doc(user.uid);
          qA = qA.where('reporter', isEqualTo: userRef);
          qB = qB.where('reporter', isEqualTo: userRef);
        }

        if (_selectedFilter != 'all') {
          qA = qA.where('status', isEqualTo: _selectedFilter);
          qB = qB.where('status', isEqualTo: _selectedFilter);
        }

        subA = qA.snapshots().listen((snap) {
          latestA = snap.docs;
          controller.add([...latestA, ...latestB]);
        });

        subB = qB.snapshots().listen((snap) {
          latestB = snap.docs;
          controller.add([...latestA, ...latestB]);
        });

        controller.onCancel = () {
          subA?.cancel();
          subB?.cancel();
        };
      });
    }

    final stream = combinedStream();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Report Status'),
      ),
      body: StreamBuilder<List<QueryDocumentSnapshot<Map<String, dynamic>>>>(
        stream: stream,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.warning_amber, size: 48, color: Colors.red),
                    const SizedBox(height: 16),
                    Text(
                      'We could not load your report status right now.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: Colors.grey[700]),
                    ),
                  ],
                ),
              ),
            );
          }

          final reports = snapshot.data ?? [];

          String? emptyMessage;
          if (reports.isEmpty) {
            final selectedFilter =
                _statusFilters.firstWhere((f) => f.value == _selectedFilter);
            emptyMessage = _selectedFilter != 'all'
                ? 'No reports with status "${selectedFilter.label}".'
                : (user != null
                    ? 'You have not submitted any reports yet.'
                    : 'No reports available.');
          }

          return Column(
            children: [
              Padding(
                 padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                 child: SingleChildScrollView(
                   scrollDirection: Axis.horizontal,
                   child: Row(
                     children: _statusFilters.map((filter) {
                       final selected = _selectedFilter == filter.value;

                       return Padding(
                         padding: const EdgeInsets.only(right: 10),
                         child: GestureDetector(
                           onTap: () => setState(() => _selectedFilter = filter.value),
                           child: AnimatedContainer(
                             duration: const Duration(milliseconds: 180),
                             curve: Curves.easeInOut,
                             padding: const EdgeInsets.symmetric(
                               horizontal: 18,
                               vertical: 12,
                             ),
                             decoration: BoxDecoration(
                               color: selected ? const Color(0xFF1A73E8) : Colors.white,
                               borderRadius: BorderRadius.circular(24),
                               border: Border.all(
                                 color:
                                     selected ? Colors.transparent : Colors.grey.shade300,
                               ),
                               boxShadow: selected
                                   ? [
                                       BoxShadow(
                                         color: const Color(0xFF1A73E8).withOpacity(0.35),
                                         blurRadius: 12,
                                         offset: const Offset(0, 6),
                                       ),
                                     ]
                                   : [],
                             ),
                             child: Row(
                               children: [
                                 Icon(
                                   filter.icon,
                                   size: 18,
                                   color: selected ? Colors.white : Colors.grey.shade600,
                                 ),
                                 const SizedBox(width: 8),
                                 Text(
                                   filter.label,
                                   style: Theme.of(context)
                                       .textTheme
                                       .bodyMedium
                                       ?.copyWith(
                                         color: selected
                                             ? Colors.white
                                             : const Color(0xFF374151),
                                         fontWeight: selected
                                             ? FontWeight.w700
                                             : FontWeight.w600,
                                       ),
                                 ),
                               ],
                             ),
                           ),
                         ),
                       );
                     }).toList(),
                   ),
                 ),
               ),
              Expanded(
                child: emptyMessage != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Text(
                            emptyMessage,
                            textAlign: TextAlign.center,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(color: Colors.grey[600]),
                          ),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 36),
                        itemCount: reports.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final data = reports[index].data();
                          final title = (data['title'] as String?)?.trim();
                          final type = (data['type'] as String?)?.trim();
                          final status = (data['status'] as String?)?.trim();
                          final createdAt = data['createdAt'];

                          final subtitle = type?.isNotEmpty == true
                              ? type![0].toUpperCase() + type.substring(1)
                              : 'Report';

                          final statusLabel = status?.isNotEmpty == true
                              ? status![0].toUpperCase() + status.substring(1)
                              : 'Pending';

                          String? submittedOn;
                          if (createdAt is Timestamp) {
                            final date = createdAt.toDate();
                            submittedOn =
                                '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
                          }

                          return GestureDetector(
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => ReportDetailScreen(
                                    id: reports[index].id,
                                    data: data,
                                  ),
                                ),
                              );
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    const Color(0xFFF5F7FA),
                                    const Color(0xFFE9F0FF),
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(22),
                                border: Border.all(
                                  color: Colors.blueGrey.withOpacity(0.12),
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.blueGrey.withOpacity(0.12),
                                    blurRadius: 18,
                                    offset: const Offset(0, 12),
                                  ),
                                ],
                              ),
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 24,
                                        backgroundColor:
                                            Theme.of(context).colorScheme.primary,
                                        child: const Icon(
                                          Icons.assignment_outlined,
                                          color: Colors.white,
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              title?.isNotEmpty == true
                                                  ? title!
                                                  : reports[index].id,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleMedium
                                                  ?.copyWith(
                                                    fontWeight: FontWeight.w700,
                                                    color:
                                                        const Color(0xFF0F172A),
                                                  ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              subtitle,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall
                                                  ?.copyWith(
                                                    color:
                                                        const Color(0xFF475569),
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: _statusColor(statusLabel)
                                              .withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(999),
                                        ),
                                        child: Row(
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
                                  if (submittedOn != null) ...[
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.schedule,
                                          size: 16,
                                          color: Colors.grey.shade600,
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          'Submitted on $submittedOn',
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodySmall
                                              ?.copyWith(
                                                color: Colors.grey[600],
                                                fontWeight: FontWeight.w600,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                ),
              ),
            ],
          );
        },
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
        return const Color(0xFF1976D2);
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

class _StatusFilter {
  const _StatusFilter({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;
}

