import axios from 'axios';

export const baseURL =
	import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

let accessToken = localStorage.getItem('lh_access_token') || '';
let refreshToken = localStorage.getItem('lh_refresh_token') || '';

export const tokenStore = {
	getAccess: () => accessToken,
	getRefresh: () => refreshToken,
	set(access, refresh) {
		accessToken = access || '';
		refreshToken = refresh || refreshToken;
		if (accessToken) localStorage.setItem('lh_access_token', accessToken);
		if (refreshToken)
			localStorage.setItem('lh_refresh_token', refreshToken);
	},
	clear() {
		accessToken = '';
		refreshToken = '';
		localStorage.removeItem('lh_access_token');
		localStorage.removeItem('lh_refresh_token');
	},
};

export const api = axios.create({ baseURL });

api.interceptors.request.use(config => {
	const token = tokenStore.getAccess();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

let refreshPromise = null;

api.interceptors.response.use(
	res => res,
	async error => {
		const original = error.config;
		if (error.response?.status !== 401 || original._retry) {
			throw error;
		}

		if (!tokenStore.getRefresh()) {
			tokenStore.clear();
			throw error;
		}

		if (!refreshPromise) {
			refreshPromise = api
				.post('/auth/refresh', {
					refreshToken: tokenStore.getRefresh(),
				})
				.then(({ data }) => {
					tokenStore.set(data.accessToken, data.refreshToken);
					return data.accessToken;
				})
				.finally(() => {
					refreshPromise = null;
				});
		}

		const newAccess = await refreshPromise;
		original._retry = true;
		original.headers.Authorization = `Bearer ${newAccess}`;
		return api(original);
	},
);
