import React, { useState } from "react";
import {
	Card,
	CardContent,
	Typography,
	Box,
	ToggleButton,
	ToggleButtonGroup,
} from "@mui/material";
import { CalendarToday, BarChart } from "@mui/icons-material";
import type { BabyEntry, NewBabyEntry } from "../../interfaces";
import DailyOverview from "./components/daily/DailyOverview";
import OverallOverview from "./components/overall/OverallOverview";

interface OverviewViewProps {
	entries: BabyEntry[];
	onUpdateEntry: (
		entryId: string,
		updatedData: Partial<NewBabyEntry>
	) => Promise<BabyEntry>;
	onDeleteEntry: (entryId: string) => Promise<void>;
	loading?: boolean;
}
const OverviewView: React.FC<OverviewViewProps> = ({
	entries,
	loading = false,
}) => {
	const [viewMode, setViewMode] = useState<"daily" | "overall">("daily");

	const handleViewModeChange = (
		_event: React.MouseEvent<HTMLElement>,
		newMode: "daily" | "overall" | null
	): void => {
		if (newMode !== null) {
			setViewMode(newMode);
		}
	};

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

			{viewMode === "daily" ? (
				<DailyOverview entries={entries} loading={loading} />
			) : (
				<OverallOverview entries={entries} loading={loading} />
			)}
		</Box>
	);
};

export default OverviewView;
