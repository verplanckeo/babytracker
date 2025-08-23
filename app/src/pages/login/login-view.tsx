import { useNavigate } from "react-router-dom";
import { useMsalAuth } from "../../auth/hooks/use-msal-auth";
import { Typography, Button, Stack } from "@mui/material";
import { SvgColor } from "../../components/svg-color";
import { LogError } from "../../services/logging.service";
import { useCallback, useEffect } from "react";

export default function LoginView() {
	// ----------------------------------------------------------------------
	const icon = (name: string) => (
		<SvgColor src={`/assets/icons/logo/${name}.svg`} />
	);
	const ICONS = {
		microsoft: icon("ic-microsoft"),
	};
	// ----------------------------------------------------------------------

	const { isAuthenticated, loginRedirect } = useMsalAuth();
	const navigate = useNavigate();

	const handleSigninWithRedirect = useCallback(async () => {
		try {
			await loginRedirect();
		} catch (error) {
			LogError("Login redirect function is not defined.", error);
		}
	}, [loginRedirect]);

	useEffect(() => {
		if (isAuthenticated) navigate("/dashboard");
	}, [isAuthenticated, navigate]);

	return (
		<>
			<Typography variant="h5" sx={{ mb: 5, textAlign: "center" }}>
				Sign in to your account
			</Typography>

			<Stack spacing={2}>
				<Button
					fullWidth
					color="primary"
					size="large"
					variant="contained"
					onClick={handleSigninWithRedirect}
					startIcon={ICONS.microsoft}
				>
					Sign in with redirect
				</Button>
			</Stack>
		</>
	);
}
