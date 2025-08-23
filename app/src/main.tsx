import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { StrictMode } from "react";
import { AuthProvider } from "./auth/auth.provider";
import { BrowserRouter } from "react-router-dom";
import { NotificationProvider } from "./notification/notification.provider";

const theme = createTheme({
	palette: {
		primary: {
			main: "#2196f3",
		},
		secondary: {
			main: "#4caf50",
		},
	},
	components: {
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: 12,
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 8,
					textTransform: "none",
				},
			},
		},
	},
});

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement
);

root.render(
	<StrictMode>
		<AuthProvider>
			<BrowserRouter>
				<NotificationProvider>
					<ThemeProvider theme={theme}>
						<CssBaseline />
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<App />
						</LocalizationProvider>
					</ThemeProvider>
				</NotificationProvider>
			</BrowserRouter>
		</AuthProvider>
	</StrictMode>
);
