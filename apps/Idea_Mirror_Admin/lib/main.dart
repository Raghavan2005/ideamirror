import 'package:flutter/material.dart';
import 'package:idea_mirror_admin/pages/HomeScreen.dart';
import 'package:idea_mirror_admin/pages/LoadScreen.dart';
import 'package:idea_mirror_admin/pages/StatsScreen.dart';

void main(){
  runApp(MaterialApp(home: Homescreen()));
}





class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  Widget build(BuildContext context) {
    return  Loadscreen();
  }
}
