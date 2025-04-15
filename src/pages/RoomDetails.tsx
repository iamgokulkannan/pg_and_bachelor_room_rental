import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Rating, IconButton, Alert } from '@mui/material';
import { Favorite as FavoriteIcon, FavoriteBorder as FavoriteBorderIcon } from '@mui/icons-material';
import { doc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

interface Room {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  image: string;
  sellerId: string;
}

interface Booking {
  id: string;
  roomId: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: string;
}

const RoomDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [openBooking, setOpenBooking] = useState(false);
  const [bookingDates, setBookingDates] = useState({
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [isBooked, setIsBooked] = useState(false);

  useEffect(() => {
    fetchRoomDetails();
    checkFavoriteStatus();
    fetchUserRole();
    if (user) {
      checkBookingStatus();
    }
  }, [id, user]);

  const fetchUserRole = async () => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role);
      }
    }
  };

  const checkBookingStatus = async () => {
    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user?.uid),
        where('roomId', '==', id)
      );
      const snapshot = await getDocs(bookingsQuery);
      if (!snapshot.empty) {
        const booking = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        } as Booking;

        // Log the retrieved booking data
        console.log('Retrieved booking:', booking);
        console.log('Booking dates:', {
          startDate: booking.startDate,
          endDate: booking.endDate,
          parsedStartDate: new Date(booking.startDate),
          parsedEndDate: new Date(booking.endDate)
        });

        setCurrentBooking(booking);
        setIsBooked(true);
      }
    } catch (error) {
      console.error('Error checking booking status:', error);
    }
  };

  const fetchRoomDetails = async () => {
    try {
      const roomDoc = await getDoc(doc(db, 'rooms', id!));
      if (roomDoc.exists()) {
        setRoom({ id: roomDoc.id, ...roomDoc.data() } as Room);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching room details:', error);
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user) return;

    try {
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', user.uid),
        where('roomId', '==', id)
      );
      const snapshot = await getDocs(favoritesQuery);
      setIsFavorite(!snapshot.empty);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (isFavorite) {
        const favoritesQuery = query(
          collection(db, 'favorites'),
          where('userId', '==', user.uid),
          where('roomId', '==', id)
        );
        const snapshot = await getDocs(favoritesQuery);
        snapshot.docs.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      } else {
        await addDoc(collection(db, 'favorites'), {
          userId: user.uid,
          roomId: id,
          createdAt: new Date().toISOString(),
        });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!room || !room.sellerId) {
      console.error('Room data is not available');
      return;
    }

    // Validate dates
    if (!bookingDates.startDate || !bookingDates.endDate) {
      console.error('Please select both start and end dates');
      return;
    }

    try {
      // Log the input dates
      console.log('Input dates:', {
        startDate: bookingDates.startDate,
        endDate: bookingDates.endDate
      });

      // Create Date objects and validate them
      const startDateObj = new Date(bookingDates.startDate);
      const endDateObj = new Date(bookingDates.endDate);

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        console.error('Invalid date format');
        return;
      }

      // Format dates to ISO string before saving
      const formattedStartDate = startDateObj.toISOString();
      const formattedEndDate = endDateObj.toISOString();

      // Log the formatted dates
      console.log('Formatted dates:', {
        formattedStartDate,
        formattedEndDate
      });

      const bookingData = {
        roomId: id,
        userId: user.uid,
        sellerId: room.sellerId,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Log the complete booking data
      console.log('Booking data to be saved:', bookingData);

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      console.log('Booking saved with ID:', docRef.id);

      setOpenBooking(false);
      navigate('/user');
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const handleCancelBooking = async () => {
    if (!currentBooking) return;

    try {
      await deleteDoc(doc(db, 'bookings', currentBooking.id));
      setIsBooked(false);
      setCurrentBooking(null);
      navigate('/user');
    } catch (error) {
      console.error('Error canceling booking:', error);
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!room) {
    return (
      <Container>
        <Typography>Room not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardMedia
                component="img"
                height="400"
                image={room.image}
                alt={room.title}
              />
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" component="h1">
                    {room.title}
                  </Typography>
                  {userRole !== 'seller' && !isBooked && (
                    <IconButton onClick={handleFavoriteToggle} color={isFavorite ? 'error' : 'default'}>
                      {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                  )}
                </Box>
                <Typography variant="h6" color="primary" gutterBottom>
                  ₹{room.price}/month
                </Typography>
                <Typography variant="body1" paragraph>
                  {room.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Location: {room.location}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {userRole !== 'seller' && (
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  {isBooked ? (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Your Booking
                      </Typography>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          Status: {currentBooking?.status}
                        </Typography>
                        <Typography variant="body2">
                          Start Date: {currentBooking?.startDate ? new Date(currentBooking.startDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Not set'}
                        </Typography>
                        <Typography variant="body2">
                          End Date: {currentBooking?.endDate ? new Date(currentBooking.endDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Not set'}
                        </Typography>
                      </Alert>
                      {currentBooking?.status === 'approved' ? (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            This booking has been approved. To cancel, please contact our support team at +919843463600.
                          </Typography>
                        </Alert>
                      ) : (
                        <Button
                          variant="contained"
                          color="error"
                          fullWidth
                          onClick={handleCancelBooking}
                          sx={{ mb: 2 }}
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Book This Room
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => setOpenBooking(true)}
                        sx={{ mb: 2 }}
                      >
                        Book Now
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        Contact the seller for more details or to schedule a viewing.
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {userRole !== 'seller' && !isBooked && (
          <Dialog open={openBooking} onClose={() => setOpenBooking(false)}>
            <DialogTitle>Book Room</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={bookingDates.startDate}
                onChange={(e) => setBookingDates({ ...bookingDates, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mt: 2 }}
              />
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={bookingDates.endDate}
                onChange={(e) => setBookingDates({ ...bookingDates, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenBooking(false)}>Cancel</Button>
              <Button onClick={handleBooking} variant="contained" color="primary">
                Confirm Booking
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </Container>
  );
};

export default RoomDetails; 