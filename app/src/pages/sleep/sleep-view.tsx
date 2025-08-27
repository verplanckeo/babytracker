import React, { useState, useEffect } from "react";
import {
	Container,
	Box,
	Typography,
	ToggleButton,
	ToggleButtonGroup,
	Card,
	CardContent,
	Alert,
} from "@mui/material";
import { Bedtime, Timeline } from "@mui/icons-material";
import { useNotification } from "../../notification/hooks/use-notification";
import type {
	SleepEntry,
	NewSleepEntry,
	ActiveSleepSession,
} from "../../interfaces";
import { SleepDataService } from "../../services/sleepdata.service";
import SleepOverview from "../../components/sleepoverview/SleepOverview";
import AddSleepEntryView from "../../components/addsleepentry/AddSleepEntryView";

function SleepView() {
	const [viewMode, setViewMode] = useState<"timer" | "overview">("timer");
	const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
	const [activeSleep, setActiveSleep] = useState<ActiveSleepSession | null>(
		null
	);
	const [loading, setLoading] = useState<boolean>(true);
	const { showSuccess, showError } = useNotification();

	const sleepDataService = new SleepDataService();

	useEffect(() => {
		loadSleepEntries();
	}, []);

	const loadSleepEntries = async (): Promise<void> => {
		try {
			setLoading(true);
			const entries = await sleepDataService.loadSleepEntries();
			setSleepEntries(entries);

			// Find active sleep session
			const activeEntry = entries.find((entry) => entry.isActive);
			if (activeEntry) {
				setActiveSleep({
					id: activeEntry.id,
					startTime: activeEntry.startTime,
					date: activeEntry.date,
					elapsedMinutes: 0, // Will be calculated in component
				});
			}
		} catch (error) {
			console.error("Failed to load sleep entries:", error);
			showError("Failed to load sleep data. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleStartSleep = async (entry: NewSleepEntry): Promise<void> => {
		try {
			const newEntry = await sleepDataService.createSleepEntry(entry);
			setSleepEntries((prev) => [newEntry, ...prev]);
			setActiveSleep({
				id: newEntry.id,
				startTime: newEntry.startTime,
				date: newEntry.date,
				elapsedMinutes: 0,
			});
			showSuccess("Sleep tracking started! 😴", 3000);
		} catch (error) {
			console.error("Failed to start sleep:", error);
			showError("Failed to start sleep tracking. Please try again.");
			throw error;
		}
	};

	const handleStopSleep = async (
		sleepId: string,
		endTime: string,
		duration: number
	): Promise<void> => {
		try {
			const updatedEntry = await sleepDataService.updateSleepEntry(sleepId, {
				endTime,
				duration,
				isActive: false,
			});

			setSleepEntries((prev) =>
				prev.map((entry) => (entry.id === sleepId ? updatedEntry : entry))
			);
			setActiveSleep(null);
			showSuccess(
				`Sleep ended! Baby slept for ${Math.floor(duration / 60)}h ${
					duration % 60
				}m 🌅`,
				4000
			);
		} catch (error) {
			console.error("Failed to stop sleep:", error);
			showError("Failed to stop sleep tracking. Please try again.");
			throw error;
		}
	};

	const handleUpdateSleep = async (
		sleepId: string,
		updatedData: Partial<NewSleepEntry>
	): Promise<void> => {
		try {
			const updatedEntry = await sleepDataService.updateSleepEntry(
				sleepId,
				updatedData
			);
			setSleepEntries((prev) =>
				prev.map((entry) => (entry.id === sleepId ? updatedEntry : entry))
			);

			// Update active sleep if it's the one being updated
			if (activeSleep && activeSleep.id === sleepId) {
				setActiveSleep({
					...activeSleep,
					startTime: updatedData.startTime || activeSleep.startTime,
					date: updatedData.date || activeSleep.date,
				});
			}
		} catch (error) {
			console.error("Failed to update sleep:", error);
			showError("Failed to update sleep entry. Please try again.");
			throw error;
		}
	};

	const handleDeleteEntry = async (entryId: string): Promise<void> => {
		try {
			await sleepDataService.deleteSleepEntry(entryId);
			setSleepEntries((prev) => prev.filter((entry) => entry.id !== entryId));
			showSuccess("Sleep entry deleted successfully", 2000);
		} catch (error) {
			console.error("Failed to delete sleep entry:", error);
			showError("Failed to delete entry. Please try again.");
		}
	};

	const handleViewModeChange = (
		_event: React.MouseEvent<HTMLElement>,
		newMode: "timer" | "overview" | null
	): void => {
		if (newMode !== null) {
			setViewMode(newMode);
		}
	};

	return (
		<Container maxWidth="md" sx={{ py: 3, pb: 10 }}>
			<Box sx={{ mb: 3 }}>
				<Typography variant="h4" component="h1" gutterBottom>
					Sleep Tracker
				</Typography>
				<Typography variant="body1" color="text.secondary" gutterBottom>
					Track your baby's sleep patterns and get insights
				</Typography>
			</Box>

			{/* View Mode Toggle */}
			<Card sx={{ mb: 3 }}>
				<CardContent>
					<ToggleButtonGroup
						value={viewMode}
						exclusive
						onChange={handleViewModeChange}
						aria-label="view mode"
						fullWidth
						sx={{ mb: 0 }}
					>
						<ToggleButton value="timer" aria-label="sleep timer">
							<Bedtime sx={{ mr: 1 }} />
							Sleep Timer
						</ToggleButton>
						<ToggleButton value="overview" aria-label="sleep overview">
							<Timeline sx={{ mr: 1 }} />
							Sleep Overview
						</ToggleButton>
					</ToggleButtonGroup>
				</CardContent>
			</Card>

			{/* Active Sleep Alert */}
			{activeSleep && viewMode === "overview" && (
				<Alert severity="info" sx={{ mb: 3 }} icon={<Bedtime />}>
					Baby is currently sleeping since {activeSleep.startTime} on{" "}
					{activeSleep.date}
				</Alert>
			)}

			{/* Content based on view mode */}
			{viewMode === "timer" ? (
				<AddSleepEntryView
					activeSleep={activeSleep}
					onStartSleep={handleStartSleep}
					onStopSleep={handleStopSleep}
					onUpdateSleep={handleUpdateSleep}
					loading={loading}
				/>
			) : (
				<SleepOverview
					sleepEntries={sleepEntries}
					loading={loading}
					onDeleteEntry={handleDeleteEntry}
				/>
			)}
		</Container>
	);
}

export default SleepView;
