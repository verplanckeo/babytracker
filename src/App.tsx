import React, { useState, useEffect } from "react";
import {
	Container,
	AppBar,
	Toolbar,
	Typography,
	BottomNavigation,
	BottomNavigationAction,
	Box,
	CircularProgress,
	Alert,
} from "@mui/material";
import { Add, Assessment, ChildCare } from "@mui/icons-material";
import type { BabyEntry, NewBabyEntry } from "./interfaces";
import { dataService } from "./services/data.service";
import OverviewView from "./components/overview/OverView";
import AddEntryView from "./components/addentry/AddEntryView";

function App() {
	const [entries, setEntries] = useState<BabyEntry[]>([]);
	const [currentView, setCurrentView] = useState<number>(0); // 0 = add, 1 = overview
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Load data on component mount
	useEffect(() => {
		const loadData = async (): Promise<void> => {
			try {
				setLoading(true);
				const loadedEntries = await dataService.loadEntries();
				setEntries(loadedEntries);
				setError(null);
			} catch (err) {
				setError("Failed to load data. Please try again.");
				console.error("Error loading data:", err);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []);

	const addEntry = async (newEntry: NewBabyEntry): Promise<BabyEntry> => {
		try {
			setError(null);
			const savedEntry = await dataService.saveEntry(newEntry);
			setEntries((prev) => [...prev, savedEntry]);
			return savedEntry;
		} catch (err) {
			setError("Failed to save entry. Please try again.");
			console.error("Error adding entry:", err);
			throw err;
		}
	};

	const updateEntry = async (
		entryId: string,
		updatedData: Partial<NewBabyEntry>
	): Promise<BabyEntry> => {
		try {
			setError(null);
			const updatedEntry = await dataService.updateEntry(entryId, updatedData);
			setEntries((prev) =>
				prev.map((entry) => (entry.id === entryId ? updatedEntry : entry))
			);
			return updatedEntry;
		} catch (err) {
			setError("Failed to update entry. Please try again.");
			console.error("Error updating entry:", err);
			throw err;
		}
	};

	const deleteEntry = async (entryId: string): Promise<void> => {
		try {
			setError(null);
			await dataService.deleteEntry(entryId);
			setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
		} catch (err) {
			setError("Failed to delete entry. Please try again.");
			console.error("Error deleting entry:", err);
			throw err;
		}
	};

	const handleViewChange = (
		_: React.SyntheticEvent,
		newValue: number
	): void => {
		setCurrentView(newValue);
	};

	const handleCloseError = (): void => {
		setError(null);
	};

	if (loading) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
					flexDirection: "column",
					gap: 2,
				}}
			>
				<CircularProgress />
				<Typography>Loading baby data...</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ pb: 7 }}>
			<AppBar position="static" elevation={0}>
				<Toolbar>
					<ChildCare sx={{ mr: 2 }} />
					<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
						Baby Tracker
					</Typography>
				</Toolbar>
			</AppBar>

			{error && (
				<Container maxWidth="md" sx={{ mt: 2 }}>
					<Alert severity="error" onClose={handleCloseError}>
						{error}
					</Alert>
				</Container>
			)}

			<Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
				{currentView === 0 && (
					<AddEntryView onAddEntry={addEntry} loading={loading} />
				)}
				{currentView === 1 && (
					<OverviewView
						entries={entries}
						onUpdateEntry={updateEntry}
						onDeleteEntry={deleteEntry}
						loading={loading}
					/>
				)}
			</Container>

			<BottomNavigation
				value={currentView}
				onChange={handleViewChange}
				sx={{
					position: "fixed",
					bottom: 0,
					left: 0,
					right: 0,
					elevation: 3,
					borderTop: 1,
					borderColor: "divider",
				}}
			>
				<BottomNavigationAction label="Add Entry" icon={<Add />} />
				<BottomNavigationAction label="Overview" icon={<Assessment />} />
			</BottomNavigation>
		</Box>
	);
}

export default App;
