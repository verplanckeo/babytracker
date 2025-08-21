import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	FormControl,
	FormLabel,
	RadioGroup,
	FormControlLabel,
	Radio,
	FormGroup,
	Checkbox,
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
	Edit,
	Close,
} from "@mui/icons-material";
import dayjs, { Dayjs } from "dayjs";
import type { BabyEntry, NewBabyEntry } from "../../interfaces";

interface EditEntryDialogProps {
	open: boolean;
	entry: BabyEntry;
	onSave: (updatedData: Partial<NewBabyEntry>) => Promise<void>;
	onClose: () => void;
}

interface EditFormData {
	date: Dayjs;
	time: Dayjs;
	feedType: "bottle" | "breast";
	startingBreast: "left" | "right";
	temperature: string;
	didPee: boolean;
	didPoo: boolean;
	didThrowUp: boolean;
}

const EditEntryDialog: React.FC<EditEntryDialogProps> = ({
	open,
	entry,
	onSave,
	onClose,
}) => {
	const [formData, setFormData] = useState<EditFormData>({
		date: dayjs(),
		time: dayjs(),
		feedType: "bottle",
		startingBreast: "left",
		temperature: "",
		didPee: false,
		didPoo: false,
		didThrowUp: false,
	});
	const [saving, setSaving] = useState<boolean>(false);

	// Initialize form data when entry changes
	useEffect(() => {
		if (entry && open) {
			setFormData({
				date: dayjs(entry.date),
				time: dayjs(`2000-01-01T${entry.time}`),
				feedType: entry.feedType,
				startingBreast: entry.startingBreast || "left",
				temperature: entry.temperature?.toString() || "",
				didPee: entry.didPee,
				didPoo: entry.didPoo,
				didThrowUp: entry.didThrowUp,
			});
		}
	}, [entry, open]);

	const handleSave = async (): Promise<void> => {
		const updatedData: Partial<NewBabyEntry> = {
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
			setSaving(true);
			await onSave(updatedData);
		} catch (error) {
			// Error handling is done in parent component
			console.error("Failed to save entry:", error);
		} finally {
			setSaving(false);
		}
	};

	const handleChange = <T extends keyof EditFormData>(
		field: T,
		value: EditFormData[T]
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
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: { maxHeight: "90vh" },
			}}
		>
			<DialogTitle>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Edit color="primary" />
					Edit Entry
				</Box>
			</DialogTitle>

			<DialogContent sx={{ pt: 2 }}>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
					<DatePicker
						label="Date"
						value={formData.date}
						onChange={handleDateChange}
						disabled={saving}
						sx={{ width: "100%" }}
					/>

					<TimePicker
						label="Time"
						value={formData.time}
						onChange={handleTimeChange}
						disabled={saving}
						sx={{ width: "100%" }}
					/>

					<FormControl component="fieldset" disabled={saving}>
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
						<FormControl component="fieldset" disabled={saving}>
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
						disabled={saving}
						InputProps={{
							endAdornment: <InputAdornment position="end">°C</InputAdornment>,
							startAdornment: (
								<InputAdornment position="start">
									<Thermostat />
								</InputAdornment>
							),
						}}
						placeholder="Optional"
						fullWidth
					/>

					<FormControl component="fieldset" disabled={saving}>
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
				</Box>
			</DialogContent>

			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose} disabled={saving} startIcon={<Close />}>
					Cancel
				</Button>
				<Button
					onClick={handleSave}
					variant="contained"
					disabled={saving}
					startIcon={saving ? <CircularProgress size={20} /> : <Edit />}
				>
					{saving ? "Saving..." : "Save Changes"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default EditEntryDialog;
