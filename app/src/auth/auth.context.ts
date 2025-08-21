export const msalConfig: Configuration = {
	auth: {
		clientId: import.meta.env.VITE_CLIENT_ID as string,
		authority: import.meta.env.VITE_AUTHORITY as string,
		redirectUri: window.location.origin,
	},
	cache: {
		cacheLocation: "localStorage", // or "sessionStorage"
		storeAuthStateInCookie: false,
	},
	system: {
		loggerOptions: {
			loggerCallback: (level: any, message: any, containsPii: any) => {
				if (containsPii) return;
				switch (level) {
					case LogLevel.Error:
						LogError(message);
						return;
					case LogLevel.Warning:
						LogWarn(message);
						return;
				}
			},
		},
	},
};