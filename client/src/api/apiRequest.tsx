import axios, { AxiosResponse } from "axios";

// Define a type for the API response structure
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Generalized function to make API requests.
 *
 * @param collection_name - The name of the API route (e.g., "signup").
 * @param method - HTTP method to use ("GET", "POST", "PUT", "DELETE").
 * @param endpoint - Specific endpoint or resource to target (e.g., ":id", "/create", "/update/:id"). Refer to the server file
 * @param data - Data to be sent with the request (used for POST, PUT, DELETE).
 *
 * @returns A promise that resolves with the API response, containing the success status, data, and optional error message.
 */

// Define a general API Request function
export const apiRequest = async (
  collection_name: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  data: any = null
): Promise<ApiResponse> => {
  try {
    const url = `${process.env.REACT_APP_API_URL}/api/${collection_name}${endpoint}`;
    let response: AxiosResponse;

    // Handle different HTTP methods
    switch (method) {
      case "GET":
        response = await axios.get(url, { params: data });
        break;
      case "POST":
        response = await axios.post(url, data);
        break;
      case "PUT":
        response = await axios.put(url, { data });
        break;
      case "DELETE":
        response = await axios.delete(url, { data });
        break;
      default:
        throw new Error("Invalid HTTP method");
    }
    // await axios.post(url, data).then(e => console.log(e))

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("API error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "An error occurred",
    };
  }
};

// Example usage of the API handler function for user collection
// export const getUserById = async (id: string) => {
//   return await apiRequest ("order_route", "GET", id);
// };

// Example usage for creating a product
// export const createProduct = async (productData: any) => {
//   return await apiRequest ("product_route", "POST", "create", productData);
// };

// Example usage for updating a product
// export const updateProduct = async (id: string, updatedData: any) => {
//   return await apiRequest ("product_route", "PUT", `update/${id}`, updatedData);
// };

// Example usage for deleting a product
// export const deleteProduct = async (id: string) => {
//   return await apiRequest ("product_route", "DELETE", `delete/${id}`);
// };
