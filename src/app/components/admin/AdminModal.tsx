import React from 'react';
import { Modal, Box, Button } from '@mui/material';
interface AdminModalProps {
	isOpen: boolean;
	handleClose: () => void;
	children: React.ReactNode;
}

const style = {
	position: 'absolute' as 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 950,
	bgcolor: 'background.paper',
	boxShadow: 24,
	maxHeight: '95vh',
	overflowY: 'auto',
};

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, handleClose, children }) => {
	return (
		<Modal
			open={isOpen}
			onClose={handleClose}
			aria-labelledby="order-details-title"
			aria-describedby="order-details-description"
		>
			<Box sx={style}>
				{/* <Button onClick={handleClose} variant="contained" color="primary">
					Đóng
				</Button> */}
				{children}
			</Box>
		</Modal>
	);
};

export default AdminModal;
