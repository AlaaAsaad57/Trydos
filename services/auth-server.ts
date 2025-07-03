import { REGISTER_DEVICE_URL } from "@/utils/endpointConfig";
import {
  COOKIE_NAMES,
  getCookieServer,
  setCookieServer,
  getCookieMiddleware,
  setCookieMiddleware,
  type UserData,
} from "@/utils/cookies/cookie-manager";
import { RegisterGuestApi } from "@/models/API/market/RegisterGuest";

interface RegisterGuestResponse {
  success: boolean;
  isNewUser: boolean;
  userData?: UserData;
  deviceToken?: string;
  error?: string;
}

/**
 * Server-side guest registration service
 */
export class AuthServerService {
  /**
   * Check if user is already registered (middleware version)
   */
  static hasValidGuestSessionMiddleware(request: any): boolean {
    try {
      const deviceToken = getCookieMiddleware<string>(
        request,
        COOKIE_NAMES.DEVICE_TOKEN
      );
      const userData = getCookieMiddleware<UserData>(
        request,
        COOKIE_NAMES.USER_DATA
      );

      // Check if we have both token and user data
      if (!deviceToken || !userData) {
        return false;
      }

      // Check if session is expired

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Register a new guest user (middleware version)
   */
  static async registerGuestMiddleware(
    request: any,
    response: any,
    oldGuestUserId?: number | null
  ): Promise<RegisterGuestResponse> {
    try {
      // Check if already has valid session
      if (this.hasValidGuestSessionMiddleware(request)) {
        const userData = getCookieMiddleware<UserData>(
          request,
          COOKIE_NAMES.USER_DATA
        );
        return {
          success: true,
          isNewUser: false,
          userData,
        };
      }

      // Prepare request body
      const requestBody = {
        old_guest_user_id: oldGuestUserId || null,
      };

      // Make registration request
      const fetchResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}${REGISTER_DEVICE_URL}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data: RegisterGuestApi = await fetchResponse.json();
      console.warn(
        "*********************registerGuestMiddleware*********************",
        JSON.stringify({
          request,
          id: data.data.user.id,
          token: data.data.token,
        })
      );
      // Handle "user does not exist" error - retry with null ID
      if (data.message === "The user does not exist." && oldGuestUserId) {
        return this.registerGuestMiddleware(request, response, null);
      }

      if (!data.isSuccessful || !data.data) {
        throw new Error(data.message || "Registration failed");
      }

      // Prepare user data with expiration
      const userData: UserData = {
        ...data.data.user,
        expired_at: data.data.expires_at,
      };

      // Set cookies using middleware methods
      const cookieOptions = {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        httpOnly: false, // Allow client-side access for compatibility
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
      };

      setCookieMiddleware(
        response,
        COOKIE_NAMES.DEVICE_TOKEN,
        data.data.token,
        cookieOptions
      );
      setCookieMiddleware(
        response,
        COOKIE_NAMES.USER_DATA,
        userData,
        cookieOptions
      );

      return {
        success: true,
        isNewUser: true,
        userData,
        deviceToken: data.data.token,
      };
    } catch (error) {
      console.error("Guest registration failed:", error);
      return {
        success: false,
        isNewUser: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get or create guest session (middleware version)
   */
  static async ensureGuestSessionMiddleware(
    request: any,
    response: any
  ): Promise<RegisterGuestResponse> {
    // Check for existing session first
    if (this.hasValidGuestSessionMiddleware(request)) {
      const userData = getCookieMiddleware<UserData>(
        request,
        COOKIE_NAMES.USER_DATA
      );
      return {
        success: true,
        isNewUser: false,
        userData,
      };
    }

    // Check if there's an old guest user ID to migrate
    const userData = getCookieMiddleware<UserData>(
      request,
      COOKIE_NAMES.USER_DATA
    );
    const oldGuestUserId = userData?.id || null;

    // Register new guest
    return this.registerGuestMiddleware(request, response, oldGuestUserId);
  }
  /**
   * Check if user is already registered (has valid cookies)
   */
  static async hasValidGuestSession(): Promise<boolean> {
    try {
      const [deviceToken, userData] = await Promise.all([
        getCookieServer<string>(COOKIE_NAMES.DEVICE_TOKEN),
        getCookieServer<UserData>(COOKIE_NAMES.USER_DATA),
      ]);

      // Check if we have both token and user data
      if (!deviceToken || !userData) {
        return false;
      }

      // Check if session is expired

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Register a new guest user
   */
  static async registerGuest(
    oldGuestUserId?: number | null
  ): Promise<RegisterGuestResponse> {
    try {
      // Check if already has valid session
      if (await this.hasValidGuestSession()) {
        const userData = await getCookieServer<UserData>(
          COOKIE_NAMES.USER_DATA
        );
        return {
          success: true,
          isNewUser: false,
          userData,
        };
      }

      // Prepare request body
      const requestBody = {
        old_guest_user_id: oldGuestUserId || null,
      };

      // Make registration request
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}${REGISTER_DEVICE_URL}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data: RegisterGuestApi = await response.json();

      // Handle "user does not exist" error - retry with null ID
      if (data.message === "The user does not exist." && oldGuestUserId) {
        return this.registerGuest(null);
      }

      if (!data.isSuccessful || !data.data) {
        throw new Error(data.message || "Registration failed");
      }

      // Prepare user data with expiration
      const userData: UserData = {
        ...data.data.user,
        expired_at: data.data.expires_at,
      };

      // Set cookies
      const cookieOptions = {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        httpOnly: false, // Allow client-side access for compatibility
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
      };

      await Promise.all([
        setCookieServer(
          COOKIE_NAMES.DEVICE_TOKEN,
          data.data.token,
          cookieOptions
        ),
        setCookieServer(COOKIE_NAMES.USER_DATA, userData, cookieOptions),
      ]);

      return {
        success: true,
        isNewUser: true,
        userData,
        deviceToken: data.data.token,
      };
    } catch (error) {
      console.error("Guest registration failed:", error);
      return {
        success: false,
        isNewUser: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get or create guest session
   * This is the main method to call from middleware
   */
  static async ensureGuestSession(): Promise<RegisterGuestResponse> {
    // Check for existing session first
    if (await this.hasValidGuestSession()) {
      const userData = await getCookieServer<UserData>(COOKIE_NAMES.USER_DATA);
      return {
        success: true,
        isNewUser: false,
        userData,
      };
    }

    // Check if there's an old guest user ID to migrate
    const userData = await getCookieServer<UserData>(COOKIE_NAMES.USER_DATA);
    const oldGuestUserId = userData?.id || null;

    // Register new guest
    return this.registerGuest(oldGuestUserId);
  }

  /**
   * Refresh expired guest session
   */
  static async refreshExpiredSession(): Promise<RegisterGuestResponse> {
    const userData = await getCookieServer<UserData>(COOKIE_NAMES.USER_DATA);
    const oldGuestUserId = userData?.id || null;

    // Force new registration
    return this.registerGuest(oldGuestUserId);
  }
}
