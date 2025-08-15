import React, { useEffect, useState } from "react";
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
import { useAsync } from "./hooks/use-async";
import { dataService } from "./services/data.service";
import OverviewView from "./components/overview/OverView";
import AddEntryView from "./components/addentry/AddEntryView";

function App() {
	const [entries, setEntries] = useState<BabyEntry[]>([]);
	const [currentView, setCurrentView] = useState<number>(0); // 0 = add, 1 = overview
	// keep a separate error state for mutations (saving/updating/deleting)
	const [mutationError, setMutationError] = useState<string | null>(null);

	// Load data with the hook
	const {
		loading: loadingEntries,
		error: loadError,
		data: loadedEntries,
	} = useAsync<BabyEntry[]>(dataService.loadEntries, []);

	// When the hook returns data, sync it into local state so
	// add/update/delete can optimistically update `entries`
	useEffect(() => {
		if (loadedEntries) {
			setEntries(loadedEntries);
		}
	}, [loadedEntries]);

	const addEntry = async (newEntry: NewBabyEntry): Promise<BabyEntry> => {
		try {
			setMutationError(null);
			const savedEntry = await dataService.saveEntry(newEntry);
			setEntries((prev) => [...prev, savedEntry]);
			return savedEntry;
		} catch (err) {
			setMutationError("Failed to save entry. Please try again.");
			console.error("Error adding entry:", err);
			throw err;
		}
	};

	const updateEntry = async (
		entryId: string,
		updatedData: Partial<NewBabyEntry>
	): Promise<BabyEntry> => {
		try {
			setMutationError(null);
			const updatedEntry = await dataService.updateEntry(entryId, updatedData);
			setEntries((prev) =>
				prev.map((entry) => (entry.id === entryId ? updatedEntry : entry))
			);
			return updatedEntry;
		} catch (err) {
			setMutationError("Failed to update entry. Please try again.");
			console.error("Error updating entry:", err);
			throw err;
		}
	};

	const deleteEntry = async (entryId: string): Promise<void> => {
		try {
			setMutationError(null);
			await dataService.deleteEntry(entryId);
			setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
		} catch (err) {
			setMutationError("Failed to delete entry. Please try again.");
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
		// close either mutation or load errors
		setMutationError(null);
		// loadError comes from the hook; to clear it you’d typically re-run the hook (see tip below)
	};

	if (loadingEntries) {
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

	const combinedError =
		mutationError || (loadError ? (loadError as Error).message : null);

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

			{combinedError && (
				<Container maxWidth="md" sx={{ mt: 2 }}>
					<Alert severity="error" onClose={handleCloseError}>
						{combinedError}
					</Alert>
				</Container>
			)}

			<Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
				{currentView === 0 && (
					<AddEntryView onAddEntry={addEntry} loading={loadingEntries} />
				)}
				{currentView === 1 && (
					<OverviewView
						entries={entries}
						onUpdateEntry={updateEntry}
						onDeleteEntry={deleteEntry}
						loading={loadingEntries}
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
