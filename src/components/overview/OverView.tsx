import React, { useState } from "react";
import {
	Card,
	CardContent,
	Typography,
	Grid,
	Box,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Chip,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Divider,
	Paper,
	type SelectChangeEvent,
} from "@mui/material";
import {
	LocalDrink,
	Thermostat,
	Water,
	Cake,
	Warning,
	Timeline,
	Assessment,
} from "@mui/icons-material";
import dayjs from "dayjs";
import type { BabyEntry, NewBabyEntry, DayStats } from "../../interfaces";

interface OverviewViewProps {
	entries: BabyEntry[];
	onUpdateEntry: (
		entryId: string,
		updatedData: Partial<NewBabyEntry>
	) => Promise<BabyEntry>;
	onDeleteEntry: (entryId: string) => Promise<void>;
	loading?: boolean;
}

interface StatCardProps {
	title: string;
	value: number;
	subtitle?: string;
	color?: "primary" | "info" | "warning" | "error" | "secondary";
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: React.ComponentType<{ sx?: any }>;
}

const OverviewView: React.FC<OverviewViewProps> = ({
	entries,
	onUpdateEntry,
	onDeleteEntry,
	loading = false,
}) => {
	const getAvailableDates = (): string[] => {
		const dates = [...new Set(entries.map((entry) => entry.date))];
		return dates.sort().reverse();
	};

	const [selectedDate, setSelectedDate] = useState<string>(
		getAvailableDates()[0] || dayjs().format("YYYY-MM-DD")
	);

	const getDateStats = (date: string): DayStats => {
		const dayEntries = entries.filter((entry) => entry.date === date);

		return {
			totalFeedings: dayEntries.length,
			bottleFeeds: dayEntries.filter((e) => e.feedType === "bottle").length,
			breastFeeds: dayEntries.filter((e) => e.feedType === "breast").length,
			leftBreastFeeds: dayEntries.filter(
				(e) => e.feedType === "breast" && e.startingBreast === "left"
			).length,
			rightBreastFeeds: dayEntries.filter(
				(e) => e.feedType === "breast" && e.startingBreast === "right"
			).length,
			totalPees: dayEntries.filter((e) => e.didPee).length,
			totalPoos: dayEntries.filter((e) => e.didPoo).length,
			totalThrowUps: dayEntries.filter((e) => e.didThrowUp).length,
			avgTemperature:
				dayEntries.filter((e) => e.temperature).length > 0
					? (
							dayEntries
								.filter((e) => e.temperature)
								.reduce((sum, e) => sum + (e.temperature || 0), 0) /
							dayEntries.filter((e) => e.temperature).length
					  ).toFixed(1)
					: null,
			entries: dayEntries.sort((a, b) => a.time.localeCompare(b.time)),
		};
	};

	const availableDates = getAvailableDates();
	const stats = getDateStats(selectedDate);

	const StatCard: React.FC<StatCardProps> = ({
		title,
		value,
		subtitle,
		color = "primary",
		icon: Icon,
	}) => (
		<Card sx={{ height: "100%" }}>
			<CardContent sx={{ textAlign: "center" }}>
				<Icon sx={{ fontSize: 40, color: `${color}.main`, mb: 1 }} />
				<Typography variant="h4" color={`${color}.main`} fontWeight="bold">
					{value}
				</Typography>
				<Typography variant="h6" gutterBottom>
					{title}
				</Typography>
				{subtitle && (
					<Typography variant="caption" color="text.secondary">
						{subtitle}
					</Typography>
				)}
			</CardContent>
		</Card>
	);

	const formatTime = (time: string): string => {
		return dayjs(`2000-01-01T${time}`).format("HH:mm");
	};

	const handleDateChange = (event: SelectChangeEvent<string>): void => {
		setSelectedDate(event.target.value);
	};

	return (
		<Box>
			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
						<Assessment color="secondary" />
						<Typography variant="h5" component="h2">
							Daily Overview
						</Typography>
					</Box>

					<FormControl fullWidth>
						<InputLabel>Select Date</InputLabel>
						<Select
							value={selectedDate}
							label="Select Date"
							onChange={handleDateChange}
							disabled={loading}
						>
							{availableDates.map((date) => (
								<MenuItem key={date} value={date}>
									{dayjs(date).format("MMMM D, YYYY")}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</CardContent>
			</Card>

			{stats.totalFeedings === 0 ? (
				<Card>
					<CardContent>
						<Typography
							variant="h6"
							color="text.secondary"
							textAlign="center"
							py={4}
						>
							No entries for this date
						</Typography>
					</CardContent>
				</Card>
			) : (
				<Box>
					{/* Stats Grid */}
					<Grid container spacing={2} sx={{ mb: 3 }}>
						<Grid size={{ xs: 6, sm: 3 }}>
							<StatCard
								title="Total Feeds"
								value={stats.totalFeedings}
								subtitle={`${stats.bottleFeeds} bottle, ${stats.breastFeeds} breast`}
								color="primary"
								icon={LocalDrink}
							/>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<StatCard
								title="Pees"
								value={stats.totalPees}
								color="info"
								icon={Water}
							/>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<StatCard
								title="Poos"
								value={stats.totalPoos}
								color="warning"
								icon={Cake}
							/>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<StatCard
								title="Throw Ups"
								value={stats.totalThrowUps}
								color="error"
								icon={Warning}
							/>
						</Grid>
					</Grid>

					{/* Additional Info */}
					<Grid container spacing={2} sx={{ mb: 3 }}>
						{stats.breastFeeds > 0 && (
							<Grid size={{ xs: 12, sm: 6 }}>
								<Card>
									<CardContent>
										<Typography variant="h6" gutterBottom color="secondary">
											Breast Feeding
										</Typography>
										<Box sx={{ display: "flex", gap: 1 }}>
											<Chip
												label={`Left: ${stats.leftBreastFeeds}`}
												color="secondary"
												variant="outlined"
											/>
											<Chip
												label={`Right: ${stats.rightBreastFeeds}`}
												color="secondary"
												variant="outlined"
											/>
										</Box>
									</CardContent>
								</Card>
							</Grid>
						)}
						{stats.avgTemperature && (
							<Grid size={{ xs: 12, sm: 6 }}>
								<Card>
									<CardContent>
										<Typography variant="h6" gutterBottom>
											Average Temperature
										</Typography>
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											<Thermostat color="warning" />
											<Typography variant="h5" color="warning.main">
												{stats.avgTemperature}°C
											</Typography>
										</Box>
									</CardContent>
								</Card>
							</Grid>
						)}
					</Grid>

					{/* Timeline */}
					<Card>
						<CardContent>
							<Box
								sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
							>
								<Timeline />
								<Typography variant="h6">Timeline</Typography>
							</Box>

							<List>
								{stats.entries.map((entry, index) => (
									<React.Fragment key={entry.id}>
										<ListItem>
											<ListItemIcon>
												<Paper
													sx={{
														p: 1,
														bgcolor: "primary.main",
														color: "white",
														borderRadius: 2,
														minWidth: 60,
														textAlign: "center",
													}}
												>
													<Typography variant="caption" fontWeight="bold">
														{formatTime(entry.time)}
													</Typography>
												</Paper>
											</ListItemIcon>
											<ListItemText
												primary={
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 1,
															flexWrap: "wrap",
														}}
													>
														{entry.feedType === "bottle" ? (
															<Chip
																icon={<LocalDrink />}
																label="Bottle"
																size="small"
																color="primary"
															/>
														) : (
															<Chip
																label={`Breast (${entry.startingBreast})`}
																size="small"
																color="secondary"
															/>
														)}
														{entry.temperature && (
															<Chip
																icon={<Thermostat />}
																label={`${entry.temperature}°C`}
																size="small"
																color="warning"
																variant="outlined"
															/>
														)}
														{entry.didPee && (
															<Chip
																icon={<Water />}
																label="Pee"
																size="small"
																color="info"
																variant="outlined"
															/>
														)}
														{entry.didPoo && (
															<Chip
																icon={<Cake />}
																label="Poo"
																size="small"
																sx={{
																	color: "#8D6E63",
																	borderColor: "#8D6E63",
																}}
																variant="outlined"
															/>
														)}
														{entry.didThrowUp && (
															<Chip
																icon={<Warning />}
																label="Throw Up"
																size="small"
																color="error"
																variant="outlined"
															/>
														)}
													</Box>
												}
											/>
										</ListItem>
										{index < stats.entries.length - 1 && <Divider />}
									</React.Fragment>
								))}
							</List>
						</CardContent>
					</Card>
				</Box>
			)}
		</Box>
	);
};

export default OverviewView;
