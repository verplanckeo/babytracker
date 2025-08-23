import { useState } from "react";
import { Container, Alert } from "@mui/material";
import type { BabyEntry, NewBabyEntry } from "../../interfaces";
import { dataService } from "../../services/data.service";
import AddEntryView from "../../components/addentry/AddEntryView";

function AddEntriesView() {
	// keep a separate error state for mutations (saving/updating/deleting)
	const [mutationError, setMutationError] = useState<string | null>(null);

	const [savingEntry, setSavingEntry] = useState<boolean>(false);

	const addEntry = async (
		newEntry: NewBabyEntry
	): Promise<{ success: boolean; entry?: BabyEntry; error?: string }> => {
		setSavingEntry(true);
		try {
			setMutationError(null);
			const savedEntry = await dataService.saveEntry(newEntry);
			return { success: true, entry: savedEntry };
		} catch {
			const errorMessage = "Failed to save entry. Please try again.";
			setMutationError(errorMessage);
			return { success: false, error: errorMessage };
		} finally {
			setSavingEntry(false);
		}
	};

	const handleCloseError = (): void => {
		// close either mutation or load errors
		setMutationError(null);
	};

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
