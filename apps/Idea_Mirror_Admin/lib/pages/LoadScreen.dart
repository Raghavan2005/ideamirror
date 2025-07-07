import 'package:flutter/material.dart';
import 'package:idea_mirror_admin/pages/Scan.dart';

class Loadscreen extends StatefulWidget {
  const Loadscreen({super.key});

  @override
  _IdeaMirrorLoadingScreenState createState() => _IdeaMirrorLoadingScreenState();
}

class _IdeaMirrorLoadingScreenState extends State<Loadscreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo

            Image(
                width: 300,
                height: 300,
                image: AssetImage('assets/idea_logo.png')
            ),


            SizedBox(height: 40),

            // Idea Mirror title
            Text(
              'Idea Mirror',
              style: TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.w300,
              ),
            ),

            SizedBox(height: 60),

            // Loading spinner
            AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                return Transform.rotate(
                  angle: _controller.value * 2.0 * 3.14159,
                  child: Container(
                    width: 40,
                    height: 40,
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      strokeWidth: 3,
                    ),
                  ),
                );
              },
            ),

            SizedBox(height: 30),

            // Status text
            Text(
              'Waiting to Connect With',
              style: TextStyle(
                color: Colors.grey[400],
                fontSize: 14,
              ),
            ),
            Text(
              'Wifi(Scan the QR on Idea Mirror)',
              style: TextStyle(
                color: Colors.grey[400],
                fontSize: 14,
              ),
            ),
            SizedBox(height: 30),
            IconButton(onPressed: (){
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const Scan()),
              );
            }, icon: Icon(Icons.document_scanner_outlined,color: Colors.blueAccent,size: 50,))
          ],
        ),
      ),
    );
  }
}

