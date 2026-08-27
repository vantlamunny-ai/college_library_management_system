import axios from "axios";

export const TOKEN_STORAGE_KEY = "clms_token";
export const USER_STORAGE_KEY = "clms_user";

export const baseURL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:3000";

export const apiClient = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem(
        TOKEN_STORAGE_KEY
    );

    if (token) {
        config.headers.Authorization =
            `Bearer ${token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response.data,

    (error) => {
        const status =
            error.response?.status;

        const message =
            error.response?.data?.message ||
            error.message ||
            "Something went wrong. Please try again.";

        if (status === 401) {
            window.dispatchEvent(
                new CustomEvent("clms:unauthorized")
            );
        }

        return Promise.reject({
            status,
            message,
            raw: error,
        });
    }
);

export default apiClient;