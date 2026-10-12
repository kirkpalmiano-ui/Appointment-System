import { useRef, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { AVATAR_TYPES, checkAvatarFile, removeAvatar, uploadAvatar } from '../../utils/avatar';
import { getErrorMessage } from '../../utils/errors';
import { initials } from '../../utils/format';

// Profile photo with a camera button: upload, change or remove (stored on Cloudinary).
// `size` is the avatar's width/height; `avatarSx` styles the avatar itself, `sx` its wrapper.
export default function AvatarEditor({ size = 112, avatarSx, sx }) {
  const { user, updateUser } = useAuth();
  const showToast = useToast();
  const inputRef = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [busy, setBusy] = useState(false);
  const hasPhoto = Boolean(user.avatarUrl);
  const buttonSize = Math.max(32, Math.round(size * 0.32));

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
    e.target.value = ''; // so picking the same file again still triggers a change
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
      <Avatar src={user.avatarUrl || undefined} alt={hasPhoto ? `${user.name}'s profile photo` : undefined} sx={[{ width: size, height: size }, ...(Array.isArray(avatarSx) ? avatarSx : [avatarSx])]}>
        {initials(user.name)}
      </Avatar>

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
          right: size > 90 ? 4 : 0,
          bottom: size > 90 ? 4 : 0,
          width: buttonSize,
          height: buttonSize,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          border: `3px solid ${theme.vars.palette.background.default}`,
          '&:hover': { bgcolor: 'primary.dark' },
          '& .MuiSvgIcon-root': { fontSize: Math.round(buttonSize * 0.5) },
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
