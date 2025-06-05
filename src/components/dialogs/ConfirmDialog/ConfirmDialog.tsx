import React, { ReactNode } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	description?: ReactNode;
	cancelText?: string;
	okText?: string;
	handleClose: () => void;
	handleConfirm: () => void;
	disabled?: boolean;
}

function ConfirmDialog({
	open,
	title,
	description,
	cancelText,
	okText,
	handleClose,
	handleConfirm,
	disabled = false
}: ConfirmDialogProps) {
	const handleDialogClose = (_event: any, reason: string) => {
		if (reason && reason === 'backdropClick') return;

		handleClose();
	};

	return (
		<Dialog
			open={open}
			onClose={handleDialogClose}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<DialogTitle id="alert-dialog-title">{title}</DialogTitle>
			{description && (
				<DialogContent>
					{typeof description === 'string' ? (
						<DialogContentText id="alert-dialog-description">{description}</DialogContentText>
					) : (
						<div id="alert-dialog-description">{description}</div>
					)}
				</DialogContent>
			)}
			<DialogActions>
				<Button onClick={handleClose}>{cancelText || 'Cancel'}</Button>
				<Button
					onClick={handleConfirm}
					color="secondary"
					autoFocus
					disabled={disabled}
				>
					{okText || 'Ok'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default ConfirmDialog;
