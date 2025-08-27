import { Navigate, Route, Routes } from "react-router-dom";
import { NavigationBar } from "./components/navbar/NavigationBar";
import { LoginPage } from "./pages/login";
import { GuestGuard } from "./auth/guard/guest-guard";
import AuthGuard from "./auth/guard/auth-guard";
import { EntriesPage } from "./pages/entries";
import { AddEntriesPage } from "./pages/add-entries";
import { Header } from "./components/header/Header";
import NotificationContainer from "./notification/NotificationContainer";
import { SleepPage } from "./pages/sleep";

function App() {
	return (
		<>
			<Header />
			<Routes>
				<Route path="/" element={<Navigate to="/add" replace />} />
				<Route
					path="/login"
					element={
						<GuestGuard>
							<LoginPage />
						</GuestGuard>
					}
				/>
				<Route
					path="/add"
					element={
						<AuthGuard>
							<AddEntriesPage />
						</AuthGuard>
					}
				/>
				<Route
					path="/overview"
					element={
						<AuthGuard>
							<EntriesPage />
						</AuthGuard>
					}
				/>
				<Route
					path="/sleep"
					element={
						<AuthGuard>
							<SleepPage />
						</AuthGuard>
					}
				/>
				<Route path="*" element={<Navigate to="/login" replace />} />
			</Routes>

			<NotificationContainer />
			<NavigationBar />
		</>
	);
}

export default App;
