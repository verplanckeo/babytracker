import { useMsalAuth } from "../hooks/use-msal-auth";
import { useEffect, useState } from "react";
import { useRouter } from "../../hooks/use-router";
import { useSearchParams } from "../../hooks/use-searchparams";
import SplashScreen from "../../components/splashscreen/SplashScreen";
import { msalConfig } from "../auth.context";

type Props = {
	children: React.ReactNode;
};

export function GuestGuard({ children }: Props) {
	const router = useRouter();

	const searchParams = useSearchParams();

	const { isLoading, isAuthenticated } = useMsalAuth();

	const [isChecking, setIsChecking] = useState<boolean>(true);

	const rawReturnTo = searchParams.get("returnTo");
	const returnTo: string = rawReturnTo
		? decodeURIComponent(rawReturnTo)
		: (msalConfig.auth.redirectUri as string);

	const checkPermissions = async (): Promise<void> => {
		if (isLoading) {
			console.log("isloading");
			return;
		}

		if (isAuthenticated) {
			if (!returnTo.includes("/login")) {
				router.replace(returnTo);
			} else {
				router.replace("/dashboard");
			}
			return;
		}

		setIsChecking(false);
	};

	useEffect(() => {
		checkPermissions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated, isLoading]);

	if (isChecking) {
		return <SplashScreen />;
	}

	return <>{children}</>;
}
