import 'package:flutter/material.dart';
import 'package:utm_report_system/screens/login_screen/animations/change_screen_animation.dart';
import 'package:utm_report_system/utils/helper_functions.dart';
import 'login_content.dart';

class TopText extends StatefulWidget {
  const TopText({Key? key}) : super(key: key);

  @override
  State<TopText> createState() => _TopTextState();
}

class _TopTextState extends State<TopText> {
  @override
  void initState() {
    ChangeScreenAnimation.topTextAnimation.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        setState(() {});
      }
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return HelperFunctions.wrapWithAnimatedBuilder(
      animation: ChangeScreenAnimation.topTextAnimation,
      child: ShaderMask(
        shaderCallback: (bounds) => const LinearGradient(
          colors: [
            Color.fromARGB(255, 74, 226, 218),
            Color(0xFF50C9C3),
            Color.fromARGB(255, 174, 210, 224),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ).createShader(bounds),
        child: Text(
          ChangeScreenAnimation.currentScreen == Screens.createAccount
              ? 'Create\nAccount'
              : 'Welcome\nBack',
          style: TextStyle(
            fontSize: 48,
            fontWeight: FontWeight.w800,
            color: Colors.white,
            height: 1.2,
            letterSpacing: -1.5,
            shadows: [
              Shadow(
                color: const Color(0xFF4A90E2).withOpacity(0.3),
                offset: const Offset(0, 4),
                blurRadius: 12,
              ),
              Shadow(
                color: const Color(0xFF50C9C3).withOpacity(0.2),
                offset: const Offset(0, 8),
                blurRadius: 24,
              ),
            ],
          ),
        ),
      ),
    );
  }
}