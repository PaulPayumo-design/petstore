import {
  Drawer, Box, Typography, IconButton, Divider, Button,
  List, ListItem, Chip
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import PetsIcon from '@mui/icons-material/Pets'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPeso } from '../utils/currency'

const PLACEHOLDER = '/placeholder-pet.svg'

const categoryColors: Record<string, 'primary' | 'secondary' | 'success' | 'info'> = {
  DOG: 'primary',
  CAT: 'secondary',
  BIRD: 'success',
  FISH: 'info',
}

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, subtotal } = useCart()
  const navigate = useNavigate()

  const handleCheckout = () => {
    onClose()
    navigate('/checkout')
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 380, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box className="flex items-center justify-between px-4 py-3">
          <Typography variant="h6" className="font-bold">Your Cart</Typography>
          <IconButton onClick={onClose} aria-label="Close cart">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />

        {/* Empty state */}
        {items.length === 0 ? (
          <Box className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-400">
            <PetsIcon sx={{ fontSize: 64 }} />
            <Typography variant="body1">Your cart is empty</Typography>
            <Button variant="text" onClick={onClose}>Continue Shopping</Button>
          </Box>
        ) : (
          <>
            {/* Item list */}
            <List sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
              {items.map((item) => (
                <ListItem key={item.id} disableGutters sx={{ py: 1.5, px: 1 }}>
                  <Box className="flex gap-3 w-full">
                    <img
                      src={item.photoUrl || PLACEHOLDER}
                      alt={item.name}
                      style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
                    />
                    <Box className="flex flex-col flex-1 gap-1 min-w-0">
                      <Box className="flex items-center justify-between gap-2">
                        <Typography variant="body2" className="font-semibold truncate">
                          {item.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Chip
                        label={item.category}
                        color={categoryColors[item.category] ?? 'default'}
                        size="small"
                        sx={{ width: 'fit-content' }}
                      />
                      <Box className="flex items-center justify-between">
                        <Typography variant="caption" color="text.secondary">
                          {formatPeso(item.price)} each
                        </Typography>
                        <Box className="flex items-center gap-1">
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= 10}
                            aria-label="Increase quantity"
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>

            {/* Footer */}
            <Divider />
            <Box className="p-4 flex flex-col gap-3">
              <Box className="flex justify-between">
                <Typography variant="subtitle1" className="font-semibold">Subtotal</Typography>
                <Typography variant="subtitle1" className="font-bold text-green-700">
                  {formatPeso(subtotal)}
                </Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
              <Button variant="text" fullWidth onClick={onClose}>
                Continue Shopping
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  )
}
