import { useState, useEffect } from 'react';
import { Container, Typography, Button, Grid, Card, CardContent, CardMedia, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Tabs, Tab, Alert } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

const roomSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price must be positive'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  image: z.string().url('Invalid image URL'),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface Room extends RoomFormData {
  id: string;
}

interface Booking {
  id: string;
  roomId: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: string;
  userName?: string;
  userEmail?: string;
}

const SellerDashboard = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [open, setOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
  });

  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, []);

  const fetchRooms = async () => {
    if (!user) return;

    try {
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('sellerId', '==', user.uid)
      );
      const snapshot = await getDocs(roomsQuery);
      const roomsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchBookings = async () => {
    if (!user) {
      console.log('No user found');
      return;
    }

    try {
      console.log('Fetching bookings for seller:', user.uid);
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('sellerId', '==', user.uid)
      );
      const snapshot = await getDocs(bookingsQuery);
      console.log('Found bookings:', snapshot.docs.length);
      console.log('Booking documents:', snapshot.docs.map(doc => doc.data()));

      if (snapshot.empty) {
        console.log('No bookings found for this seller');
        setBookings([]);
        return;
      }

      const bookingsData = await Promise.all(snapshot.docs.map(async (bookingDoc) => {
        const booking = {
          id: bookingDoc.id,
          ...bookingDoc.data()
        } as Booking;

        console.log('Processing booking:', booking);

        // Fetch user details
        const userDoc = await getDoc(doc(db, 'users', booking.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data() as { name: string; email: string };
          booking.userName = userData.name;
          booking.userEmail = userData.email;
        } else {
          console.log('User document not found for booking:', booking.id);
        }

        return booking;
      }));

      console.log('Final bookings data:', bookingsData);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setEditingRoom(null);
    reset();
  };

  const handleClose = () => {
    setOpen(false);
    setEditingRoom(null);
    reset();
  };

  const onSubmit = async (data: RoomFormData) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      if (editingRoom) {
        await updateDoc(doc(db, 'rooms', editingRoom.id), {
          ...data,
          sellerId: user.uid,
        });
      } else {
        await addDoc(collection(db, 'rooms'), {
          ...data,
          sellerId: user.uid,
          createdAt: new Date().toISOString(),
        });
      }
      handleClose();
      fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
    }
  };

  const handleDelete = async (roomId: string) => {
    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    reset(room);
    setOpen(true);
  };

  const handleBookingStatus = async (bookingId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status,
        updatedAt: new Date().toISOString(),
      });
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Seller Dashboard
          </Typography>
          <Button variant="contained" color="primary" onClick={handleOpen}>
            Add New Room
          </Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="My Rooms" />
            <Tab label="Bookings" />
          </Tabs>
        </Box>

        {tabValue === 0 ? (
          <Grid container spacing={4}>
            {rooms.map((room) => (
              <Grid item xs={12} sm={6} md={4} key={room.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={room.image}
                    alt={room.title}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                      {room.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {room.description}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ₹{room.price}/month
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {room.location}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <IconButton onClick={() => handleEdit(room)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(room.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={4}>
            {bookings.map((booking) => (
              <Grid item xs={12} key={booking.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Booking by {booking.userName || 'Unknown User'}
                      </Typography>
                      <Alert severity={booking.status === 'approved' ? 'success' : booking.status === 'rejected' ? 'error' : 'warning'}>
                        {booking.status}
                      </Alert>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Email: {booking.userEmail}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start Date: {new Date(booking.startDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      End Date: {new Date(booking.endDate).toLocaleDateString()}
                    </Typography>
                    {booking.status === 'pending' && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleBookingStatus(booking.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => handleBookingStatus(booking.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingRoom ? 'Edit Room' : 'Add New Room'}
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <TextField
                fullWidth
                label="Title"
                {...register('title')}
                error={!!errors.title}
                helperText={errors.title?.message}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Price"
                type="number"
                {...register('price', { valueAsNumber: true })}
                error={!!errors.price}
                helperText={errors.price?.message}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Location"
                {...register('location')}
                error={!!errors.location}
                helperText={errors.location?.message}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Image URL"
                {...register('image')}
                error={!!errors.image}
                helperText={errors.image?.message}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {editingRoom ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Container>
  );
};

export default SellerDashboard; 