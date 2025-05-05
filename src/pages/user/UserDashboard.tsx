import { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Button, Box, Tabs, Tab, CircularProgress, Alert } from '@mui/material';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Room {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  image: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserDashboard = () => {
  const [value, setValue] = useState(0);
  const [bookedRooms, setBookedRooms] = useState<Room[]>([]);
  const [favoriteRooms, setFavoriteRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('Please login to view your dashboard');
      return;
    }
    fetchBookedRooms();
    fetchFavoriteRooms();
  }, [user]);

  const fetchBookedRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', user?.uid)
      );
      const snapshot = await getDocs(bookingsQuery);
      const roomIds = snapshot.docs.map(doc => doc.data().roomId);

      if (roomIds.length === 0) {
        setBookedRooms([]);
        setLoading(false);
        return;
      }

      // Fetch each room individually since Firestore doesn't support 'in' queries with document IDs
      const roomsPromises = roomIds.map(async (roomId) => {
        const roomDoc = await getDoc(doc(db, 'rooms', roomId));
        if (roomDoc.exists()) {
          return {
            id: roomDoc.id,
            ...roomDoc.data()
          } as Room;
        }
        return null;
      });

      const roomsData = (await Promise.all(roomsPromises)).filter(room => room !== null) as Room[];
      setBookedRooms(roomsData);
    } catch (error) {
      console.error('Error fetching booked rooms:', error);
      setError('Failed to fetch booked rooms. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavoriteRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', user?.uid)
      );
      const snapshot = await getDocs(favoritesQuery);
      const roomIds = snapshot.docs.map(doc => doc.data().roomId);

      if (roomIds.length === 0) {
        setFavoriteRooms([]);
        setLoading(false);
        return;
      }

      const roomsQuery = query(
        collection(db, 'rooms'),
        where('id', 'in', roomIds)
      );
      const roomsSnapshot = await getDocs(roomsQuery);
      const roomsData = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];

      setFavoriteRooms(roomsData);
    } catch (error) {
      console.error('Error fetching favorite rooms:', error);
      setError('Failed to fetch favorite rooms. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  if (!user) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 4 }}>
          Please login to view your dashboard
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Dashboard
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Booked Rooms" />
            <Tab label="Favorites" />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <Grid container spacing={4}>
            {bookedRooms.map((room) => (
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
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => navigate(`/room/${room.id}`)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {bookedRooms.length === 0 && (
              <Grid item xs={12}>
                <Typography align="center">
                  You haven't booked any rooms yet.
                </Typography>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Grid container spacing={4}>
            {favoriteRooms.map((room) => (
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
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => navigate(`/room/${room.id}`)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {favoriteRooms.length === 0 && (
              <Grid item xs={12}>
                <Typography align="center">
                  You haven't added any rooms to favorites yet.
                </Typography>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </Box>
    </Container>
  );
};

export default UserDashboard; 