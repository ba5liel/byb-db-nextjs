import axios from "axios"

/**
 * Axios instance for API calls
 * Configured with base URL and interceptors for session handling
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for sending cookies with requests
})

/**
 * Request interceptor
 * Attaches session cookies to all requests
 */
apiClient.interceptors.request.use(
  (config) => {
    // Cookies are automatically sent with withCredentials: true
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor
 * Handles errors globally
 */
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
            window.location.href = "/login"
          }
          break
        case 403:
          // Forbidden
          console.error("Access forbidden:", data.message)
          break
        case 404:
          // Not found
          console.error("Resource not found:", data.message)
          break
        case 500:
          // Server error
          console.error("Server error:", data.message)
          break
        default:
          console.error("API error:", data.message)
      }
    } else if (error.request) {
      // Request made but no response received
      console.error("Network error: No response from server")
    } else {
      // Error in request configuration
      console.error("Request error:", error.message)
    }

    return Promise.reject(error)
  }
)

