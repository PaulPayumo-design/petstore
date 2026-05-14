import { Container, Typography, Box, Pagination, AppBar, Toolbar, Grid, Button } from '@mui/material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePets } from '../hooks/usePets'
import PetGrid from '../components/PetGrid'
import PetCardSkeleton from '../components/PetCardSkeleton'
import CategoryFilter, { VALID_CATEGORIES } from '../components/CategoryFilter'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import CartButton from '../components/CartButton'

export default function CataloguePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Sanitize: strip any category values that aren't valid
  const rawCategories = searchParams.getAll('category')
  const categories = rawCategories.filter((c) => VALID_CATEGORIES.includes(c))

  const page = parseInt(searchParams.get('page') ?? '0', 10)

  const { data, isLoading, isError, error, refetch } = usePets(categories, page)

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(value - 1))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <Typography variant="h6" className="font-bold tracking-wide">
            🐾 Petstore
          </Typography>
          <Button color="inherit" onClick={() => navigate('/admin')} sx={{ ml: 'auto', mr: 1 }}>
            Manage Pets
          </Button>
          <CartButton />
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" className="py-8">
        <Box className="flex flex-col gap-6">
          <Box>
            <Typography variant="h4" component="h1" className="font-bold mb-1">
              Find Your Perfect Pet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Browse our selection of dogs, cats, birds, and fish.
            </Typography>
          </Box>

          <CategoryFilter />

          {isLoading && (
            <Grid container spacing={3}>
              {Array.from({ length: 12 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                  <PetCardSkeleton />
                </Grid>
              ))}
            </Grid>
          )}
          {isError && (
            <ErrorState
              message={(error as Error)?.message ?? 'Failed to load pets.'}
              onRetry={() => refetch()}
            />
          )}
          {!isLoading && !isError && data && data.content.length === 0 && (
            <EmptyState categories={categories} />
          )}
          {!isLoading && !isError && data && data.content.length > 0 && (
            <>
              <Typography variant="body2" color="text.secondary">
                Showing {data.content.length} of {data.totalElements} pets
              </Typography>
              <PetGrid pets={data.content} />
              {data.totalPages > 1 && (
                <Box className="flex justify-center mt-4">
                  <Pagination
                    count={data.totalPages}
                    page={page + 1}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Container>
    </>
  )
}
