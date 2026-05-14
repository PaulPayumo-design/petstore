import {
  Container, Box, Typography, Chip, Button, Breadcrumbs, Link,
  CircularProgress, Divider, AppBar, Toolbar, Grid, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch, Alert
} from '@mui/material'
import { useNavigate, useParams, Link as RouterLink, useSearchParams } from 'react-router-dom'
import { usePetDetail } from '../hooks/usePetDetail'
import ErrorState from '../components/ErrorState'
import CartButton from '../components/CartButton'
import CartDrawer from '../components/CartDrawer'
import { useCart } from '../context/CartContext'
import { useState } from 'react'
import { CreatePetPayload, deletePet, updatePet } from '../api/adminApi'
import { formatOptionalPeso } from '../utils/currency'
import { useQueryClient } from '@tanstack/react-query'

const PLACEHOLDER = '/placeholder-pet.svg'

const categoryEmoji: Record<string, string> = {
  DOG: '🐶',
  CAT: '🐱',
  BIRD: '🐦',
  FISH: '🐟',
}

const CATEGORIES = ['DOG', 'CAT', 'BIRD', 'FISH'] as const

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const { data: pet, isLoading, isError, error } = usePetDetail(id ?? '')
  const [activePhoto, setActivePhoto] = useState<string | null>(null)
  const [snackOpen, setSnackOpen] = useState(false)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const { addItem } = useCart()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CreatePetPayload | null>(null)

  const catalogueLink = `/?${searchParams.toString()}`

  if (isLoading) {
    return (
      <>
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <Typography variant="h6" className="font-bold tracking-wide">🐾 Petstore</Typography>
            <CartButton />
          </Toolbar>
        </AppBar>
        <Box className="flex justify-center items-center min-h-[60vh]">
          <CircularProgress size={56} />
        </Box>
      </>
    )
  }

  if (isError || !pet) {
    return (
      <>
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <Typography variant="h6" className="font-bold tracking-wide">🐾 Petstore</Typography>
            <CartButton />
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" className="py-16">
          <ErrorState
            message={(error as Error)?.message ?? 'Pet not found.'}
            onRetry={() => navigate(-1)}
          />
        </Container>
      </>
    )
  }

  const primaryPhoto = pet.photos.find((p) => p.isPrimary)?.url ?? pet.primaryPhotoUrl ?? PLACEHOLDER
  const displayPhoto = activePhoto ?? primaryPhoto
  const formattedPrice = formatOptionalPeso(pet.price)

  const openEditDialog = () => {
    setActionError(null)
    setEditForm({
      name: pet.name,
      category: pet.category,
      breed: pet.breed,
      ageMonths: pet.ageMonths,
      description: pet.description,
      price: pet.price,
      available: pet.available,
      photos: pet.photos,
    })
    setEditOpen(true)
  }

  const handleEditSave = async () => {
    if (!editForm) {
      return
    }

    setSubmitting(true)
    setActionError(null)

    try {
      await updatePet(pet.id, editForm)
      await queryClient.invalidateQueries({ queryKey: ['pet', pet.id] })
      await queryClient.invalidateQueries({ queryKey: ['pets'] })
      setEditOpen(false)
    } catch {
      setActionError('Failed to save changes. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    setActionError(null)

    try {
      await deletePet(pet.id)
      await queryClient.invalidateQueries({ queryKey: ['pets'] })
      navigate('/')
    } catch {
      setActionError('Failed to delete this pet. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <Typography variant="h6" className="font-bold tracking-wide">🐾 Petstore</Typography>
          <CartButton />
        </Toolbar>
      </AppBar>
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
      <Container maxWidth="lg" className="py-8">
        <Breadcrumbs className="mb-6">
          <Link component={RouterLink} to={catalogueLink} underline="hover" color="inherit">
            Catalogue
          </Link>
          <Typography color="text.primary">{pet.name}</Typography>
        </Breadcrumbs>

        <Grid container spacing={4}>
          {/* Image column */}
          <Grid item xs={12} md={6}>
            <img
              src={displayPhoto}
              alt={pet.name}
              className="w-full rounded-xl object-cover shadow-md"
              style={{ maxHeight: 480 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
            />
            {pet.photos.length > 1 && (
              <Box className="flex gap-2 mt-3 flex-wrap">
                {pet.photos.map((photo, i) => (
                  <img
                    key={i}
                    src={photo.url}
                    alt={`${pet.name} photo ${i + 1}`}
                    onClick={() => setActivePhoto(photo.url)}
                    className="w-16 h-16 rounded-lg object-cover cursor-pointer border-2 hover:border-blue-500 transition-colors"
                    style={{ borderColor: displayPhoto === photo.url ? '#1976d2' : 'transparent' }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
                  />
                ))}
              </Box>
            )}
          </Grid>

          {/* Details column */}
          <Grid item xs={12} md={6}>
            <Box className="flex flex-col gap-4">
              <Box className="flex items-center gap-3">
                <Typography variant="h4" component="h1" className="font-bold">
                  {pet.name}
                </Typography>
                <Chip
                  label={`${categoryEmoji[pet.category]} ${pet.category}`}
                  color="primary"
                  size="medium"
                />
              </Box>

              <Box className="flex gap-4 flex-wrap">
                <Typography variant="body1" color="text.secondary">
                  <strong>Breed:</strong> {pet.breed}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  <strong>Age:</strong> {pet.ageMonths < 12
                    ? `${pet.ageMonths} month${pet.ageMonths !== 1 ? 's' : ''}`
                    : `${Math.floor(pet.ageMonths / 12)} yr ${pet.ageMonths % 12} mo`}
                </Typography>
              </Box>

              <Divider />

              <Typography variant="body1" className="leading-relaxed">
                {pet.description}
              </Typography>

              <Divider />

              <Box className="flex items-center justify-between">
                {formattedPrice ? (
                  <Typography variant="h5" className="font-bold text-green-700">
                    {formattedPrice}
                  </Typography>
                ) : (
                  <Typography variant="h6" color="text.secondary">
                    Contact us for pricing
                  </Typography>
                )}
                <Chip
                  label={pet.available ? '✅ Available' : '❌ Unavailable'}
                  color={pet.available ? 'success' : 'error'}
                  variant="outlined"
                />
              </Box>

              <Button
                variant="contained"
                size="large"
                disabled={!pet.available}
                fullWidth
                className="mt-2"
                onClick={() => { addItem(pet); setSnackOpen(true) }}
                aria-label={pet.available ? `Add ${pet.name} to cart` : `${pet.name} is currently unavailable`}
              >
                {pet.available ? '🛒 Add to Cart' : 'Currently Unavailable'}
              </Button>

              <Box className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button variant="outlined" onClick={openEditDialog}>
                  Edit Details
                </Button>
                <Button color="error" variant="outlined" onClick={() => { setActionError(null); setDeleteOpen(true) }}>
                  Delete Pet
                </Button>
              </Box>

              <Button variant="outlined" component={RouterLink} to={catalogueLink}>
                ← Back to Catalogue
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>
      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        message={`Added ${pet.name} to cart!`}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <Dialog open={editOpen} onClose={() => !submitting && setEditOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Edit Pet Details</DialogTitle>
        <DialogContent dividers>
          {actionError && <Alert severity="error" className="mb-3">{actionError}</Alert>}
          {editForm && (
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
              <TextField
                label="Name"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
              />
              <FormControl>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={editForm.category}
                  onChange={(e) => setEditForm((prev) => (prev ? { ...prev, category: e.target.value as CreatePetPayload['category'] } : prev))}
                >
                  {CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Breed"
                value={editForm.breed}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, breed: e.target.value } : prev))}
              />
              <TextField
                label="Age in Months"
                type="number"
                inputProps={{ min: 0 }}
                value={editForm.ageMonths}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, ageMonths: Number(e.target.value) } : prev))}
              />
              <TextField
                label="Price (PHP)"
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                value={editForm.price ?? ''}
                onChange={(e) => {
                  const nextPrice = e.target.value === '' ? null : Number(e.target.value)
                  setEditForm((prev) => (prev ? { ...prev, price: nextPrice } : prev))
                }}
                sx={{ gridColumn: '1 / -1' }}
              />
              <TextField
                label="Description"
                multiline
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                sx={{ gridColumn: '1 / -1' }}
              />
              <Box sx={{ gridColumn: '1 / -1' }}>
                <FormControlLabel
                  control={(
                    <Switch
                      checked={editForm.available}
                      onChange={(e) => setEditForm((prev) => (prev ? { ...prev, available: e.target.checked } : prev))}
                    />
                  )}
                  label="Available"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={submitting}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => !submitting && setDeleteOpen(false)}>
        <DialogTitle>Delete Pet</DialogTitle>
        <DialogContent>
          {actionError && <Alert severity="error" className="mb-3">{actionError}</Alert>}
          <Typography>
            Are you sure you want to delete <strong>{pet.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={submitting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={submitting}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
