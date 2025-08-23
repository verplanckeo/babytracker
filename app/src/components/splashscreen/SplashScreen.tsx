import React from "react";
import { CircularProgress, Box, Typography } from "@mui/material";

const SplashScreen: React.FC<{ message?: string }> = ({
	message = "Loading, please wait...",
}) => {
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100vh",
				backgroundColor: "#f5f5f5",
			}}
		>
			<CircularProgress size={60} color="primary" />
			<Typography variant="h5" sx={{ marginTop: 2 }}>
				{message}
			</Typography>
		</Box>
	);
};

export default SplashScreen;
