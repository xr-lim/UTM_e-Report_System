import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'dart:ui';
import 'components/center_widget/center_widget.dart';
import 'components/login_content.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Widget topWidget(double screenWidth) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.rotate(
          angle: -35 * math.pi / 180 + (_controller.value * 2 * math.pi * 0.02),
          child: Container(
            width: 1.2 * screenWidth,
            height: 1.2 * screenWidth,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(200),
              gradient: const LinearGradient(
                begin: Alignment(-0.3, -0.9),
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFFFFFFFF),
                  Color(0xFF1B56FD),
                  Color(0xFF0118D8),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF1B56FD).withOpacity(0.3),
                  blurRadius: 60,
                  spreadRadius: 10,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget bottomWidget(double screenWidth) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.rotate(
          angle: _controller.value * 2 * math.pi * 0.015,
          child: Container(
            width: 1.5 * screenWidth,
            height: 1.5 * screenWidth,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                begin: Alignment(0.6, -1.1),
                end: Alignment(0.7, 0.8),
                colors: [
                  Color(0xFFFFFFFF),
                  Color(0xFF1B56FD),
                  Color(0xFF0118D8),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF1B56FD).withOpacity(0.3),
                  blurRadius: 80,
                  spreadRadius: 20,
                ),                                                                                                                                                                                                                                                                         
              ],
            ),
          ),                                                     
        );                      
      },
    );                      
  }                                          

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;

    return Scaffold(
      body: Stack(
        children: [
          // Gradient Background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF0118D8),
                  Color(0xFF1B56FD),
                  Color(0xFF0118D8),
                ],
              ),
            ),
          ),
          // Top decorative widget
          Positioned(top: -160, left: -30, child: topWidget(screenSize.width)),
          // Bottom decorative widget
          Positioned(
            bottom: -180,
            left: -40,
            child: bottomWidget(screenSize.width),
          ),
          // Glassmorphism overlay
          BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
            child: Container(color: Colors.transparent),
          ),
          // Content
          CenterWidget(size: screenSize),
          const LoginContent(),
        ],
      ),
    );
  }
}
