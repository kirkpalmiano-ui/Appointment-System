import { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import UserAvatar from '../ui/UserAvatar';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { AVATAR_TYPES, checkAvatarFile, removeAvatar, uploadAvatar } from '../../utils/avatarUpload';
import { getErrorMessage } from '../../utils/errors';

// The admin's own profile photo with a camera button: upload, change or remove.
// Photos are stored on Cloudinary by the backend (PUT/DELETE /users/me/avatar).
export default function AvatarEditor({ size = 84, sx, avatarSx }) {
  const { user, updateUser } = useAuth();
  const showToast = useToast();
  const inputRef = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [busy, setBusy] = useState(false);
  const hasPhoto = Boolean(user.avatarUrl);

  const run = async (action, message) => {
    setBusy(true);
    try {
      updateUser(await action());
      showToast(message);
    } catch (err) {
      showToast(err.response || err.request ? getErrorMessage(err) : err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = checkAvatarFile(file);
    if (problem) return showToast(problem, 'error');
    run(() => uploadAvatar(file), 'Profile photo updated.');
  };

  const pick = () => {
    setMenuAnchor(null);
    inputRef.current?.click();
  };

  return (
    <Box sx={[{ position: 'relative', width: size, height: size, flex: 'none' }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <UserAvatar id={user._id} name={user.name} src={user.avatarUrl} size={size} sx={avatarSx} />

      {busy && (
        <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'rgba(15, 23, 42, 0.45)' }}>
          <CircularProgress size={Math.round(size * 0.3)} sx={{ color: '#fff' }} aria-label="Saving photo" />
        </Box>
      )}

      <IconButton
        aria-label={hasPhoto ? 'Change or remove profile photo' : 'Add a profile photo'}
        aria-haspopup={hasPhoto ? 'menu' : undefined}
        disabled={busy}
        onClick={(e) => (hasPhoto ? setMenuAnchor(e.currentTarget) : pick())}
        sx={(theme) => ({
          position: 'absolute',
          right: -2,
          bottom: -2,
          width: 32,
          height: 32,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          border: `3px solid ${theme.vars.palette.background.paper}`,
          '&:hover': { bgcolor: 'primary.dark' },
          '& .MuiSvgIcon-root': { fontSize: 16 },
        })}
      >
        <CameraAltRoundedIcon />
      </IconButton>

      <input ref={inputRef} type="file" accept={AVATAR_TYPES.join(',')} hidden onChange={onFile} />

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={pick}>
          <ListItemIcon>
            <PhotoLibraryOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Change photo
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            run(removeAvatar, 'Profile photo removed.');
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteOutlineRoundedIcon fontSize="small" color="error" />
          </ListItemIcon>
          Remove photo
        </MenuItem>
      </Menu>
    </Box>
  );
}
