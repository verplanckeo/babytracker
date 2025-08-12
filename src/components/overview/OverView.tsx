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
	ToggleButton,
	ToggleButtonGroup,
	Accordion,
	AccordionSummary,
	AccordionDetails,
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
	ExpandMore,
	CalendarToday,
	BarChart,
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
	value: number | string;
	subtitle?: string;
	color?: "primary" | "info" | "warning" | "error" | "secondary";
	icon: React.ComponentType<{ sx?: any }>;
}

interface OverallStats {
	totalDays: number;
	totalFeedings: number;
	avgFeedingsPerDay: number;
	bottleFeeds: number;
	breastFeeds: number;
	leftBreastFeeds: number;
	rightBreastFeeds: number;
	totalPees: number;
	totalPoos: number;
	totalThrowUps: number;
	avgPeesPerDay: number;
	avgPoosPerDay: number;
	avgThrowUpsPerDay: number;
	avgTemperature: string | null;
	dailyBreakdown: { date: string; stats: DayStats }[];
}

const OverviewView: React.FC<OverviewViewProps> = ({
	entries,
	loading = false,
}) => {
	const [viewMode, setViewMode] = useState<"daily" | "overall">("daily");

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

	const getOverallStats = (): OverallStats => {
		const availableDates = getAvailableDates();
		const dailyBreakdown = availableDates.map((date) => ({
			date,
			stats: getDateStats(date),
		}));

		const totalDays = availableDates.length;
		const totalFeedings = entries.length;
		const bottleFeeds = entries.filter((e) => e.feedType === "bottle").length;
		const breastFeeds = entries.filter((e) => e.feedType === "breast").length;
		const leftBreastFeeds = entries.filter(
			(e) => e.feedType === "breast" && e.startingBreast === "left"
		).length;
		const rightBreastFeeds = entries.filter(
			(e) => e.feedType === "breast" && e.startingBreast === "right"
		).length;
		const totalPees = entries.filter((e) => e.didPee).length;
		const totalPoos = entries.filter((e) => e.didPoo).length;
		const totalThrowUps = entries.filter((e) => e.didThrowUp).length;

		const temperaturesEntries = entries.filter((e) => e.temperature);
		const avgTemperature =
			temperaturesEntries.length > 0
				? (
						temperaturesEntries.reduce(
							(sum, e) => sum + (e.temperature || 0),
							0
						) / temperaturesEntries.length
				  ).toFixed(1)
				: null;

		return {
			totalDays,
			totalFeedings,
			avgFeedingsPerDay:
				totalDays > 0 ? Math.round((totalFeedings / totalDays) * 10) / 10 : 0,
			bottleFeeds,
			breastFeeds,
			leftBreastFeeds,
			rightBreastFeeds,
			totalPees,
			totalPoos,
			totalThrowUps,
			avgPeesPerDay:
				totalDays > 0 ? Math.round((totalPees / totalDays) * 10) / 10 : 0,
			avgPoosPerDay:
				totalDays > 0 ? Math.round((totalPoos / totalDays) * 10) / 10 : 0,
			avgThrowUpsPerDay:
				totalDays > 0 ? Math.round((totalThrowUps / totalDays) * 10) / 10 : 0,
			avgTemperature,
			dailyBreakdown,
		};
	};

	const availableDates = getAvailableDates();
	const dailyStats = getDateStats(selectedDate);
	const overallStats = getOverallStats();

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

	const handleViewModeChange = (
		_event: React.MouseEvent<HTMLElement>,
		newMode: "daily" | "overall" | null
	): void => {
		if (newMode !== null) {
			setViewMode(newMode);
		}
	};

	const renderDailyView = () => (
		<Box>
			<FormControl fullWidth sx={{ mb: 3 }}>
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

			{dailyStats.totalFeedings === 0 ? (
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
								value={dailyStats.totalFeedings}
								subtitle={`${dailyStats.bottleFeeds} bottle, ${dailyStats.breastFeeds} breast`}
								color="primary"
								icon={LocalDrink}
							/>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<StatCard
								title="Pees"
								value={dailyStats.totalPees}
								color="info"
								icon={Water}
							/>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<StatCard
								title="Poos"
								value={dailyStats.totalPoos}
								color="warning"
								icon={Cake}
							/>
						</Grid>
						<Grid size={{ xs: 6, sm: 3 }}>
							<StatCard
								title="Throw Ups"
								value={dailyStats.totalThrowUps}
								color="error"
								icon={Warning}
							/>
						</Grid>
					</Grid>

					{/* Additional Info */}
					<Grid container spacing={2} sx={{ mb: 3 }}>
						{dailyStats.breastFeeds > 0 && (
							<Grid size={{ xs: 12, sm: 6 }}>
								<Card>
									<CardContent>
										<Typography variant="h6" gutterBottom color="secondary">
											Breast Feeding
										</Typography>
										<Box sx={{ display: "flex", gap: 1 }}>
											<Chip
												label={`Left: ${dailyStats.leftBreastFeeds}`}
												color="secondary"
												variant="outlined"
											/>
											<Chip
												label={`Right: ${dailyStats.rightBreastFeeds}`}
												color="secondary"
												variant="outlined"
											/>
										</Box>
									</CardContent>
								</Card>
							</Grid>
						)}
						{dailyStats.avgTemperature && (
							<Grid size={{ xs: 12, sm: 6 }}>
								<Card>
									<CardContent>
										<Typography variant="h6" gutterBottom>
											Average Temperature
										</Typography>
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											<Thermostat color="warning" />
											<Typography variant="h5" color="warning.main">
												{dailyStats.avgTemperature}°C
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
								{dailyStats.entries.map((entry, index) => (
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
														mr: 2,
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
										{index < dailyStats.entries.length - 1 && <Divider />}
									</React.Fragment>
								))}
							</List>
						</CardContent>
					</Card>
				</Box>
			)}
		</Box>
	);

	const renderOverallView = () => (
		<Box>
			{/* Overall Stats Grid */}
			<Grid container spacing={2} sx={{ mb: 3 }}>
				<Grid size={{ xs: 6, sm: 3 }}>
					<StatCard
						title="Total Days"
						value={overallStats.totalDays}
						color="secondary"
						icon={CalendarToday}
					/>
				</Grid>
				<Grid size={{ xs: 6, sm: 3 }}>
					<StatCard
						title="Total Feeds"
						value={overallStats.totalFeedings}
						subtitle={`Avg: ${overallStats.avgFeedingsPerDay} per day`}
						color="primary"
						icon={LocalDrink}
					/>
				</Grid>
				<Grid size={{ xs: 6, sm: 3 }}>
					<StatCard
						title="Total Pees"
						value={overallStats.totalPees}
						subtitle={`Avg: ${overallStats.avgPeesPerDay} per day`}
						color="info"
						icon={Water}
					/>
				</Grid>
				<Grid size={{ xs: 6, sm: 3 }}>
					<StatCard
						title="Total Poos"
						value={overallStats.totalPoos}
						subtitle={`Avg: ${overallStats.avgPoosPerDay} per day`}
						color="warning"
						icon={Cake}
					/>
				</Grid>
			</Grid>

			{/* Additional Overall Stats */}
			<Grid container spacing={2} sx={{ mb: 3 }}>
				<Grid size={{ xs: 12, sm: 4 }}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom color="primary">
								Feeding Breakdown
							</Typography>
							<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
								<Chip
									label={`Bottle: ${overallStats.bottleFeeds}`}
									color="primary"
									variant="outlined"
								/>
								<Chip
									label={`Breast: ${overallStats.breastFeeds}`}
									color="secondary"
									variant="outlined"
								/>
							</Box>
						</CardContent>
					</Card>
				</Grid>

				{overallStats.breastFeeds > 0 && (
					<Grid size={{ xs: 12, sm: 4 }}>
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom color="secondary">
									Breast Preference
								</Typography>
								<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
									<Chip
										label={`Left: ${overallStats.leftBreastFeeds}`}
										color="secondary"
										variant="outlined"
									/>
									<Chip
										label={`Right: ${overallStats.rightBreastFeeds}`}
										color="secondary"
										variant="outlined"
									/>
								</Box>
							</CardContent>
						</Card>
					</Grid>
				)}

				<Grid size={{ xs: 12, sm: 4 }}>
					<StatCard
						title="Throw Ups"
						value={overallStats.totalThrowUps}
						subtitle={`Avg: ${overallStats.avgThrowUpsPerDay} per day`}
						color="error"
						icon={Warning}
					/>
				</Grid>
			</Grid>

			{overallStats.avgTemperature && (
				<Card sx={{ mb: 3 }}>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							Average Temperature (Overall)
						</Typography>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Thermostat color="warning" />
							<Typography variant="h5" color="warning.main">
								{overallStats.avgTemperature}°C
							</Typography>
						</Box>
					</CardContent>
				</Card>
			)}

			{/* Daily Breakdown Accordion */}
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						Daily Breakdown
					</Typography>
					{overallStats.dailyBreakdown.map(({ date, stats }) => (
						<Accordion key={date}>
							<AccordionSummary expandIcon={<ExpandMore />}>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 2,
										width: "100%",
									}}
								>
									<Typography variant="subtitle1" fontWeight="bold">
										{dayjs(date).format("MMMM D, YYYY")}
									</Typography>
									<Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
										<Chip
											label={`${stats.totalFeedings} feeds`}
											size="small"
											color="primary"
											variant="outlined"
										/>
										<Chip
											label={`${stats.totalPees} pees`}
											size="small"
											color="info"
											variant="outlined"
										/>
										<Chip
											label={`${stats.totalPoos} poos`}
											size="small"
											color="warning"
											variant="outlined"
										/>
									</Box>
								</Box>
							</AccordionSummary>
							<AccordionDetails>
								<Grid container spacing={2}>
									<Grid size={{ xs: 6, sm: 2 }}>
										<Typography variant="body2" color="text.secondary">
											Feeds
										</Typography>
										<Typography variant="h6">{stats.totalFeedings}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 2 }}>
										<Typography variant="body2" color="text.secondary">
											Bottle
										</Typography>
										<Typography variant="h6">{stats.bottleFeeds}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 2 }}>
										<Typography variant="body2" color="text.secondary">
											Breast
										</Typography>
										<Typography variant="h6">{stats.breastFeeds}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 2 }}>
										<Typography variant="body2" color="text.secondary">
											Pees
										</Typography>
										<Typography variant="h6">{stats.totalPees}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 2 }}>
										<Typography variant="body2" color="text.secondary">
											Poos
										</Typography>
										<Typography variant="h6">{stats.totalPoos}</Typography>
									</Grid>
									<Grid size={{ xs: 6, sm: 2 }}>
										<Typography variant="body2" color="text.secondary">
											Throw Ups
										</Typography>
										<Typography variant="h6">{stats.totalThrowUps}</Typography>
									</Grid>
								</Grid>
								{stats.avgTemperature && (
									<Box sx={{ mt: 2 }}>
										<Typography variant="body2" color="text.secondary">
											Average Temperature: {stats.avgTemperature}°C
										</Typography>
									</Box>
								)}
							</AccordionDetails>
						</Accordion>
					))}
				</CardContent>
			</Card>
		</Box>
	);

	if (entries.length === 0) {
		return (
			<Card>
				<CardContent>
					<Typography
						variant="h6"
						color="text.secondary"
						textAlign="center"
						py={4}
					>
						No entries yet
					</Typography>
				</CardContent>
			</Card>
		);
	}

	return (
		<Box>
			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
						<Assessment color="secondary" />
						<Typography variant="h5" component="h2">
							Baby Overview
						</Typography>
					</Box>

					<ToggleButtonGroup
						value={viewMode}
						exclusive
						onChange={handleViewModeChange}
						aria-label="view mode"
						fullWidth
						sx={{ mb: 2 }}
					>
						<ToggleButton value="daily" aria-label="daily view">
							<CalendarToday sx={{ mr: 1 }} />
							Daily View
						</ToggleButton>
						<ToggleButton value="overall" aria-label="overall view">
							<BarChart sx={{ mr: 1 }} />
							Overall View
						</ToggleButton>
					</ToggleButtonGroup>
				</CardContent>
			</Card>

			{viewMode === "daily" ? renderDailyView() : renderOverallView()}
		</Box>
	);
};

export default OverviewView;
