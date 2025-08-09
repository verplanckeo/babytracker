import React, { useState } from "react";
import {
	Card,
	CardContent,
	Typography,
	TextField,
	FormControl,
	FormLabel,
	RadioGroup,
	FormControlLabel,
	Radio,
	FormGroup,
	Checkbox,
	Button,
	Box,
	Snackbar,
	Alert,
	InputAdornment,
	CircularProgress,
} from "@mui/material";
import { TimePicker, DatePicker } from "@mui/x-date-pickers";
import {
	LocalDrink,
	Thermostat,
	Water,
	Cake,
	Warning,
} from "@mui/icons-material";
import dayjs, { Dayjs } from "dayjs";
import type { NewBabyEntry, BabyEntry, SnackbarState } from "../../interfaces";

interface AddEntryViewProps {
	onAddEntry: (entry: NewBabyEntry) => Promise<BabyEntry>;
	loading?: boolean;
}

interface FormData {
	date: Dayjs;
	time: Dayjs;
	feedType: "bottle" | "breast";
	startingBreast: "left" | "right";
	temperature: string;
	didPee: boolean;
	didPoo: boolean;
	didThrowUp: boolean;
}

const AddEntryView: React.FC<AddEntryViewProps> = ({
	onAddEntry,
	loading = false,
}) => {
	const [formData, setFormData] = useState<FormData>({
		date: dayjs(),
		time: dayjs(),
		feedType: "bottle",
		startingBreast: "left",
		temperature: "",
		didPee: false,
		didPoo: false,
		didThrowUp: false,
	});
	const [snackbar, setSnackbar] = useState<SnackbarState>({
		open: false,
		message: "",
		severity: "success",
	});
	const [submitting, setSubmitting] = useState<boolean>(false);

	const handleSubmit = async (): Promise<void> => {
		const entry: NewBabyEntry = {
			date: formData.date.format("YYYY-MM-DD"),
			time: formData.time.format("HH:mm"),
			feedType: formData.feedType,
			startingBreast:
				formData.feedType === "breast" ? formData.startingBreast : null,
			temperature: formData.temperature
				? parseFloat(formData.temperature)
				: null,
			didPee: formData.didPee,
			didPoo: formData.didPoo,
			didThrowUp: formData.didThrowUp,
		};

		try {
			setSubmitting(true);
			await onAddEntry(entry);

			// Reset form on success
			setFormData({
				date: dayjs(),
				time: dayjs(),
				feedType: "bottle",
				startingBreast: "left",
				temperature: "",
				didPee: false,
				didPoo: false,
				didThrowUp: false,
			});

			setSnackbar({
				open: true,
				message: "Entry saved successfully!",
				severity: "success",
			});
		} catch (error) {
			setSnackbar({
				open: true,
				message: "Failed to save entry. Please try again.",
				severity: "error",
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleChange = <T extends keyof FormData>(
		field: T,
		value: FormData[T]
	): void => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleCloseSnackbar = (): void => {
		setSnackbar((prev) => ({ ...prev, open: false }));
	};

	const handleDateChange = (value: Dayjs | null): void => {
		if (value) {
			handleChange("date", value);
		}
	};

	const handleTimeChange = (value: Dayjs | null): void => {
		if (value) {
			handleChange("time", value);
		}
	};

	const handleFeedTypeChange = (
		event: React.ChangeEvent<HTMLInputElement>
	): void => {
		handleChange("feedType", event.target.value as "bottle" | "breast");
	};

	const handleStartingBreastChange = (
		event: React.ChangeEvent<HTMLInputElement>
	): void => {
		handleChange("startingBreast", event.target.value as "left" | "right");
	};

	const handleTemperatureChange = (
		event: React.ChangeEvent<HTMLInputElement>
	): void => {
		handleChange("temperature", event.target.value);
	};

	const handleCheckboxChange =
		(field: "didPee" | "didPoo" | "didThrowUp") =>
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			handleChange(field, event.target.checked);
		};

	return (
		<Box>
			<Card>
				<CardContent>
					<Typography variant="h5" component="h2" gutterBottom>
						Add New Entry
					</Typography>

					<Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 3 }}>
						<DatePicker
							label="Date"
							value={formData.date}
							onChange={handleDateChange}
							disabled={loading || submitting}
							sx={{ width: "100%" }}
						/>

						<TimePicker
							label="Time"
							value={formData.time}
							onChange={handleTimeChange}
							disabled={loading || submitting}
							sx={{ width: "100%" }}
						/>

						<FormControl component="fieldset" disabled={loading || submitting}>
							<FormLabel component="legend">Feed Type</FormLabel>
							<RadioGroup
								value={formData.feedType}
								onChange={handleFeedTypeChange}
								row
							>
								<FormControlLabel
									value="bottle"
									control={<Radio />}
									label={
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											<LocalDrink />
											Bottle
										</Box>
									}
								/>
								<FormControlLabel
									value="breast"
									control={<Radio />}
									label="Breast"
								/>
							</RadioGroup>
						</FormControl>

						{formData.feedType === "breast" && (
							<FormControl
								component="fieldset"
								disabled={loading || submitting}
							>
								<FormLabel component="legend">Starting Breast</FormLabel>
								<RadioGroup
									value={formData.startingBreast}
									onChange={handleStartingBreastChange}
									row
								>
									<FormControlLabel
										value="left"
										control={<Radio />}
										label="Left"
									/>
									<FormControlLabel
										value="right"
										control={<Radio />}
										label="Right"
									/>
								</RadioGroup>
							</FormControl>
						)}

						<TextField
							label="Temperature"
							type="number"
							inputProps={{ step: 0.1, min: 35, max: 42 }}
							value={formData.temperature}
							onChange={handleTemperatureChange}
							disabled={loading || submitting}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">°C</InputAdornment>
								),
								startAdornment: (
									<InputAdornment position="start">
										<Thermostat />
									</InputAdornment>
								),
							}}
							placeholder="Optional"
							fullWidth
						/>

						<FormControl component="fieldset" disabled={loading || submitting}>
							<FormLabel component="legend">Other Activities</FormLabel>
							<FormGroup>
								<FormControlLabel
									control={
										<Checkbox
											checked={formData.didPee}
											onChange={handleCheckboxChange("didPee")}
										/>
									}
									label={
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											<Water color="info" />
											Did pee
										</Box>
									}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={formData.didPoo}
											onChange={handleCheckboxChange("didPoo")}
										/>
									}
									label={
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											<Cake sx={{ color: "#8D6E63" }} />
											Did poo
										</Box>
									}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={formData.didThrowUp}
											onChange={handleCheckboxChange("didThrowUp")}
										/>
									}
									label={
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											<Warning color="error" />
											Did throw up
										</Box>
									}
								/>
							</FormGroup>
						</FormControl>

						<Button
							variant="contained"
							size="large"
							onClick={handleSubmit}
							disabled={loading || submitting}
							sx={{ mt: 2 }}
							fullWidth
							startIcon={submitting ? <CircularProgress size={20} /> : null}
						>
							{submitting ? "Saving..." : "Save Entry"}
						</Button>
					</Box>
				</CardContent>
			</Card>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={4000}
				onClose={handleCloseSnackbar}
			>
				<Alert
					severity={snackbar.severity}
					onClose={handleCloseSnackbar}
					variant="filled"
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default AddEntryView;
