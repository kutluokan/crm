import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useTicketComments, useAddComment, useEditComment, useDeleteComment, TicketComment } from '../hooks/useTicketComments';
import useAuth from '../hooks/useAuth';

type TicketCommentsProps = {
  ticketId: string;
};

export default function TicketComments({ ticketId }: TicketCommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [editingComment, setEditingComment] = useState<TicketComment | null>(null);
  const [editedComment, setEditedComment] = useState('');
  const [editedIsInternal, setEditedIsInternal] = useState(false);
  const [deleteConfirmComment, setDeleteConfirmComment] = useState<TicketComment | null>(null);

  const { data: comments, isLoading, isError } = useTicketComments(ticketId);
  const addComment = useAddComment();
  const editComment = useEditComment();
  const deleteComment = useDeleteComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user?.id) return;

    try {
      await addComment.mutateAsync({
        ticketId,
        comment: newComment.trim(),
        isInternal,
        userId: user.id,
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleEditClick = (comment: TicketComment) => {
    setEditingComment(comment);
    setEditedComment(comment.comment);
    setEditedIsInternal(comment.is_internal);
  };

  const handleEditSubmit = async () => {
    if (!editingComment || !editedComment.trim()) return;

    try {
      await editComment.mutateAsync({
        id: editingComment.id,
        ticketId,
        comment: editedComment.trim(),
        isInternal: editedIsInternal,
      });
      setEditingComment(null);
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteClick = (comment: TicketComment) => {
    setDeleteConfirmComment(comment);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmComment) return;

    try {
      await deleteComment.mutateAsync({
        id: deleteConfirmComment.id,
        ticketId,
      });
      setDeleteConfirmComment(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={2}>
        <Alert severity="error">Error loading comments. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Comments
      </Typography>

      {/* Comment List */}
      <Stack spacing={2} mb={3}>
        {comments?.map((comment) => (
          <Paper
            key={comment.id}
            sx={{
              p: 2,
              bgcolor: comment.is_internal ? 'grey.100' : 'background.paper',
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {comment.user.full_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </Typography>
                </Stack>
                <Typography variant="body2">{comment.comment}</Typography>
                {comment.is_internal && (
                  <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                    Internal Note
                  </Typography>
                )}
              </Box>
              {user?.id === comment.user_id && (
                <Stack direction="row" spacing={1} ml={2}>
                  <IconButton size="small" onClick={() => handleEditClick(comment)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteClick(comment)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              )}
            </Stack>
          </Paper>
        ))}
        {comments?.length === 0 && (
          <Typography color="text.secondary" align="center">
            No comments yet
          </Typography>
        )}
      </Stack>

      {/* Add Comment Form */}
      <Paper sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  color="warning"
                />
              }
              label="Internal Note"
            />
            <Button
              variant="contained"
              type="submit"
              disabled={!newComment.trim() || addComment.isPending}
            >
              {addComment.isPending ? 'Adding...' : 'Add Comment'}
            </Button>
          </Stack>
        </form>
      </Paper>

      {/* Edit Comment Dialog */}
      <Dialog open={!!editingComment} onClose={() => setEditingComment(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editedComment}
            onChange={(e) => setEditedComment(e.target.value)}
            sx={{ mt: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editedIsInternal}
                onChange={(e) => setEditedIsInternal(e.target.checked)}
                color="warning"
              />
            }
            label="Internal Note"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingComment(null)}>Cancel</Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={!editedComment.trim() || editComment.isPending}
          >
            {editComment.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={!!deleteConfirmComment} 
        onClose={() => setDeleteConfirmComment(null)}
        maxWidth="sm"
      >
        <DialogTitle>Delete Comment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this comment? This action cannot be undone.
          </Typography>
          {deleteConfirmComment && (
            <Paper sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">
                {deleteConfirmComment.comment}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmComment(null)}
            disabled={deleteComment.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteComment.isPending}
          >
            {deleteComment.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 