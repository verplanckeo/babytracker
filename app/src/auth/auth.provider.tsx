import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import SplashScreen from "../components/splashscreen/SplashScreen";
import { LogError } from "../services/logging.service";
import { useEffect, useMemo, useState } from "react";
import { setMsalInstance } from "../services/axios.service";
import { msalConfig } from "./auth.context";

type Props = {
	children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
	const pca = useMemo(() => new PublicClientApplication(msalConfig), []);
	console.log(msalConfig);
	const [bootLoading, setBootLoading] = useState(true);
	useEffect(() => {
		const initialize = async () => {
			await pca.initialize();
			const result = await pca.handleRedirectPromise();
			if (result?.account) {
				pca.setActiveAccount(result.account);
			}
			setMsalInstance(pca); // Set the MSAL instance in axios service
		};
		initialize()
			.catch((error) => {
				// Handle errors from initialization
				LogError("Error initializing MSAL:", error);
			})
			.finally(() => setBootLoading(false));
	});

	if (bootLoading) return <SplashScreen />;

	return <MsalProvider instance={pca}>{children}</MsalProvider>;
}
