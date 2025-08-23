import { useState } from "react";
import {
	Container,
	Typography,
	Box,
	CircularProgress,
	Alert,
} from "@mui/material";
import type { BabyEntry, NewBabyEntry } from "../../interfaces";
import { dataService } from "../../services/data.service";
import AddEntryView from "../../components/addentry/AddEntryView";

function AddEntriesView() {
	// keep a separate error state for mutations (saving/updating/deleting)
	const [mutationError, setMutationError] = useState<string | null>(null);

	const [savingEntry, setSavingEntry] = useState<boolean>(false);

	const addEntry = async (newEntry: NewBabyEntry): Promise<BabyEntry> => {
		setSavingEntry(true);
		try {
			setMutationError(null);
			const savedEntry = await dataService.saveEntry(newEntry);
			return savedEntry;
		} catch (err) {
			setMutationError("Failed to save entry. Please try again.");
			console.error("Error adding entry:", err);
			throw err;
		} finally {
			setSavingEntry(false);
		}
	};

	const handleCloseError = (): void => {
		// close either mutation or load errors
		setMutationError(null);
	};

	if (savingEntry) {
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
		<>
			{mutationError && (
				<Container maxWidth="md" sx={{ mt: 2 }}>
					<Alert severity="error" onClose={handleCloseError}>
						{mutationError}
					</Alert>
				</Container>
			)}

			<Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
				<AddEntryView onAddEntry={addEntry} loading={savingEntry} />
			</Container>
		</>
	);
}

export default AddEntriesView;
