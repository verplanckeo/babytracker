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
import type { NewBabyEntry, BabyEntry } from "../../interfaces";
import { useNotification } from "../../notification/hooks/use-notification";

interface AddEntryViewProps {
	onAddEntry: (
		entry: NewBabyEntry
	) => Promise<{ success: boolean; entry?: BabyEntry; error?: string }>;
	loading?: boolean;
}

interface FormData {
	date: Dayjs;
	time: Dayjs;
	feedType: "BOTTLE" | "BREAST";
	startingBreast: "LEFT" | "RIGHT";
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
		feedType: "BOTTLE",
		startingBreast: "LEFT",
		temperature: "",
		didPee: false,
		didPoo: false,
		didThrowUp: false,
	});
	const [submitting, setSubmitting] = useState<boolean>(false);
	const { showSuccess, showError } = useNotification();

	const handleSubmit = async (): Promise<void> => {
		const entry: NewBabyEntry = {
			date: formData.date.format("YYYY-MM-DD"),
			time: formData.time.format("HH:mm:ss"),
			feedType: formData.feedType,
			startingBreast:
				formData.feedType === "BREAST" ? formData.startingBreast : null,
			temperature: formData.temperature
				? parseFloat(formData.temperature)
				: null,
			didPee: formData.didPee,
			didPoo: formData.didPoo,
			didThrowUp: formData.didThrowUp,
		};

		try {
			setSubmitting(true);
			const result = await onAddEntry(entry);
			if (result.success) {
				// Reset form on success
				setFormData({
					date: dayjs(),
					time: dayjs(),
					feedType: "BOTTLE",
					startingBreast: "LEFT",
					temperature: "",
					didPee: false,
					didPoo: false,
					didThrowUp: false,
				});
				showSuccess("Entry saved successfully! 🍼", 4000);
			} else {
				showError(result.error || "Failed to save entry. Please try again.");
			}
		} catch (error) {
			showError("Failed to save entry. Please try again." + error);
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
		handleChange("feedType", event.target.value as "BOTTLE" | "BREAST");
	};

	const handleStartingBreastChange = (
		event: React.ChangeEvent<HTMLInputElement>
	): void => {
		handleChange("startingBreast", event.target.value as "LEFT" | "RIGHT");
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
									value="BOTTLE"
									control={<Radio />}
									label={
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											<LocalDrink />
											Bottle
										</Box>
									}
								/>
								<FormControlLabel
									value="BREAST"
									control={<Radio />}
									label="Breast"
								/>
							</RadioGroup>
						</FormControl>

						{formData.feedType === "BREAST" && (
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
										value="LEFT"
										control={<Radio />}
										label="Left"
									/>
									<FormControlLabel
										value="RIGHT"
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
		</Box>
	);
};

export default AddEntryView;
