import { AxiosPost, AxiosGet } from "../utils/AxiosApi";

interface FCMTokenData {
  action: "register" | "subscribe" | "unsubscribe" | "send_notification";
  token?: string;
  topic?: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  imageUrl?: string;
  clickAction?: string;
  deviceInfo?: {
    platform: string;
    version: string;
    userAgent: string;
  };
}

interface StorageUploadData {
  file: File;
  folder?: string;
  fileName?: string;
  makePublic?: boolean;
}

interface StorageFileInfo {
  name: string;
  path: string;
  url: string;
  size: number;
  type: string;
  isPublic: boolean;
}

class FirebaseProxyService {
  private readonly FCM_ENDPOINT = "/api/firebase/fcm-token";
  private readonly STORAGE_ENDPOINT = "/api/firebase/storage";
  private readonly DATABASE_ENDPOINT = "/api/firebase/database";

  // FCM Token Management
  async registerFCMToken(
    token: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await AxiosPost({
        url: this.FCM_ENDPOINT,
        body: {
          action: "register",
          token,
          deviceInfo: {
            platform: navigator.platform,
            version: navigator.appVersion,
            userAgent: navigator.userAgent,
          },
        },
        title: "Register FCM Token via Proxy",
      });

      return response;
    } catch (error: any) {
      console.error("Failed to register FCM token:", error);
      throw new Error("FCM token registration failed");
    }
  }

  async subscribeToTopic(
    token: string,
    topic: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await AxiosPost({
        url: this.FCM_ENDPOINT,
        body: {
          action: "subscribe",
          token,
          topic,
        },
        title: "Subscribe to FCM Topic via Proxy",
      });

      return response;
    } catch (error: any) {
      console.error("Failed to subscribe to topic:", error);
      throw new Error("Topic subscription failed");
    }
  }

  async unsubscribeFromTopic(
    token: string,
    topic: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await AxiosPost({
        url: this.FCM_ENDPOINT,
        body: {
          action: "unsubscribe",
          token,
          topic,
        },
        title: "Unsubscribe from FCM Topic via Proxy",
      });

      return response;
    } catch (error: any) {
      console.error("Failed to unsubscribe from topic:", error);
      throw new Error("Topic unsubscription failed");
    }
  }

  async sendNotification(notificationData: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    imageUrl?: string;
    clickAction?: string;
  }): Promise<{ success: boolean; messageId: string }> {
    try {
      const response = await AxiosPost({
        url: this.FCM_ENDPOINT,
        body: {
          action: "send_notification",
          ...notificationData,
        },
        title: "Send FCM Notification via Proxy",
      });

      return response;
    } catch (error: any) {
      console.error("Failed to send notification:", error);
      throw new Error("Notification sending failed");
    }
  }

  async removeFCMToken(
    token: string,
    topic?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const url = topic
        ? `${this.FCM_ENDPOINT}?token=${token}&topic=${topic}`
        : `${this.FCM_ENDPOINT}?token=${token}`;

      const response = await fetch(url, {
        method: "DELETE",
      });

      return await response.json();
    } catch (error: any) {
      console.error("Failed to remove FCM token:", error);
      throw new Error("FCM token removal failed");
    }
  }

  async checkFCMHealth(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await AxiosGet({
        url: `${this.FCM_ENDPOINT}?action=health`,
        title: "Check FCM Service Health",
      });

      return response;
    } catch (error: any) {
      console.error("FCM health check failed:", error);
      throw new Error("FCM service health check failed");
    }
  }

  // Firebase Storage Management
  async uploadFile(uploadData: StorageUploadData): Promise<StorageFileInfo> {
    try {
      const formData = new FormData();
      formData.append("file", uploadData.file);

      if (uploadData.folder) {
        formData.append("folder", uploadData.folder);
      }

      if (uploadData.fileName) {
        formData.append("fileName", uploadData.fileName);
      }

      if (uploadData.makePublic !== undefined) {
        formData.append("makePublic", uploadData.makePublic.toString());
      }

      const response = await fetch(this.STORAGE_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.file;
    } catch (error: any) {
      console.error("Failed to upload file:", error);
      throw new Error("File upload failed");
    }
  }

  async downloadFile(
    filePath: string
  ): Promise<{ downloadUrl: string; path: string }> {
    try {
      const response = await AxiosGet({
        url: `${
          this.STORAGE_ENDPOINT
        }?action=download&path=${encodeURIComponent(filePath)}`,
        title: "Get Firebase Storage Download URL",
      });

      return response;
    } catch (error: any) {
      console.error("Failed to get download URL:", error);
      throw new Error("File download failed");
    }
  }

  async listFiles(folder?: string): Promise<{ files: any[]; folder: string }> {
    try {
      const url = folder
        ? `${this.STORAGE_ENDPOINT}?action=list&folder=${encodeURIComponent(
            folder
          )}`
        : `${this.STORAGE_ENDPOINT}?action=list`;

      const response = await AxiosGet({
        url,
        title: "List Firebase Storage Files",
      });

      return response;
    } catch (error: any) {
      console.error("Failed to list files:", error);
      throw new Error("File listing failed");
    }
  }

  async getFileInfo(filePath: string): Promise<any> {
    try {
      const response = await AxiosGet({
        url: `${this.STORAGE_ENDPOINT}?action=info&path=${encodeURIComponent(
          filePath
        )}`,
        title: "Get Firebase Storage File Info",
      });

      return response.file;
    } catch (error: any) {
      console.error("Failed to get file info:", error);
      throw new Error("File info retrieval failed");
    }
  }

  async deleteFile(
    filePath: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${this.STORAGE_ENDPOINT}?path=${encodeURIComponent(filePath)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("Failed to delete file:", error);
      throw new Error("File deletion failed");
    }
  }

  async updateFile(
    filePath: string,
    options: { metadata?: Record<string, any>; makePublic?: boolean }
  ): Promise<any> {
    try {
      const response = await fetch(this.STORAGE_ENDPOINT, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath,
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.file;
    } catch (error: any) {
      console.error("Failed to update file:", error);
      throw new Error("File update failed");
    }
  }

  // Firebase Realtime Database Management
  async readData(
    path: string,
    options?: {
      orderBy?: string;
      limitToFirst?: number;
      limitToLast?: number;
      startAt?: string;
      endAt?: string;
      equalTo?: string;
    }
  ): Promise<any> {
    try {
      const params = new URLSearchParams({ path });

      if (options?.orderBy) params.append("orderBy", options.orderBy);
      if (options?.limitToFirst)
        params.append("limitToFirst", options.limitToFirst.toString());
      if (options?.limitToLast)
        params.append("limitToLast", options.limitToLast.toString());
      if (options?.startAt) params.append("startAt", options.startAt);
      if (options?.endAt) params.append("endAt", options.endAt);
      if (options?.equalTo) params.append("equalTo", options.equalTo);

      const response = await AxiosGet({
        url: `${this.DATABASE_ENDPOINT}?${params.toString()}`,
        title: "Read Firebase Database Data",
      });

      return response.data;
    } catch (error: any) {
      console.error("Failed to read database data:", error);
      throw new Error("Database read failed");
    }
  }

  async writeData(
    path: string,
    data: any,
    action: "set" | "update" | "push" = "set"
  ): Promise<any> {
    try {
      const response = await AxiosPost({
        url: this.DATABASE_ENDPOINT,
        body: {
          action,
          path,
          data,
        },
        title: `Firebase Database ${action.toUpperCase()}`,
      });

      return response;
    } catch (error: any) {
      console.error("Failed to write database data:", error);
      throw new Error("Database write failed");
    }
  }

  async updateData(path: string, updates: Record<string, any>): Promise<any> {
    return this.writeData(path, updates, "update");
  }

  async pushData(path: string, data: any): Promise<any> {
    return this.writeData(path, data, "push");
  }

  async deleteData(
    path: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${this.DATABASE_ENDPOINT}?path=${encodeURIComponent(path)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to delete database data:", error);
      throw new Error("Database delete failed");
    }
  }

  async performTransaction(
    path: string,
    updateFunction: "increment" | "append",
    data?: any
  ): Promise<any> {
    try {
      const response = await AxiosPost({
        url: this.DATABASE_ENDPOINT,
        body: {
          action: "transaction",
          path,
          updateFunction,
          data,
        },
        title: "Firebase Database Transaction",
      });

      return response;
    } catch (error) {
      console.error("Failed to perform database transaction:", error);
      throw new Error("Database transaction failed");
    }
  }

  // Helper methods for common chat operations based on your existing code
  async sendChatMessage(channelId: string, messageData: any): Promise<any> {
    const path = `channels/${channelId}/messages`;
    return this.pushData(path, {
      ...messageData,
      timestamp: Date.now(),
      status: "sent",
    });
  }

  async updateMessageStatus(
    channelId: string,
    messageId: string,
    status: string
  ): Promise<any> {
    const path = `channels/${channelId}/messages/${messageId}`;
    return this.updateData(path, { status });
  }

  async getChatMessages(channelId: string, limit?: number): Promise<any> {
    const path = `channels/${channelId}/messages`;
    return this.readData(path, {
      orderBy: "timestamp",
      limitToLast: limit || 50,
    });
  }

  async getChannelData(channelId: string): Promise<any> {
    const path = `channels/${channelId}`;
    return this.readData(path);
  }

  async updateUserPresence(userId: string, isOnline: boolean): Promise<any> {
    const path = `presence/${userId}`;
    return this.writeData(path, {
      online: isOnline,
      lastSeen: Date.now(),
    });
  }

  async deleteMessage(channelId: string, messageId: string): Promise<any> {
    const path = `channels/${channelId}/messages/${messageId}`;
    return this.deleteData(path);
  }

  // Helper methods for common operations
  async handleFCMForRestrictedRegions(token: string): Promise<void> {
    try {
      // Register token through proxy
      await this.registerFCMToken(token);

      // Subscribe to essential topics
      const essentialTopics = [
        "product_availability",
        "order_updates",
        "boutique_created",
        "category_created",
      ];

      for (const topic of essentialTopics) {
        try {
          await this.subscribeToTopic(token, topic);
        } catch (error) {
          console.warn(`Failed to subscribe to ${topic}:`, error);
        }
      }

      console.log("FCM setup completed for restricted region");
    } catch (error) {
      console.error("FCM setup failed for restricted region:", error);
      throw error;
    }
  }

  async uploadChatMedia(file: File, chatId: string): Promise<StorageFileInfo> {
    return this.uploadFile({
      file,
      folder: `chat/${chatId}`,
      makePublic: false,
    });
  }

  async uploadProductImage(
    file: File,
    productId: string
  ): Promise<StorageFileInfo> {
    return this.uploadFile({
      file,
      folder: `products/${productId}`,
      makePublic: true,
    });
  }

  async uploadUserAvatar(file: File, userId: string): Promise<StorageFileInfo> {
    return this.uploadFile({
      file,
      folder: `avatars/${userId}`,
      fileName: `avatar.${file.name.split(".").pop()}`,
      makePublic: true,
    });
  }
}

export const firebaseProxy = new FirebaseProxyService();
export default firebaseProxy;
