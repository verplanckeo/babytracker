import React, { useEffect } from "react";

import { CircularProgress, Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useMsalAuth } from "../hooks/use-msal-auth";

interface ProtectedRouteProps {
	children: React.ReactElement;
}

export default function AuthGuard({ children }: ProtectedRouteProps) {
	const { acquiringToken, isAuthenticated } = useMsalAuth();
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		// Only run once loading is finished
		if (!acquiringToken) {
			if (!isAuthenticated) {
				if (location.pathname === "/login") return;

				// not signed in → go to the login page
				const encodedReturnTo = encodeURIComponent(
					location.pathname + location.search
				);
				navigate(`/login?returnTo=${encodedReturnTo}`, { replace: true });
			}
		}
	}, [
		acquiringToken,
		isAuthenticated,
		location.pathname,
		location.search,
		navigate,
	]);

	if (acquiringToken) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	// authenticated! render the protected children
	return <>{children}</>;
}
