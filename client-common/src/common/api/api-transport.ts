import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { LocalStorage } from 'quasar';

const API_PREFIX = '/api/internal/';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface FailedRequest {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

export type QueryParams = { [k: string]: string|number|boolean };
export default class APITransport {
  readonly prefix;

  private readonly axios: AxiosInstance;

	// Do not access directly. Instead, use getAccessToken().
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private failedQueue: FailedRequest[] = [];
  private onLogout: (() => void) | null = null;

  constructor(prefix?: string) {
		this.prefix = prefix || API_PREFIX;
		this.axios = axios.create({ baseURL: this.prefix });
    this.accessToken = LocalStorage.getItem('accessToken');
    this.refreshToken = LocalStorage.getItem('refreshToken');
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Only handle 401 errors for authenticated requests
        if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
          return Promise.reject(error);
        }

        // Check if this was an authenticated request
        const authHeader = originalRequest.headers?.Authorization;
        if (!authHeader || !this.refreshToken) {
          return Promise.reject(error);
        }

        if (this.isRefreshing) {
          // Queue the request while refresh is in progress
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axios(originalRequest);
            }
            return Promise.reject(error);
          });
        }

        originalRequest._retry = true;
        this.isRefreshing = true;

        try {
          const response = await axios.post<TokenResponse>(
            `${this.prefix}user/refresh`,
            { refreshToken: this.refreshToken }
          );

          const { accessToken, refreshToken } = response.data;
          this.setTokens(accessToken, refreshToken);

          // Process queued requests
          this.processQueue(accessToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return this.axios(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear tokens and notify
          this.processQueue(null);
          this.clearTokens();
          if (this.onLogout) {
            this.onLogout();
          }
          return Promise.reject(refreshError);
        } finally {
          this.isRefreshing = false;
        }
      }
    );
  }

  private processQueue(token: string | null) {
    this.failedQueue.forEach((prom) => {
      if (token) {
        prom.resolve(token);
      } else {
        prom.reject(new Error('Refresh token failed'));
      }
    });
    this.failedQueue = [];
  }

  setLogoutHandler(handler: () => void) {
    this.onLogout = handler;
  }

  hasAccessToken() {
    return this.accessToken !== null;
  }

  hasRefreshToken() {
    return this.refreshToken !== null;
  }

	protected getAccessToken() {
		return this.accessToken;
	}

  protected getRefreshToken() {
    return this.refreshToken;
  }

  setAccessToken(accessToken: string | null) {
    this.accessToken = accessToken;

    if (accessToken) {
      LocalStorage.set('accessToken', accessToken);
    } else {
      LocalStorage.remove('accessToken');
    }
  }

  setRefreshToken(refreshToken: string | null) {
    this.refreshToken = refreshToken;

    if (refreshToken) {
      LocalStorage.set('refreshToken', refreshToken);
    } else {
      LocalStorage.remove('refreshToken');
    }
  }

  setTokens(accessToken: string | null, refreshToken: string | null) {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  clearTokens() {
    this.setTokens(null, null);
  }

	atPath(path: string): APITransport {
		return new APISubTransport(this, path);
	}

	// Requests without an access token

	async get<R>(path: string, queryParams?: QueryParams): Promise<R> {
		return (await this.axios.get<R>(path, {
			params: queryParams
		})).data;
	}

	async post<R>(path: string, data: unknown): Promise<R> {
		return (await this.axios.post<R>(path, data)).data;
	}

	async put<R>(path: string, data: unknown): Promise<R> {
		return (await this.axios.put<R>(path, data)).data;
	}

	async delete<R>(path: string, queryParams?: QueryParams): Promise<R> {
		return (await this.axios.delete<R>(path, {
			params: queryParams
		})).data;
	}

	// Requests with an access token

	private getAuthConfig(queryParams?: QueryParams, requireToken = true): AxiosRequestConfig {
		const accessToken = this.getAccessToken();

		if (requireToken && !accessToken) {
			throw new Error();
		}

		return {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`
      } : {},
			params: queryParams
    }
	}

	// Token required

	async authGet<R>(path: string, queryParams?: QueryParams): Promise<R> {
		return (await this.axios.get<R>(path, this.getAuthConfig(queryParams))).data;
	}

	async authPost<R>(path: string, data: unknown, queryParams?: QueryParams): Promise<R> {
		return (await this.axios.post<R>(path, data, this.getAuthConfig(queryParams))).data;
	}

	async authPut<R>(path: string, data: unknown, queryParams?: QueryParams): Promise<R> {
		return (await this.axios.put<R>(path, data, this.getAuthConfig(queryParams))).data;
	}

	async authDelete<R>(path: string, queryParams?: QueryParams): Promise<R> {
		return (await this.axios.delete<R>(path, this.getAuthConfig(queryParams))).data;
	}

	// Token optional

	async tokenGet<R>(path: string, queryParams?: QueryParams): Promise<R> {
		return (await this.axios.get<R>(path, this.getAuthConfig(queryParams, false))).data;
	}
}

// Internal class used in the implementation of APITransport.atPath.
class APISubTransport extends APITransport {
	constructor(private parent: APITransport, path: string) {
		super(path.endsWith('/') ? `${API_PREFIX}${path}` : `${API_PREFIX}${path}/`);
	}

	hasAccessToken(): boolean {
		return this.parent.hasAccessToken();
	}

	hasRefreshToken(): boolean {
		return this.parent.hasRefreshToken();
	}

	protected getAccessToken(): string | null {
		// Hack. TypeScript refuses to call protected methods of the superclass. This does the right thing.
		return (this.parent as APISubTransport).getAccessToken();
	}

	protected getRefreshToken(): string | null {
		return (this.parent as APISubTransport).getRefreshToken();
	}

	setAccessToken(accessToken: string | null) {
		this.parent.setAccessToken(accessToken);
	}

	setRefreshToken(refreshToken: string | null) {
		this.parent.setRefreshToken(refreshToken);
	}

	setTokens(accessToken: string | null, refreshToken: string | null) {
		this.parent.setTokens(accessToken, refreshToken);
	}

	clearTokens() {
		this.parent.clearTokens();
	}

	setLogoutHandler(handler: () => void) {
		this.parent.setLogoutHandler(handler);
	}
}
