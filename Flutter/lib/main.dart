import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'utils/constants.dart';
import 'screens/auth_screen.dart';
import 'screens/auth_wrapper.dart';
import 'screens/home_screen.dart';
import 'custom_firebase_options.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: "assets/.env");

  await Firebase.initializeApp(options: CustomFirebaseOptions.currentPlatform);
  runApp(const MyApp()); // Your main app widget
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'UTM Report System',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        scaffoldBackgroundColor: kBackgroundColor,
        textTheme: Theme.of(
          context,
        ).textTheme.apply(bodyColor: kPrimaryColor, fontFamily: 'Montserrat'),
      ),
      home: const AuthWrapper(),
      routes: {
        '/login': (context) => const AuthScreen(),
        '/home': (context) => const HomeScreen(),
      },
    );
  }
}
