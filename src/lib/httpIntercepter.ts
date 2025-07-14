const HEADER_X_SP_SESSION_ID = 'x-sp-session-id';

/**
 * Patches XMLHttpRequest to inject a custom header.
 * This should be called as early as possible in your application.
 */
export function patchXMLHttpRequest(sessionId: string): void {
    // Ensure XMLHttpRequest exists in the environment
    if (typeof XMLHttpRequest === 'undefined') {
        console.warn('XMLHttpRequest is not available. Skipping XMLHttpRequest patching.');
        return;
    }

    // Check if XMLHttpRequest has already been patched by our SDK
    if ((XMLHttpRequest as any).__sp_sdk_patched_xhr) {
        console.warn('XMLHttpRequest already patched by SDK. Skipping re-patching.');
        return;
    }

    // Store the original XMLHttpRequest.prototype.open and send methods
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    // Override the open method to store the URL and method
    XMLHttpRequest.prototype.open = function (
        this: XMLHttpRequest, // Explicitly define 'this' context
        method: string,
        url: string | URL,
        _async: boolean = true,
        _username?: string | null, 
        _password?: string | null
    ): void {
        // Store method and URL for potential later use (e.g., conditional header injection)
        (this as any)._method = method;
        (this as any)._url = url;
        originalOpen.apply(this, arguments as any); // Type assertion for arguments
    };

    // Override the send method to inject the header before the request is sent
    XMLHttpRequest.prototype.send = function (
        this: XMLHttpRequest, // Explicitly define 'this' context
        _body?: Document | XMLHttpRequestBodyInit | null
    ): void {
        // Inject your custom header here
        this.setRequestHeader(HEADER_X_SP_SESSION_ID, sessionId);

        originalSend.apply(this, arguments as any); // Type assertion for arguments
    };

    // Mark XMLHttpRequest as patched
    (XMLHttpRequest as any).__sp_sdk_patched_xhr = true;
}

/**
 * Patches the Fetch API to inject a custom header.
 * This should be called as early as possible in your application.
 */
export function patchFetchAPI(sessionId: string): void {
    // Ensure fetch exists in the environment
    if (typeof window.fetch === 'undefined') {
        console.warn('Fetch API is not available. Skipping Fetch API patching.');
        return;
    }
    // Check if Fetch API has already been patched by our SDK
    // We can add a custom property to the window object or the original fetch function.
    if ((window.fetch as any).__sp_sdk_patched_fetch) {
        console.warn('Fetch API already patched by SDK. Skipping re-patching.');
        return;
    }

    // Store the original fetch function
    const originalFetch = window.fetch;

    // Override the global fetch function
    window.fetch = async function (
        resource: RequestInfo | URL,
        options?: RequestInit
    ): Promise<Response> {
        options = options || {};
        options.headers = options.headers || {};

        let headers: HeadersInit = options.headers;

        // Determine the type of headers and add the session id header
        try {
            if (headers instanceof Headers) {
                headers.set(HEADER_X_SP_SESSION_ID, sessionId);
            } else if (Array.isArray(headers)) {
                // If headers is an array of [key, value] pairs
                headers.push([HEADER_X_SP_SESSION_ID, sessionId]);
            } else {
                // Assume it's a plain object or Record<string, string>
                (headers as Record<string, string>)[HEADER_X_SP_SESSION_ID] = sessionId;
            }
        } catch (error) {
            console.error('Error setting session id header:', error);
            // Continue with the request even if there's an error so that we dont block the request
        }

        options.headers = headers;

        // Call the original fetch with the modified options
        return originalFetch(resource, options);
    };

    // Mark Fetch API as patched
    (window.fetch as any).__sp_sdk_patched_fetch = true;
}

/**
 * Initializes the HTTP interception for both XMLHttpRequest and Fetch API.
 * Call this function once when your SDK loads.
 */
export function initializeHttpInterceptor(sessionId: string): void {
    console.log('Initializing HTTP interception...');
    patchXMLHttpRequest(sessionId);
    patchFetchAPI(sessionId);
    console.log('HTTP interception initialized.');
}
