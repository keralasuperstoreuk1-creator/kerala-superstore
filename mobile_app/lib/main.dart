import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:kerala_superstore_mobile/screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Try initializing Firebase (if google-services.json is present)
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase initialization notice: $e');
  }

  // Set Android & iOS Status bar color to match Kerala royal emerald
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF022C22),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  runApp(const KeralaSuperstoreApp());
}

class KeralaSuperstoreApp extends StatelessWidget {
  const KeralaSuperstoreApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kerala Superstore Manchester',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        primaryColor: const Color(0xFF064E3B),
        scaffoldBackgroundColor: const Color(0xFF022C22),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF064E3B),
          primary: const Color(0xFF064E3B),
          secondary: const Color(0xFFF59E0B),
        ),
      ),
      home: const SplashScreen(),
    );
  }
}
