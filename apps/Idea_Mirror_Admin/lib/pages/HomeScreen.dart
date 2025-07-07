import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class Homescreen extends StatefulWidget {
  @override
  _IdeaMirrorSettingsScreenState createState() => _IdeaMirrorSettingsScreenState();
}

class _IdeaMirrorSettingsScreenState extends State<Homescreen> {

  void _showConfirmationDialog(String title, String message, VoidCallback onConfirm) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: Colors.grey[900],
          title: Text(
            title,
            style: TextStyle(color: Colors.white),
          ),
          content: Text(
            message,
            style: TextStyle(color: Colors.grey[300]),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(
                'Cancel',
                style: TextStyle(color: Colors.grey[400]),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                onConfirm();
              },
              child: Text(
                'Confirm',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        );
      },
    );
  }

  void _handleShutdown() {
    _showConfirmationDialog(
      'Shutdown',
      'Are you sure you want to shutdown the system?',
          () {
        // Add shutdown logic here
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Shutting down...'),
            backgroundColor: Colors.red[600],
          ),
        );
      },
    );
  }

  void _handleRestart() {
    _showConfirmationDialog(
      'Restart',
      'Are you sure you want to restart the system?',
          () {
        // Add restart logic here
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Restarting...'),
            backgroundColor: Colors.orange[600],
          ),
        );
      },
    );
  }

  void _handleScreenOn() {
    // Add screen on logic here
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Screen turned on'),
        backgroundColor: Colors.green[600],
      ),
    );
  }

  void _handleScreenOff() {
    // Add screen off logic here
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Screen turned off'),
        backgroundColor: Colors.grey[600],
      ),
    );
  }

  void _handleAutoUpdate() {
    _showConfirmationDialog(
      'Auto Update',
      'This will update the system and require a restart. Continue?',
          () {
        // Add auto update logic here
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Starting auto update...'),
            backgroundColor: Colors.blue[600],
          ),
        );
      },
    );
  }

  void _handleQuotesEditor() {
    // Navigate to quotes editor
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => QuotesEditorScreen(),
      ),
    );
  }

  void _handleVideoListEditor() {
    // Navigate to video list editor
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VideoListEditorScreen(),
      ),
    );
  }

  void _handleStartUpTime() {
    // Navigate to startup time settings
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StartUpTimeScreen(),
      ),
    );
  }

  void _handleAboutUs() async {
    const url = 'https://github.com/raghavan2005';
    if (await canLaunch(url)) {
      await launch(url);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not open link'),
          backgroundColor: Colors.red[600],
        ),
      );
    }
  }

  Widget _buildMenuItem({
    required String title,
    required VoidCallback onTap,
    Color? textColor,
  }) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            width: double.infinity,
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[600]!, width: 1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              title,
              style: TextStyle(
                color: textColor ?? Colors.grey[400],
                fontSize: 16,
                fontWeight: FontWeight.w400,
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text(
          "Idea Mirror",
          style: TextStyle(
            fontSize: 25,
            fontWeight: FontWeight.bold,
            color: Colors.black, // Black text
          ),
        ),
        centerTitle: true, // Center align text
        backgroundColor: Colors.white, // White background
        iconTheme: const IconThemeData(color: Colors.black), // Black back button icon
        elevation: 0, // Optional: removes shadow for a flat look
      )
      ,
      body: SafeArea(
        child: Column(
          children: [
            

            // Menu Items
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Column(
                  children: [
                    _buildMenuItem(
                      title: 'Shutdown',
                      onTap: _handleShutdown,
                    ),
                    SizedBox(height: 8),
                    _buildMenuItem(
                      title: 'Restart',
                      onTap: _handleRestart,
                    ),
                    SizedBox(height: 8),
                    _buildMenuItem(
                      title: 'Turn Screen ON',
                      onTap: _handleScreenOn,
                    ),
                    SizedBox(height: 8),
                    _buildMenuItem(
                      title: 'Turn Screen OFF',
                      onTap: _handleScreenOff,
                    ),
                    SizedBox(height: 8),
                    _buildMenuItem(
                      title: 'AutoUpdate (Required Restart)',
                      onTap: _handleAutoUpdate,
                    ),
                    SizedBox(height: 8),
                    _buildMenuItem(
                      title: 'Quotes Editor',
                      onTap: _handleQuotesEditor,
                    ),
                    SizedBox(height: 8),
                    _buildMenuItem(
                      title: 'Video List Editor',
                      onTap: _handleVideoListEditor,
                    ),
                    SizedBox(height: 8),
                    _buildMenuItem(
                      title: 'StartUp Time',
                      onTap: _handleStartUpTime,
                    ),
                    SizedBox(height: 8),
                    _buildMenuItem(
                      title: 'About us (Links)',
                      onTap: _handleAboutUs,
                    ),
                  ],
                ),
              ),
            ),

            // Footer
            Container(
              padding: EdgeInsets.all(20),
              child: Text(
                'github.com/raghavan2005',
                style: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Placeholder screens for navigation
class QuotesEditorScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.grey[900],
        title: Text('Quotes Editor'),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Center(
        child: Text(
          'Quotes Editor Screen\n\nImplement your quotes editing functionality here',
          style: TextStyle(color: Colors.white, fontSize: 16),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class VideoListEditorScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.grey[900],
        title: Text('Video List Editor'),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Center(
        child: Text(
          'Video List Editor Screen\n\nImplement your video list editing functionality here',
          style: TextStyle(color: Colors.white, fontSize: 16),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class StartUpTimeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.grey[900],
        title: Text('StartUp Time'),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Center(
        child: Text(
          'StartUp Time Settings\n\nImplement your startup time configuration here',
          style: TextStyle(color: Colors.white, fontSize: 16),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

