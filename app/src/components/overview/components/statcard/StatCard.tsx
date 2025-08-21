import { Card, CardContent, Typography } from "@mui/material";

interface StatCardProps {
	title: string;
	value: number | string;
	subtitle?: string;
	color?: "primary" | "info" | "warning" | "error" | "secondary";
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: React.ComponentType<{ sx?: any }>;
}

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

export default StatCard;
