import React, { useState, useEffect, useRef } from "react";

// Import Material-UI components with proper TypeScript support
import {
	Card,
	CardContent,
	Typography,
	Button,
	Box,
	CircularProgress,
	TextField,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Chip,
	Paper,
	InputAdornment,
} from "@mui/material";

import {
	PlayArrow,
	Stop,
	Edit,
	Bedtime,
	WbSunny,
	AccessTime,
	Comment,
} from "@mui/icons-material";

import { TimePicker, DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import type { ActiveSleepSession } from "../../interfaces/activesleepsession.interface";
import type { NewSleepEntry } from "../../interfaces/newsleepentry.interface";

interface SleepTimerProps {
	activeSleep?: ActiveSleepSession | null;
	onStartSleep: (entry: NewSleepEntry) => Promise<void>;
	onStopSleep: (
		sleepId: string,
		endTime: string,
		duration: number
	) => Promise<void>;
	onUpdateSleep: (
		sleepId: string,
		updatedData: Partial<NewSleepEntry>
	) => Promise<void>;
	loading?: boolean;
}

const AddSleepEntryView: React.FC<SleepTimerProps> = ({
	activeSleep,
	onStartSleep,
	onStopSleep,
	onUpdateSleep,
	loading = false,
}) => {
	const [elapsedTime, setElapsedTime] = useState<number>(0);
	const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
	const [editFormData, setEditFormData] = useState({
		date: dayjs(),
		startTime: dayjs(),
		endTime: dayjs(),
		comment: "",
	});
	const [submitting, setSubmitting] = useState<boolean>(false);
	const intervalRef = useRef<number | null>(null);

	// Update elapsed time for active sleep
	useEffect(() => {
		if (activeSleep) {
			const updateElapsedTime = () => {
				const startDateTime = dayjs(
					`${activeSleep.date}T${activeSleep.startTime}`
				);
				const now = dayjs();
				const elapsedSeconds = now.diff(startDateTime, "seconds");
				setElapsedTime(elapsedSeconds);
			};

			updateElapsedTime();
			intervalRef.current = setInterval(updateElapsedTime, 1000);

			return () => {
				if (intervalRef.current) {
					clearInterval(intervalRef.current);
				}
			};
		} else {
			setElapsedTime(0);
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		}
	}, [activeSleep]);

	const formatDuration = (seconds: number): string => {
		if (seconds < 60) {
			return `${seconds}s`;
		}
		const totalMinutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		if (totalMinutes < 60) {
			return `${totalMinutes}m ${remainingSeconds}s`;
		}
		const hours = Math.floor(totalMinutes / 60);
		const remainingMinutes = totalMinutes % 60;
		return `${hours}h ${remainingMinutes}m`;
	};

	const handleStartSleep = async (): Promise<void> => {
		if (loading) return;

		const now = dayjs();
		const newSleepEntry: NewSleepEntry = {
			date: now.format("YYYY-MM-DD"),
			startTime: now.format("HH:mm:ss"),
			isActive: true,
			comment: "",
		};

		try {
			setSubmitting(true);
			await onStartSleep(newSleepEntry);
		} catch (error) {
			console.error("Failed to start sleep:", error);
		} finally {
			setSubmitting(false);
		}
	};

	const handleStopSleep = (): void => {
		if (!activeSleep) return;
		setShowEditDialog(true);

		// Pre-fill form with current data
		const startDateTime = dayjs(`${activeSleep.date}T${activeSleep.startTime}`);
		const now = dayjs();

		setEditFormData({
			date: dayjs(activeSleep.date),
			startTime: startDateTime,
			endTime: now,
			comment: "",
		});
	};

	const handleConfirmStop = async (): Promise<void> => {
		if (!activeSleep) return;

		try {
			setSubmitting(true);
			const endTime = editFormData.endTime.format("HH:mm:ss");
			const startDateTime = dayjs(
				`${editFormData.date.format(
					"YYYY-MM-DD"
				)}T${editFormData.startTime.format("HH:mm:ss")}`
			);
			const endDateTime = dayjs(
				`${editFormData.date.format("YYYY-MM-DD")}T${endTime}`
			);

			let duration = endDateTime.diff(startDateTime, "minutes");

			// Handle overnight sleep
			if (duration < 0) {
				duration = endDateTime.add(1, "day").diff(startDateTime, "minutes");
			}

			// First update the sleep entry with new times if changed
			if (
				!editFormData.startTime.isSame(
					dayjs(`${activeSleep.date}T${activeSleep.startTime}`)
				) ||
				!editFormData.date.isSame(dayjs(activeSleep.date))
			) {
				await onUpdateSleep(activeSleep.id, {
					date: editFormData.date.format("YYYY-MM-DD"),
					startTime: editFormData.startTime.format("HH:mm:ss"),
					comment: editFormData.comment,
				});
			}

			// Then stop the sleep
			await onStopSleep(activeSleep.id, endTime, duration);
			setShowEditDialog(false);
		} catch (error) {
			console.error("Failed to stop sleep:", error);
		} finally {
			setSubmitting(false);
		}
	};

	const handleCloseEditDialog = (): void => {
		setShowEditDialog(false);
	};

	return (
		<>
			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
						<Bedtime sx={{ fontSize: 40, color: "primary.main" }} />
						<Typography variant="h5" component="h2">
							Sleep Tracker
						</Typography>
					</Box>

					{activeSleep ? (
						<Box sx={{ textAlign: "center" }}>
							<Paper
								sx={{
									p: 3,
									mb: 3,
									bgcolor: "primary.50",
									border: "2px solid",
									borderColor: "primary.200",
								}}
							>
								<Typography variant="h6" color="primary" gutterBottom>
									😴 Baby is sleeping
								</Typography>
								<Typography
									variant="h3"
									color="primary.main"
									sx={{ my: 2, fontFamily: "monospace" }}
								>
									{formatDuration(elapsedTime)}
								</Typography>
								<Box
									sx={{
										display: "flex",
										justifyContent: "center",
										gap: 2,
										flexWrap: "wrap",
									}}
								>
									<Chip
										icon={<AccessTime />}
										label={`Started at ${activeSleep.startTime}`}
										color="primary"
										variant="outlined"
									/>
									<Chip
										icon={<Bedtime />}
										label={dayjs(activeSleep.date).format("MMM D")}
										color="primary"
										variant="outlined"
									/>
								</Box>
							</Paper>

							<Button
								variant="contained"
								color="secondary"
								size="large"
								startIcon={
									submitting ? (
										<CircularProgress size={20} color="inherit" />
									) : (
										<Stop />
									)
								}
								onClick={handleStopSleep}
								disabled={loading || submitting}
								sx={{ minWidth: 200, py: 1.5 }}
							>
								{submitting ? "Stopping..." : "Wake Up"}
							</Button>
						</Box>
					) : (
						<Box sx={{ textAlign: "center" }}>
							<WbSunny sx={{ fontSize: 60, color: "warning.main", mb: 2 }} />
							<Typography variant="h6" color="text.secondary" gutterBottom>
								Baby is awake
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
								Tap the button below when baby falls asleep
							</Typography>

							<Button
								variant="contained"
								color="primary"
								size="large"
								startIcon={
									submitting ? (
										<CircularProgress size={20} color="inherit" />
									) : (
										<PlayArrow />
									)
								}
								onClick={handleStartSleep}
								disabled={loading || submitting}
								sx={{ minWidth: 200, py: 1.5 }}
							>
								{submitting ? "Starting..." : "Start Sleep"}
							</Button>
						</Box>
					)}
				</CardContent>
			</Card>

			{/* Edit Sleep Dialog */}
			<Dialog
				open={showEditDialog}
				onClose={handleCloseEditDialog}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Edit />
						Adjust Sleep Times
					</Box>
				</DialogTitle>
				<DialogContent>
					<Box sx={{ pt: 1 }}>
						<DatePicker
							label="Sleep Date"
							value={editFormData.date}
							onChange={(date) =>
								date && setEditFormData((prev) => ({ ...prev, date }))
							}
							sx={{ width: "100%", mb: 3 }}
						/>

						<Box sx={{ display: "flex", gap: 2, mb: 3 }}>
							<TimePicker
								label="Sleep Start Time"
								value={editFormData.startTime}
								onChange={(time) =>
									time &&
									setEditFormData((prev) => ({ ...prev, startTime: time }))
								}
								sx={{ flex: 1 }}
							/>
							<TimePicker
								label="Wake Up Time"
								value={editFormData.endTime}
								onChange={(time) =>
									time &&
									setEditFormData((prev) => ({ ...prev, endTime: time }))
								}
								sx={{ flex: 1 }}
							/>
						</Box>

						<TextField
							label="Notes (optional)"
							multiline
							rows={3}
							value={editFormData.comment}
							onChange={(e) =>
								setEditFormData((prev) => ({
									...prev,
									comment: e.target.value,
								}))
							}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<Comment />
									</InputAdornment>
								),
							}}
							sx={{ width: "100%" }}
						/>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseEditDialog} disabled={submitting}>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmStop}
						variant="contained"
						disabled={submitting}
						startIcon={submitting ? <CircularProgress size={16} /> : undefined}
					>
						{submitting ? "Saving..." : "Save & Wake Up"}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default AddSleepEntryView;
