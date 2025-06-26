import React, { useState, useEffect } from "react";
import firebaseProxy from "../../services/firebase";

interface FirebaseProxyExampleProps {
  userToken?: string;
  userId?: string;
  countryCode?: string;
}

const FirebaseProxyExample: React.FC<FirebaseProxyExampleProps> = ({
  userToken,
  userId,
  countryCode = "US",
}) => {
  const [fcmToken, setFcmToken] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [isRestrictedRegion, setIsRestrictedRegion] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is in a restricted region
    const restrictedCountries = ["SY", "IR", "KP", "CU"]; // Syria, Iran, North Korea, Cuba
    setIsRestrictedRegion(
      restrictedCountries.includes(countryCode.toUpperCase())
    );
  }, [countryCode]);

  const handleRegisterFCMToken = async () => {
    if (!fcmToken) {
      addNotification("Please enter an FCM token");
      return;
    }

    try {
      if (isRestrictedRegion) {
        // Use proxy for restricted regions
        const result = await firebaseProxy.registerFCMToken(fcmToken);
        addNotification(`✅ FCM Token registered via proxy: ${result.message}`);

        // Auto-subscribe to essential topics for restricted regions
        await firebaseProxy.handleFCMForRestrictedRegions(fcmToken);
        addNotification("✅ Essential topics subscribed");
      } else {
        // Use direct Firebase for unrestricted regions
        const { requestFirebaseNotificationPermission } = await import(
          "../../utils/firebaseInitv1"
        );
        const token = await requestFirebaseNotificationPermission();

        if (token) {
          addNotification("✅ FCM Token registered directly with Firebase");
          setFcmToken(token);
        }
      }
    } catch (error) {
      addNotification(`❌ FCM registration failed: ${error.message}`);
    }
  };

  const handleSubscribeToTopic = async () => {
    if (!fcmToken) {
      addNotification("Please register FCM token first");
      return;
    }

    try {
      const topic = `product_availability_${userId}`;

      if (isRestrictedRegion) {
        await firebaseProxy.subscribeToTopic(fcmToken, topic);
        addNotification(`✅ Subscribed to topic via proxy: ${topic}`);
      } else {
        // Use your existing subscription logic for unrestricted regions
        addNotification(`✅ Subscribed to topic directly: ${topic}`);
      }
    } catch (error) {
      addNotification(`❌ Topic subscription failed: ${error.message}`);
    }
  };

  const handleSendTestNotification = async () => {
    if (!fcmToken) {
      addNotification("Please register FCM token first");
      return;
    }

    try {
      const result = await firebaseProxy.sendNotification({
        token: fcmToken,
        title: "Test Notification",
        body: "This is a test notification sent via proxy API",
        data: {
          type: "test",
          timestamp: Date.now().toString(),
        },
        clickAction: window.location.origin,
      });

      addNotification(`✅ Test notification sent: ${result.messageId}`);
    } catch (error) {
      addNotification(`❌ Notification sending failed: ${error.message}`);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      addNotification("Please select a file first");
      return;
    }

    try {
      const result = await firebaseProxy.uploadFile({
        file: uploadFile,
        folder: `user-uploads/${userId}`,
        makePublic: true,
      });

      addNotification(`✅ File uploaded: ${result.name}`);
      addNotification(`📁 File URL: ${result.url}`);
    } catch (error) {
      addNotification(`❌ File upload failed: ${error.message}`);
    }
  };

  const handleUploadAvatar = async () => {
    if (!uploadFile || !userId) {
      addNotification("Please select a file and ensure user ID is available");
      return;
    }

    try {
      const result = await firebaseProxy.uploadUserAvatar(uploadFile, userId);
      addNotification(`✅ Avatar uploaded: ${result.name}`);
      addNotification(`🖼️ Avatar URL: ${result.url}`);
    } catch (error) {
      addNotification(`❌ Avatar upload failed: ${error.message}`);
    }
  };

  const handleListFiles = async () => {
    try {
      const result = await firebaseProxy.listFiles(`user-uploads/${userId}`);
      addNotification(`📂 Found ${result.files.length} files in folder`);

      result.files.forEach((file, index) => {
        addNotification(
          `${index + 1}. ${file.name} (${Math.round(file.size / 1024)}KB)`
        );
      });
    } catch (error) {
      addNotification(`❌ File listing failed: ${error.message}`);
    }
  };

  const handleCheckFCMHealth = async () => {
    try {
      const result = await firebaseProxy.checkFCMHealth();
      addNotification(`✅ FCM Health: ${result.message}`);
    } catch (error) {
      addNotification(`❌ FCM Health check failed: ${error.message}`);
    }
  };

  const addNotification = (message: string) => {
    setNotifications((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Firebase Proxy Demo
        {isRestrictedRegion && (
          <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
            Restricted Region
          </span>
        )}
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* FCM Operations */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">
            FCM Operations
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              FCM Token
            </label>
            <input
              type="text"
              value={fcmToken}
              onChange={(e) => setFcmToken(e.target.value)}
              placeholder="Enter FCM token or click register to get one"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRegisterFCMToken}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Register Token
            </button>

            <button
              onClick={handleSubscribeToTopic}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Subscribe to Topic
            </button>

            <button
              onClick={handleSendTestNotification}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              Send Test Notification
            </button>

            <button
              onClick={handleCheckFCMHealth}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Check Health
            </button>
          </div>
        </div>

        {/* Storage Operations */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Storage Operations
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Select File
            </label>
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              accept="image/*,video/*,audio/*,.pdf,.txt,.json"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleFileUpload}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              Upload File
            </button>

            <button
              onClick={handleUploadAvatar}
              className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
            >
              Upload as Avatar
            </button>

            <button
              onClick={handleListFiles}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            >
              List Files
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-700">Activity Log</h3>
          <button
            onClick={clearNotifications}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="bg-gray-50 rounded-md p-4 max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm">No activity yet...</p>
          ) : (
            notifications.map((notification, index) => (
              <div
                key={index}
                className="text-sm py-1 border-b border-gray-200 last:border-b-0"
              >
                {notification}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Region Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">Region Information</h4>
        <p className="text-sm text-blue-800">
          Country: <strong>{countryCode}</strong>
          {isRestrictedRegion ? (
            <span className="ml-2 text-red-600">
              • Using Firebase Proxy API for restricted region
            </span>
          ) : (
            <span className="ml-2 text-green-600">
              • Using direct Firebase API
            </span>
          )}
        </p>

        {isRestrictedRegion && (
          <p className="text-xs text-blue-700 mt-2">
            In restricted regions, Firebase operations are routed through
            server-side proxy APIs to ensure functionality despite regional
            restrictions.
          </p>
        )}
      </div>
    </div>
  );
};

export default FirebaseProxyExample;
