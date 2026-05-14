import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, Button, Container, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  Switch, FormControlLabel, Snackbar, Alert, CircularProgress,
  Skeleton, Radio, RadioGroup, Tooltip,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { getPets, PetSummary } from '../api/petsApi'
import { createPet, updatePet, deletePet, CreatePetPayload } from '../api/adminApi'
import { formatPeso } from '../utils/currency'

const CATEGORIES = ['DOG', 'CAT', 'BIRD', 'FISH'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_COLORS: Record<Category, 'warning' | 'info' | 'success' | 'primary'> = {
  DOG: 'warning',
  CAT: 'info',
  BIRD: 'success',
  FISH: 'primary',
}

interface PhotoRow {
  url: string
  isPrimary: boolean
}

const emptyForm = (): CreatePetPayload => ({
  name: '',
  category: 'DOG',
  breed: '',
  ageMonths: 0,
  description: '',
  price: null,
  available: true,
  photos: [],
})

export default function AdminPage() {
  const navigate = useNavigate()

  const [pets, setPets] = useState<PetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreatePetPayload>(emptyForm())
  const [photos, setPhotos] = useState<PhotoRow[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingPet, setDeletingPet] = useState<PetSummary | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  const fetchPets = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const page = await getPets([], 0, 50)
      setPets(page.content)
    } catch {
      setFetchError('Failed to load pets.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount
  useState(() => { fetchPets() })

  const openAddDialog = () => {
    setEditingId(null)
    setForm(emptyForm())
    setPhotos([])
    setSaveError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (pet: PetSummary) => {
    setEditingId(pet.id)
    setForm({
      name: pet.name,
      category: pet.category,
      breed: pet.breed,
      ageMonths: pet.ageMonths,
      description: '',
      price: pet.price,
      available: pet.available,
      photos: [],
    })
    // Pre-fill primary photo if available
    setPhotos(pet.primaryPhotoUrl ? [{ url: pet.primaryPhotoUrl, isPrimary: true }] : [])
    setSaveError(null)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSaveError(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const payload: CreatePetPayload = { ...form, photos }
      if (editingId) {
        await updatePet(editingId, payload)
      } else {
        await createPet(payload)
      }
      setDialogOpen(false)
      setSnackbar({ open: true, message: 'Pet saved successfully!' })
      fetchPets()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to save pet.'
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  const openDeleteDialog = (pet: PetSummary) => {
    setDeletingPet(pet)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingPet) return
    setDeleting(true)
    try {
      await deletePet(deletingPet.id)
      setDeleteDialogOpen(false)
      setDeletingPet(null)
      setSnackbar({ open: true, message: 'Pet deleted.' })
      fetchPets()
    } catch {
      // keep dialog open, user can retry
    } finally {
      setDeleting(false)
    }
  }

  const addPhotoRow = () => setPhotos((prev) => [...prev, { url: '', isPrimary: prev.length === 0 }])

  const updatePhotoUrl = (index: number, url: string) => {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, url } : p)))
  }

  const setPrimaryPhoto = (index: number) => {
    setPhotos((prev) => prev.map((p, i) => ({ ...p, isPrimary: i === index })))
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length > 0 && !next.some((p) => p.isPrimary)) {
        next[0].isPrimary = true
      }
      return next
    })
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            🐾 Petstore Admin
          </Typography>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
          >
            Back to Store
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Manage Pets</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            Add New Pet
          </Button>
        </Box>

        {fetchError && <Alert severity="error" sx={{ mb: 2 }}>{fetchError}</Alert>}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Photo</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Breed</TableCell>
                <TableCell>Age (mo)</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Available</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
                : pets.map((pet) => (
                  <TableRow key={pet.id} hover>
                    <TableCell>
                      {pet.primaryPhotoUrl
                        ? <img src={pet.primaryPhotoUrl} alt={pet.name} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} />
                        : <Box width={48} height={48} bgcolor="grey.200" borderRadius={1} />}
                    </TableCell>
                    <TableCell>{pet.name}</TableCell>
                    <TableCell>
                      <Chip label={pet.category} color={CATEGORY_COLORS[pet.category as Category] ?? 'default'} size="small" />
                    </TableCell>
                    <TableCell>{pet.breed}</TableCell>
                    <TableCell>{pet.ageMonths}</TableCell>
                    <TableCell>{pet.price != null ? formatPeso(pet.price) : '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={pet.available ? 'Yes' : 'No'}
                        color={pet.available ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton onClick={() => openEditDialog(pet)} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => openDeleteDialog(pet)} size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? 'Edit Pet' : 'Add New Pet'}</DialogTitle>
        <DialogContent dividers>
          {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <TextField
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <FormControl required>
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
              >
                {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label="Breed"
              required
              value={form.breed}
              onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))}
            />
            <TextField
              label="Age in Months"
              type="number"
              required
              inputProps={{ min: 0 }}
              value={form.ageMonths}
              onChange={(e) => setForm((f) => ({ ...f, ageMonths: Number(e.target.value) }))}
            />
            <TextField
              label="Price"
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              value={form.price ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value === '' ? null : Number(e.target.value) }))}
              helperText="Leave empty for 'contact us'"
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              label="Description"
              required
              multiline
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              sx={{ gridColumn: '1 / -1' }}
            />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.available}
                    onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))}
                  />
                }
                label="Available"
              />
            </Box>
          </Box>

          {/* Photos section */}
          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>Photos</Typography>
            <RadioGroup value={photos.findIndex((p) => p.isPrimary).toString()}>
              {photos.map((photo, index) => (
                <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                  <Tooltip title="Set as primary">
                    <Radio
                      value={index.toString()}
                      checked={photo.isPrimary}
                      onChange={() => setPrimaryPhoto(index)}
                      size="small"
                    />
                  </Tooltip>
                  <TextField
                    label={`Photo URL ${index + 1}`}
                    value={photo.url}
                    onChange={(e) => updatePhotoUrl(index, e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <IconButton onClick={() => removePhoto(index)} size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </RadioGroup>
            <Button size="small" startIcon={<AddIcon />} onClick={addPhotoRow}>
              Add Photo
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Pet</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deletingPet?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : undefined}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}
