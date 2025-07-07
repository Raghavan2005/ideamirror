import 'package:flutter/material.dart';
import 'package:idea_mirror_admin/pages/StatsScreen.dart';
import 'package:qr_code_scanner_plus/qr_code_scanner_plus.dart';
import 'package:wifi_iot/wifi_iot.dart'; // Add this

class Scan extends StatefulWidget {
  const Scan({super.key});

  @override
  State<Scan> createState() => _ScanState();
}

class _ScanState extends State<Scan> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  String? qrText;

  @override
  void reassemble() {
    super.reassemble();
    if (controller != null) {
      controller!.pauseCamera();
      controller!.resumeCamera();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Idea Mirror',
          style: TextStyle(color: Colors.black),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 2,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Column(
        children: [
          Expanded(
            flex: 4,
            child: QRView(
              key: qrKey,
              onQRViewCreated: _onQRViewCreated,
              overlay: QrScannerOverlayShape(
                borderColor: Colors.blue,
                borderRadius: 10,
                borderLength: 30,
                borderWidth: 10,
                cutOutSize: 250,
              ),
            ),
          ),
          Expanded(
            flex: 1,
            child: Center(
              child: Text(
                qrText != null ? 'Result: $qrText' : 'Scan a code',
                style: const TextStyle(fontSize: 18),
              ),
            ),
          )
        ],
      ),
    );
  }

  void _onQRViewCreated(QRViewController controller) {
    this.controller = controller;
    controller.scannedDataStream.listen((scanData) async {
      final code = scanData.code;
      if (code == null) return;

      setState(() => qrText = code);

      // Parse Wi-Fi credentials
      if (code.contains('WIFI:')) {
        final wifiInfo = _parseWifiQr(code);
        if (wifiInfo != null) {
          await _connectToWifi(
            wifiInfo['ssid']!,
            wifiInfo['password']!,
            wifiInfo['encryption']!,
          );
        }
      }

      // Parse URL (assumes on same QR code)
      final urlRegex = RegExp(r'URL:(http:\/\/[^\s]+)');
      final match = urlRegex.firstMatch(code);
      final piUrl = match?.group(1); // e.g. http://192.168.4.1:3000

      if (piUrl != null) {
        debugPrint(' IdeaMirror URL: $piUrl');
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => Statsscreen(piUrl: piUrl,)),
        );
      } else {
        debugPrint('No URL found in QR code.');
      }
    });
  }

  Map<String, String>? _parseWifiQr(String qr) {
    final regex = RegExp(r'WIFI:T:(.*?);S:(.*?);P:(.*?);;');
    final match = regex.firstMatch(qr);
    if (match != null && match.groupCount == 3) {
      return {
        'encryption': match.group(1) ?? 'WPA',
        'ssid': match.group(2) ?? '',
        'password': match.group(3) ?? '',
      };
    }
    return null;
  }

  Future<void> _connectToWifi(String ssid, String password, String encryption) async {
    try {
      await WiFiForIoTPlugin.connect(
        ssid,
        password: password,
        security: encryption.toUpperCase() == 'WEP'
            ? NetworkSecurity.WEP
            : NetworkSecurity.WPA,
        joinOnce: true,
        withInternet: false,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Connected to $ssid')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to connect: $e')),
      );
    }
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }
}
