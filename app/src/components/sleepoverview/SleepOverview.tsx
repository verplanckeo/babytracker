import React, { useState } from "react";
import {
	Card,
	CardContent,
	Typography,
	Box,
	Grid,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Chip,
	Paper,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	IconButton,
	Divider,
	type SelectChangeEvent,
} from "@mui/material";
import {
	Bedtime,
	WbSunny,
	AccessTime,
	Timeline,
	TrendingUp,
	Delete,
	BarChart,
	NightsStay,
} from "@mui/icons-material";
import {
	BarChart as RechartsBarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import type { SleepEntry } from "../../interfaces/sleepentry.interface";
import StatCard from "../overview/components/statcard/StatCard";
import type { SleepStats } from "../../interfaces/sleepstats.interface";

interface SleepOverviewProps {
	sleepEntries: SleepEntry[];
	loading: boolean;
	onDeleteEntry?: (entryId: string) => Promise<void>;
}

const SleepOverview: React.FC<SleepOverviewProps> = ({
	sleepEntries,
	onDeleteEntry,
}) => {
	const getAvailableDates = (): string[] => {
		const dates = [...new Set(sleepEntries.map((entry) => entry.date))];
		return dates.sort().reverse();
	};

	const availableDates = getAvailableDates();
	const [selectedDate, setSelectedDate] = useState<string>(
		availableDates[0] || dayjs().format("YYYY-MM-DD")
	);

	const handleDateChange = (event: SelectChangeEvent<string>): void => {
		setSelectedDate(event.target.value);
	};

	const handleDeleteEntry = async (entryId: string): Promise<void> => {
		if (onDeleteEntry) {
			await onDeleteEntry(entryId);
		}
	};

	const getDateSleepStats = (date: string): SleepStats => {
		const daySleepEntries = sleepEntries.filter((entry) => entry.date === date);
		const completedSleeps = daySleepEntries.filter(
			(entry) => !entry.isActive && entry.duration
		);

		const totalSleepTime = completedSleeps.reduce(
			(sum, entry) => sum + (entry.duration || 0),
			0
		);
		const avgSleepDuration =
			completedSleeps.length > 0
				? Math.round(totalSleepTime / completedSleeps.length)
				: 0;
		const longestSleep =
			completedSleeps.length > 0
				? Math.max(...completedSleeps.map((s) => s.duration || 0))
				: 0;
		const shortestSleep =
			completedSleeps.length > 0
				? Math.min(...completedSleeps.map((s) => s.duration || 0))
				: 0;
		const activeSleep = daySleepEntries.find((entry) => entry.isActive);

		return {
			totalSleepSessions: daySleepEntries.length,
			totalSleepTime,
			avgSleepDuration,
			longestSleep,
			shortestSleep,
			activeSleep,
			sleepSessions: daySleepEntries.sort((a, b) =>
				a.startTime.localeCompare(b.startTime)
			),
		};
	};

	const getOverallSleepStats = (): SleepStats => {
		const completedSleeps = sleepEntries.filter(
			(entry) => !entry.isActive && entry.duration
		);
		const totalSleepTime = completedSleeps.reduce(
			(sum, entry) => sum + (entry.duration || 0),
			0
		);
		const avgSleepDuration =
			completedSleeps.length > 0
				? Math.round(totalSleepTime / completedSleeps.length)
				: 0;
		const longestSleep =
			completedSleeps.length > 0
				? Math.max(...completedSleeps.map((s) => s.duration || 0))
				: 0;
		const shortestSleep =
			completedSleeps.length > 0
				? Math.min(...completedSleeps.map((s) => s.duration || 0))
				: 0;
		const activeSleep = sleepEntries.find((entry) => entry.isActive);

		return {
			totalSleepSessions: sleepEntries.length,
			totalSleepTime,
			avgSleepDuration,
			longestSleep,
			shortestSleep,
			activeSleep,
			sleepSessions: sleepEntries,
		};
	};

	const formatDuration = (minutes: number): string => {
		if (minutes < 60) {
			return `${minutes}m`;
		}
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		return `${hours}h ${remainingMinutes}m`;
	};

	const formatTime = (time: string): string => {
		return dayjs(`2000-01-01T${time}`).format("HH:mm");
	};

	const generateChartData = () => {
		const last7Days = [];
		for (let i = 6; i >= 0; i--) {
			const date = dayjs().subtract(i, "day");
			const dateStr = date.format("YYYY-MM-DD");
			const dayStats = getDateSleepStats(dateStr);

			last7Days.push({
				date: date.format("MMM D"),
				totalSleep: Math.round((dayStats.totalSleepTime / 60) * 10) / 10, // Convert to hours with 1 decimal
				sessions: dayStats.totalSleepSessions,
				avgDuration: Math.round((dayStats.avgSleepDuration / 60) * 10) / 10,
			});
		}
		return last7Days;
	};

	const dailyStats = getDateSleepStats(selectedDate);
	const overallStats = getOverallSleepStats();
	const chartData = generateChartData();

	if (sleepEntries.length === 0) {
		return (
			<Card>
				<CardContent>
					<Box sx={{ textAlign: "center", py: 4 }}>
						<Bedtime sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
						<Typography variant="h6" color="text.secondary" gutterBottom>
							No sleep data yet
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Start tracking sleep sessions to see insights here
						</Typography>
					</Box>
				</CardContent>
			</Card>
		);
	}

	return (
		<Box>
			{/* Overall Stats Cards */}
			<Grid container spacing={3} sx={{ mb: 3 }}>
				<Grid size={{ xs: 6, md: 3 }}>
					<StatCard
						title="Total Sessions"
						value={overallStats.totalSleepSessions}
						icon={NightsStay}
						color="primary"
					/>
				</Grid>
				<Grid size={{ xs: 6, md: 3 }}>
					<StatCard
						title="Total Sleep"
						value={formatDuration(overallStats.totalSleepTime)}
						icon={AccessTime}
						color="info"
					/>
				</Grid>
				<Grid size={{ xs: 6, md: 3 }}>
					<StatCard
						title="Avg Duration"
						value={formatDuration(overallStats.avgSleepDuration)}
						icon={TrendingUp}
						color="primary"
					/>
				</Grid>
				<Grid size={{ xs: 6, md: 3 }}>
					<StatCard
						title="Longest Sleep"
						value={formatDuration(overallStats.longestSleep)}
						icon={Bedtime}
						color="secondary"
					/>
				</Grid>
			</Grid>

			{/* Sleep Chart */}
			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
						<BarChart />
						<Typography variant="h6">Sleep Trends (Last 7 Days)</Typography>
					</Box>

					<ResponsiveContainer width="100%" height={300}>
						<RechartsBarChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="date" />
							<YAxis />
							<Tooltip
								formatter={(value, name) => [
									name === "totalSleep" ? `${value}h` : value,
									name === "totalSleep"
										? "Total Sleep"
										: name === "sessions"
										? "Sessions"
										: "Avg Duration",
								]}
							/>
							<Legend />
							<Bar
								dataKey="totalSleep"
								fill="#2196f3"
								name="Total Sleep (hours)"
							/>
							<Bar dataKey="sessions" fill="#4caf50" name="Sessions" />
						</RechartsBarChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			{/* Daily View */}
			<Card>
				<CardContent>
					<Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
						<Timeline />
						<Typography variant="h6">Daily Sleep Details</Typography>
					</Box>

					<FormControl fullWidth sx={{ mb: 3 }}>
						<InputLabel>Select Date</InputLabel>
						<Select
							value={selectedDate}
							onChange={handleDateChange}
							label="Select Date"
						>
							{availableDates.map((date) => (
								<MenuItem key={date} value={date}>
									{dayjs(date).format("MMMM D, YYYY")}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					{/* Daily Stats Summary */}
					<Grid container spacing={2} sx={{ mb: 3 }}>
						<Grid size={{ xs: 6, md: 3 }}>
							<Paper sx={{ p: 2, textAlign: "center" }}>
								<Typography variant="h4" color="primary">
									{dailyStats.totalSleepSessions}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Sleep Sessions
								</Typography>
							</Paper>
						</Grid>
						<Grid size={{ xs: 6, md: 3 }}>
							<Paper sx={{ p: 2, textAlign: "center" }}>
								<Typography variant="h4" color="info.main">
									{formatDuration(dailyStats.totalSleepTime)}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Total Sleep
								</Typography>
							</Paper>
						</Grid>
						<Grid size={{ xs: 6, md: 3 }}>
							<Paper sx={{ p: 2, textAlign: "center" }}>
								<Typography variant="h4" color="success.main">
									{formatDuration(dailyStats.avgSleepDuration)}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Average Duration
								</Typography>
							</Paper>
						</Grid>
						<Grid size={{ xs: 6, md: 3 }}>
							<Paper sx={{ p: 2, textAlign: "center" }}>
								<Typography variant="h4" color="secondary.main">
									{formatDuration(dailyStats.longestSleep)}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Longest Sleep
								</Typography>
							</Paper>
						</Grid>
					</Grid>

					{/* Sleep Sessions Timeline */}
					{dailyStats.sleepSessions.length > 0 ? (
						<List>
							{dailyStats.sleepSessions.map((entry, index) => (
								<React.Fragment key={entry.id}>
									<ListItem>
										<ListItemIcon>
											<Paper
												sx={{
													p: 1,
													bgcolor: entry.isActive
														? "primary.main"
														: "success.main",
													color: "white",
													borderRadius: 2,
													minWidth: 60,
													textAlign: "center",
													mr: 2,
												}}
											>
												<Typography variant="caption" fontWeight="bold">
													{formatTime(entry.startTime)}
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
													{entry.isActive ? (
														<>
															<Chip
																icon={<Bedtime />}
																label="Currently Sleeping"
																color="primary"
																size="small"
															/>
															<Chip
																icon={<AccessTime />}
																label={`Started at ${formatTime(
																	entry.startTime
																)}`}
																variant="outlined"
																size="small"
															/>
														</>
													) : (
														<>
															<Chip
																icon={<WbSunny />}
																label={`${formatTime(
																	entry.startTime
																)} - ${formatTime(entry.endTime || "")}`}
																color="success"
																size="small"
															/>
															{entry.duration && (
																<Chip
																	icon={<AccessTime />}
																	label={formatDuration(entry.duration)}
																	variant="outlined"
																	size="small"
																/>
															)}
														</>
													)}
												</Box>
											}
											secondary={
												entry.comment && (
													<Typography variant="body2" sx={{ mt: 1 }}>
														💭 {entry.comment}
													</Typography>
												)
											}
										/>
										{onDeleteEntry && !entry.isActive && (
											<IconButton
												edge="end"
												onClick={() => handleDeleteEntry(entry.id)}
												size="small"
												color="error"
											>
												<Delete />
											</IconButton>
										)}
									</ListItem>
									{index < dailyStats.sleepSessions.length - 1 && <Divider />}
								</React.Fragment>
							))}
						</List>
					) : (
						<Box sx={{ textAlign: "center", py: 4 }}>
							<WbSunny sx={{ fontSize: 40, color: "text.secondary", mb: 2 }} />
							<Typography variant="body1" color="text.secondary">
								No sleep sessions on this date
							</Typography>
						</Box>
					)}
				</CardContent>
			</Card>
		</Box>
	);
};

export default SleepOverview;
