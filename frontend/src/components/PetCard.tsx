import { Card, CardMedia, CardContent, Typography, Chip, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { PetSummary } from '../api/petsApi'
import { useCart } from '../context/CartContext'
import { formatPeso } from '../utils/currency'

interface PetCardProps {
  pet: PetSummary
}

const PLACEHOLDER = '/placeholder-pet.svg'

const categoryEmoji: Record<string, string> = {
  DOG: '🐶',
  CAT: '🐱',
  BIRD: '🐦',
  FISH: '🐟',
}

export default function PetCard({ pet }: PetCardProps) {
  const navigate = useNavigate()
  const { addItem } = useCart()

  return (
    <Card
      className="relative card-3d overflow-hidden h-full cursor-pointer"
      onClick={() => navigate(`/pets/${pet.id}`)}
      role="article"
      aria-label={pet.name}
    >
      <div className="w-full h-48 bg-gradient-to-b from-white/30 to-gray-100">
        <CardMedia
          component="img"
          height="200"
          image={pet.primaryPhotoUrl ?? PLACEHOLDER}
          alt={pet.name}
          className="object-cover w-full h-48"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
        />
      </div>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div>
            <Typography variant="h6" component="h2" className="font-semibold">
              {pet.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pet.breed} · {pet.ageMonths < 12
                ? `${pet.ageMonths}mo`
                : `${Math.floor(pet.ageMonths / 12)}yr ${pet.ageMonths % 12}mo`}
            </Typography>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">{categoryEmoji[pet.category]}</div>
            <Chip label={pet.available ? 'Available' : 'Unavailable'} size="small" color={pet.available ? 'success' : 'default'} />
          </div>
        </div>


        <div className="mt-3 flex items-center justify-between">
          {pet.price != null && pet.price > 0 ? (
            <Typography variant="subtitle1" className="font-bold text-brand">
              {formatPeso(pet.price)}
            </Typography>
          ) : (
            <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
          )}
          <Button
            variant="contained"
            size="small"
            className="btn-brand"
            disabled={!pet.available}
            onClick={(e) => { e.stopPropagation(); addItem(pet) }}
            aria-label={pet.available ? `Add ${pet.name} to cart` : `${pet.name} unavailable`}
          >
            {pet.available ? 'Add' : 'N/A'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
