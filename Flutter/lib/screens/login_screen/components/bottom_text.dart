import 'package:flutter/material.dart';
import 'package:utm_report_system/screens/login_screen/animations/change_screen_animation.dart';
import 'package:utm_report_system/utils/helper_functions.dart';

import '../../../utils/constants.dart';
import 'login_content.dart';

class BottomText extends StatefulWidget {
  const BottomText({Key? key}) : super(key: key);

  @override
  State<BottomText> createState() => _BottomTextState();
}

class _BottomTextState extends State<BottomText> {
  // Beautiful gradient colors matching the theme
  static const Color _gradientStart = Color(0xFF4A90E2);
  static const Color _gradientMid = Color(0xFF50C9C3);
  static const Color _gradientEnd = Color(0xFF5FB3D5);

  bool _isHovered = false;

  @override
  void initState() {
    ChangeScreenAnimation.bottomTextAnimation.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        setState(() {});
      }
    });

    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return HelperFunctions.wrapWithAnimatedBuilder(
      animation: ChangeScreenAnimation.bottomTextAnimation,
      child: MouseRegion(
        onEnter: (_) => setState(() => _isHovered = true),
        onExit: (_) => setState(() => _isHovered = false),
        child: GestureDetector(
          onTap: () {
            if (!ChangeScreenAnimation.isPlaying) {
              ChangeScreenAnimation.currentScreen == Screens.createAccount
                  ? ChangeScreenAnimation.forward()
                  : ChangeScreenAnimation.reverse();

              ChangeScreenAnimation.currentScreen =
                  Screens.values[1 - ChangeScreenAnimation.currentScreen.index];
            }
          },
          behavior: HitTestBehavior.opaque,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withOpacity(_isHovered ? 0.95 : 0.85),
                  Colors.white.withOpacity(_isHovered ? 0.9 : 0.75),
                ],
              ),
              borderRadius: BorderRadius.circular(30),
              border: Border.all(
                color: _isHovered 
                    ? _gradientStart.withOpacity(0.4) 
                    : Colors.white.withOpacity(0.5),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: _gradientStart.withOpacity(_isHovered ? 0.25 : 0.15),
                  blurRadius: _isHovered ? 25 : 15,
                  offset: const Offset(0, 8),
                ),
                BoxShadow(
                  color: _gradientMid.withOpacity(_isHovered ? 0.15 : 0.08),
                  blurRadius: _isHovered ? 35 : 25,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  ChangeScreenAnimation.currentScreen == Screens.createAccount
                      ? 'Already have an account? '
                      : 'Don\'t have an account? ',
                  style: TextStyle(
                    fontSize: 15,
                    fontFamily: 'Montserrat',
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF636E72),
                    letterSpacing: 0.3,
                  ),
                ),
                ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [_gradientStart, _gradientMid, _gradientEnd],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ).createShader(bounds),
                  child: AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 200),
                    style: TextStyle(
                      fontSize: _isHovered ? 16 : 15,
                      fontFamily: 'Montserrat',
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
                    child: Text(
                      ChangeScreenAnimation.currentScreen == Screens.createAccount
                          ? 'Log In'
                          : 'Sign Up',
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  transform: Matrix4.translationValues(_isHovered ? 4 : 0, 0, 0),
                  child: ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      colors: [_gradientStart, _gradientMid],
                    ).createShader(bounds),
                    child: Icon(
                      ChangeScreenAnimation.currentScreen == Screens.createAccount
                          ? Icons.login_rounded
                          : Icons.person_add_rounded,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
